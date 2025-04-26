use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

use crate::constants::*;

#[account]
pub struct PresaleState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub token_account: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub current_stage: u8,
    pub token_prices: [f64; STAGE_COUNT as usize],
    pub token_amounts: [u64; STAGE_COUNT as usize],
    pub sold_tokens: u64,
    pub is_finalized: bool,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + (STAGE_COUNT as usize * 8) + (STAGE_COUNT as usize * 8) + 8 + 1
    )]
    pub presale_state: Account<'info, PresaleState>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = presale_state,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = authority.key() == presale_state.authority
    )]
    pub presale_state: Account<'info, PresaleState>,
    
    #[account(mut)]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub presale_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(mut)]
    pub presale_state: Account<'info, PresaleState>,
    
    /// CHECK: This is the authority that receives the SOL
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub presale_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is the Pyth price feed account for SOL/USD
    pub sol_price_feed: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = authority.key() == presale_state.authority
    )]
    pub presale_state: Account<'info, PresaleState>,
} 