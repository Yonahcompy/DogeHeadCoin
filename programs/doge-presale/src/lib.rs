use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token,
};
use solana_program::pubkey;

mod state;
mod constants;
mod errors;
mod instructions;
mod events;

use state::{TransactionRecord, BuyerInfo};
use errors::PresaleError;
use events::*;

// Add these constants for token program IDs
const TOKEN_PROGRAM_ID: Pubkey = pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID: Pubkey = pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

declare_id!("7pFUVAWGA8KzhZvDz5GRYi8JVkshrcHYbVYCBwZnBkJG");

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
            new_size: required_space as u64,  // Convert usize to u64
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
        instructions::deposit_token(ctx, amount)
    }

    pub fn change_token_mint(ctx: Context<ChangeTokenMint>, new_token_mint: Pubkey) -> Result<()> {
        instructions::change_token_mint(ctx, new_token_mint)
    }

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        instructions::claim_tokens(ctx)
    }
}

// Helper function for PDA derivation
pub fn get_transaction_record_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"transaction_record"],
        program_id,
    )
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

    pub mint_account: Account<'info, Mint>,

    #[account(
        mut,
        constraint = from_token_account.owner == authority.key(),
        constraint = from_token_account.mint == mint_account.key()
    )]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint_account,
        associated_token::authority = transaction_record,
        constraint = presale_token_account.key() == associated_token::get_associated_token_address(
            &transaction_record.key(),
            &mint_account.key()
        )
    )]
    pub presale_token_account: Account<'info, TokenAccount>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}

#[derive(Accounts)]
pub struct ChangeTokenMint<'info> {
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
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"transaction_record"],
        bump
    )]
    pub transaction_record: Account<'info, TransactionRecord>,

    pub mint_account: Account<'info, Mint>,

    #[account(
        mut,
        constraint = presale_token_account.owner == transaction_record.key(),
        constraint = presale_token_account.mint == mint_account.key()
    )]
    pub presale_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint_account,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}