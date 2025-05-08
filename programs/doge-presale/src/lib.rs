use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

mod state;
mod constants;
mod errors;
mod instructions;
mod events;

use state::*;
use errors::PresaleError;
use events::*;

declare_id!("6LsqC27EVwj4RXcfxpf8WnUhGaB3tqEkXMxBwbxunzAq");

#[program]
pub mod doge_presale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, token_mint: Pubkey) -> Result<()> {
        let transaction_record = &mut ctx.accounts.transaction_record;
        transaction_record.authority = ctx.accounts.authority.key();
        transaction_record.token_mint = token_mint;
        transaction_record.current_stage = 0;
        transaction_record.transaction_count = 0;
        transaction_record.total_usd_sold = 0.0;
        transaction_record.total_tokens_sold = 0;
        transaction_record.deposit_token_amount = 0;
        transaction_record.transactions = Vec::new();
        transaction_record.buyers = Vec::new();
        
        // Emit initialization event
        emit!(PresaleInitialized {
            authority: ctx.accounts.authority.key(),
            token_mint,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        // Log initialization for debugging
        msg!("Transaction record initialized with authority: {}", ctx.accounts.authority.key());
        msg!("Token mint: {}", token_mint);
        msg!("Current stage: {}", transaction_record.current_stage);
        msg!("Transaction count: {}", transaction_record.transaction_count);
        msg!("Total USD sold: {}", transaction_record.total_usd_sold);
        msg!("Total tokens sold: {}", transaction_record.total_tokens_sold);
        msg!("Initial deposit amount: {}", transaction_record.deposit_token_amount);
        
        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, usd_amount: f64, referrer: Option<Pubkey>) -> Result<()> {
        instructions::buy(ctx, usd_amount, referrer)
    }
    
    pub fn resize(ctx: Context<Resize>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.transaction_record.authority,
            PresaleError::Unauthorized
        );
        
        // Calculate the required space with reduced capacity
        let required_space = 8 + // discriminator
            32 + // authority pubkey
            32 + // token_mint pubkey
            1 + // current_stage (u8)
            8 + // transaction_count (u64)
            8 + // total_usd_sold (f64)
            8 + // total_tokens_sold (u64)
            8 + // deposit_token_amount (u64)
            4 + // Vec length prefix for transactions
            (32 + 8 + 8 + 8 + 1 + 8) * 50 + // Space for 50 transactions
            4 + // Vec length prefix for buyers
            (32 + 8 + 8 + 8 + 8 + 8 + 1 + 32) * 50; // Space for 50 buyers (including Option<Pubkey> for referrer)

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
        
        // Emit resize event
        emit!(AccountResized {
            authority: ctx.accounts.authority.key(),
            new_size: required_space,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Account resized to {} bytes", required_space);
        
        Ok(())
    }

    pub fn next_stage(ctx: Context<NextStage>) -> Result<()> {
        instructions::next_stage(ctx)
    }

    pub fn get_buyer_info(ctx: Context<GetBuyerInfo>) -> Result<BuyerInfo> {
        let record = &ctx.accounts.transaction_record;
        
        // Find the buyer info for the given address
        let buyer_info = record.buyers
            .iter()
            .find(|info| info.buyer_address == ctx.accounts.buyer_address.key())
            .ok_or(PresaleError::BuyerNotFound)?;
            
        Ok(buyer_info.clone())
    }

    pub fn authority_buy(ctx: Context<AuthorityBuy>, usd_amount: f64, buyer_address: Pubkey) -> Result<()> {
        instructions::authority_buy(ctx, usd_amount, buyer_address)
    }

    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
        let transaction_record = &mut ctx.accounts.transaction_record;
        
        // Verify the signer is the authority
        require!(
            ctx.accounts.authority.key() == transaction_record.authority,
            PresaleError::Unauthorized
        );

        // Verify token accounts
        require!(
            ctx.accounts.from_token_account.mint == transaction_record.token_mint,
            PresaleError::InvalidTokenMint
        );
        require!(
            ctx.accounts.presale_token_account.mint == transaction_record.token_mint,
            PresaleError::InvalidTokenMint
        );
        require!(
            ctx.accounts.from_token_account.owner == ctx.accounts.authority.key(),
            PresaleError::InvalidTokenAccount
        );

        // Verify amount is greater than zero
        require!(amount > 0, PresaleError::InvalidAmount);

        // Transfer tokens to the presale token account
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from_token_account.to_account_info(),
                    to: ctx.accounts.presale_token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update deposit amount with overflow check
        transaction_record.deposit_token_amount = transaction_record.deposit_token_amount
            .checked_add(amount)
            .ok_or(PresaleError::Overflow)?;

        // Emit event for tracking
        emit!(TokenDeposited {
            authority: ctx.accounts.authority.key(),
            amount,
            total_deposited: transaction_record.deposit_token_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Tokens deposited successfully. New total: {}", transaction_record.deposit_token_amount);

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
                32 + // token_mint pubkey
                1 + // current_stage (u8)
                8 + // transaction_count (u64)
                8 + // total_usd_sold (f64)
                8 + // total_tokens_sold (u64)
                8 + // deposit_token_amount (u64)
                4 + // Vec length prefix for transactions
                (32 + 8 + 8 + 8 + 1 + 8) * 1 + // Space for 1 initial transaction
                4 + // Vec length prefix for buyers
                (32 + 8 + 8 + 8 + 8 + 8 + 1 + 32) * 1, // Space for 1 initial buyer
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

    /// CHECK: This is safe because we just transfer SOL to it
    #[account(mut)]
    pub referrer: Option<AccountInfo<'info>>,

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

#[derive(Accounts)]
pub struct GetBuyerInfo<'info> {
    /// CHECK: This is just a public key, no need to verify
    pub buyer_address: AccountInfo<'info>,
    
    #[account(
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,
}

#[derive(Accounts)]
pub struct AuthorityBuy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,
}

#[derive(Accounts)]
pub struct DepositToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,

    #[account(
        mut,
        constraint = from_token_account.owner == authority.key()
    )]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = presale_token_account.mint == transaction_record.token_mint
    )]
    pub presale_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}