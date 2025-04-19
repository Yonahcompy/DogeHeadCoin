// use solana_program::program::invoke;

use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token::{self
            // ,Transfer
            },
    },
};

// use solana_program::rent::Rent;

use crate::state::PresaleInfo;
use crate::errors::PresaleError;
use crate::constants::PRESALE_SEED;

pub fn deposit_token(
    ctx: Context<DepositToken>,
    amount: u64,
) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;
    let token_account = &ctx.accounts.token_account;
    let presale_token_account = &ctx.accounts.presale_token_account;
    
    // Validate amount
    if amount == 0 {
        return Err(PresaleError::InvalidAmount.into());
    }
    
    // Check if presale is already live
    // if presale_info.is_live {
    //     return Err(PresaleError::PresaleAlreadyStarted.into());
    // }
    
    // Validate token accounts
    if token_account.mint != presale_info.token_mint_address {
        return Err(PresaleError::InvalidTokenMint.into());
    }
    
    if presale_token_account.mint != presale_info.token_mint_address {
        return Err(PresaleError::InvalidPresaleTokenAccount.into());
    }
    
    // Check token account ownership
    if token_account.owner != ctx.accounts.authority.key() {
        return Err(PresaleError::InvalidTokenAccountOwner.into());
    }
    
    // Check token balance
    if token_account.amount < amount {
        return Err(PresaleError::InsufficientTokenBalance.into());
    }
    
    // Update presale info with overflow protection
    presale_info.deposit_token_amount = presale_info.deposit_token_amount
        .checked_add(amount)
        .ok_or(PresaleError::MathOverflow)?;
    
    // Transfer tokens from depositor to presale vault
    let cpi_accounts = token::Transfer {
        from: token_account.to_account_info(),
        to: presale_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    msg!("Deposited {} tokens to presale", amount);
    msg!("Total deposited: {}", presale_info.deposit_token_amount);
    
    Ok(())
}

#[derive(Accounts)]
pub struct DepositToken<'info> {
    #[account(
        mut,
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,
    
    /// CHECK: This is the authority that controls the presale
    #[account(
        mut,
        constraint = presale_info.authority == authority.key()
    )]
    pub authority: Signer<'info>,
    
    /// The token owner (Address B)
    #[account(mut)]
    pub token_owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = token_account.mint == presale_info.token_mint_address,
        constraint = token_account.owner == authority.key()
    )]
    pub token_account: Account<'info, token::TokenAccount>,
    
    #[account(
        mut,
        constraint = presale_token_account.mint == presale_info.token_mint_address,
    )]
    pub presale_token_account: Account<'info, token::TokenAccount>,
    
    pub token_program: Program<'info, token::Token>,
    pub system_program: Program<'info, System>,
}
