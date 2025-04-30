use anchor_lang::prelude::*;

mod state;
mod constants;
mod errors;
mod instructions;

use state::*;
use errors::PresaleError;

declare_id!("3W2PH2XgGok4weSRpXEjhZ5d8cpcSz6g941yU9bkgZvF");

#[program]
pub mod doge_presale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let transaction_record = &mut ctx.accounts.transaction_record;
        transaction_record.authority = ctx.accounts.authority.key();
        transaction_record.current_stage = 0;
        transaction_record.transaction_count = 0;
        transaction_record.total_usd_sold = 0.0;
        transaction_record.total_tokens_sold = 0;
        transaction_record.transactions = Vec::new();
        transaction_record.buyers = Vec::new();
        
        // Log initialization for debugging
        msg!("Transaction record initialized with authority: {}", ctx.accounts.authority.key());
        msg!("Current stage: {}", transaction_record.current_stage);
        msg!("Transaction count: {}", transaction_record.transaction_count);
        msg!("Total USD sold: {}", transaction_record.total_usd_sold);
        msg!("Total tokens sold: {}", transaction_record.total_tokens_sold);
        
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
        
        // Calculate the required space with reduced capacity
        let required_space = 8 + // discriminator
            32 + // authority pubkey
            1 + // current_stage (u8)
            8 + // transaction_count (u64)
            8 + // total_usd_sold (f64)
            8 + // total_tokens_sold (u64)
            4 + // Vec length prefix for transactions
            (32 + 8 + 8 + 8 + 1 + 8) * 50 + // Space for 50 transactions
            4 + // Vec length prefix for buyers
            (32 + 8 + 8 + 8 + 8 + 8) * 50; // Space for 50 buyers

        // Resize the account
        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(required_space);
        
        let current_balance = ctx.accounts.transaction_record.to_account_info().lamports();
        if current_balance < new_minimum_balance {
            let additional_lamports = new_minimum_balance - current_balance;
            anchor_lang::solana_program::program::invoke(
                &anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.authority.key(),
                    &ctx.accounts.transaction_record.key(),
                    additional_lamports,
                ),
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.transaction_record.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        // Reallocate the account
        let account_info = ctx.accounts.transaction_record.to_account_info();
        account_info.realloc(required_space, false)?;
        
        msg!("Account resized to {} bytes", required_space);
        
        Ok(())
    }

    pub fn next_stage(ctx: Context<NextStage>) -> Result<()> {
        instructions::next_stage(ctx)
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
                8 + // total_usd_sold (f64)
                8 + // total_tokens_sold (u64)
                4 + // Vec length prefix for transactions
                4, // Vec length prefix for buyers
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

#[derive(Accounts)]
pub struct NextStage<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,
} 