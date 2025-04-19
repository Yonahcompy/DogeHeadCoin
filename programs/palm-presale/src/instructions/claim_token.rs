use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token::{self, Transfer},
        associated_token,
    },
};

use crate::errors::PresaleError;
use crate::state::{PresaleInfo, UserInfo};

pub fn claim_token(ctx: Context<ClaimToken>) -> Result<()> {
    let presale_info = &ctx.accounts.presale_info;
    let user_info = &mut ctx.accounts.user_info;

    // Check if softcap is reached (minimum tokens sold)
    require!(
        presale_info.sold_token_amount >= presale_info.min_token_amount,
        PresaleError::SoftcapNotReached
    );

    // Check if user has tokens to claim
    require!(user_info.buy_token_amount > 0, PresaleError::NoTokensToClaim);

    // Transfer tokens from vault to user
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.presale_presale_token_associated_token_account.to_account_info(),
            to: ctx.accounts.buyer_presale_token_associated_token_account.to_account_info(),
            authority: ctx.accounts.presale_info.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, user_info.buy_token_amount)?;

    // Update user info
    user_info.buy_token_amount = 0;
    user_info.claimed = true;

    msg!("Claimed {} tokens", user_info.buy_token_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimToken<'info> {
    // Presale token accounts
    #[account(mut)]
    pub presale_token_mint_account: Box<Account<'info, token::Mint>>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = presale_token_mint_account,
        associated_token::authority = buyer,
    )]
    pub buyer_presale_token_associated_token_account: Box<Account<'info, token::TokenAccount>>,
    
    #[account(
        mut,
        associated_token::mint = presale_token_mint_account,
        associated_token::authority = presale_info,
    )]
    pub presale_presale_token_associated_token_account: Box<Account<'info, token::TokenAccount>>,

    #[account(
        mut,
        seeds = [b"USER_SEED"],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    #[account(
        mut,
        seeds = [b"PRESALE_SEED"],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,
    
    pub presale_authority: SystemAccount<'info>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}