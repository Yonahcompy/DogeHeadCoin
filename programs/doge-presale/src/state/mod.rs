use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

use crate::constants::*;

// Maximum number of transactions to store per user
pub const MAX_TRANSACTIONS: usize = 50;

#[account]
pub struct TransactionHistory {
    pub user: Pubkey,
    pub transaction_count: u8,
    pub transactions: Vec<Transaction>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Transaction {
    pub timestamp: i64,
    pub usd_amount: f64,
    pub token_amount: u64,
    pub stage: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VestingTier {
    pub percentage: u8,
    pub release_time: i64,
    pub claimed: bool,
}

#[account]
pub struct BuyerState {
    pub buyer: Pubkey,
    pub total_purchased: u64,
    pub claimed_tokens: u64,
    pub vesting_start_time: i64,
    pub vesting_end_time: i64,
    pub vesting_tiers: Vec<VestingTier>,
}

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
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + 32 + 8 + 8 + 8 + 8 + (4 + (VESTING_TIER_COUNT as usize * (1 + 8 + 1))),
        seeds = [b"buyer_state", buyer.key().as_ref()],
        bump
    )]
    pub buyer_state: Account<'info, BuyerState>,
    
    /// CHECK: This is no longer used as we always use the fallback price
    pub sol_price_feed: AccountInfo<'info>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + 32 + 1 + (4 + (MAX_TRANSACTIONS * (8 + 8 + 8 + 1))),
        seeds = [b"transaction_history", buyer.key().as_ref()],
        bump
    )]
    pub transaction_history: Account<'info, TransactionHistory>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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

#[derive(Accounts)]
pub struct GetTransactionHistory<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 1 + (4 + (MAX_TRANSACTIONS * (8 + 8 + 8 + 1))),
        seeds = [b"transaction_history", user.key().as_ref()],
        bump
    )]
    pub transaction_history: Account<'info, TransactionHistory>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(mut)]
    pub presale_state: Account<'info, PresaleState>,
    
    #[account(
        mut,
        constraint = buyer_state.buyer == buyer.key()
    )]
    pub buyer_state: Account<'info, BuyerState>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub presale_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
} 