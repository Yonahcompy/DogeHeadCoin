use anchor_lang::prelude::*;

mod state;
mod constants;
mod errors;
mod instructions;

use state::*;
use errors::PresaleError;

declare_id!("KbExbCupd7grExTAN7YG842kbutL3ERPvQWtrEg5DJ5");

#[program]
pub mod doge_presale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let transaction_record = &mut ctx.accounts.transaction_record;
        transaction_record.authority = ctx.accounts.authority.key();
        transaction_record.current_stage = 0;
        transaction_record.transaction_count = 0;
        transaction_record.transactions = Vec::new();
        
        // Log initialization for debugging
        msg!("Transaction record initialized with authority: {}", ctx.accounts.authority.key());
        msg!("Current stage: {}", transaction_record.current_stage);
        msg!("Transaction count: {}", transaction_record.transaction_count);
        
        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, usd_amount: f64) -> Result<()> {
        instructions::buy(ctx, usd_amount)
    }
    
    pub fn resize(ctx: Context<Resize>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.transaction_record.authority,
            PresaleError::Unauthorized
        );
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + // discriminator
                32 + // authority pubkey
                1 + // current_stage (u8)
                8 + // transaction_count (u64)
                4 + // Vec length prefix
                (32 + 8 + 8 + 8 + 1 + 8) * 100, // Space for 100 transactions (matching frontend)
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: This is safe because we just transfer SOL to it
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Resize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,
    
    pub system_program: Program<'info, System>,
} 