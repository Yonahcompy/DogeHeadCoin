use anchor_lang::prelude::*;
use anchor_spl::token::Transfer;
use solana_program::native_token::LAMPORTS_PER_SOL;

use crate::{constants::*, errors::PresaleError, state::*};

pub fn initialize(
    ctx: Context<Initialize>,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    let presale_state = &mut ctx.accounts.presale_state;
    
    // Set up the presale state
    presale_state.authority = ctx.accounts.authority.key();
    presale_state.token_mint = ctx.accounts.token_mint.key();
    presale_state.token_account = ctx.accounts.token_account.key();
    presale_state.start_time = start_time;
    presale_state.end_time = end_time;
    presale_state.current_stage = 0;
    
    // Set token prices for each stage (in USD)
    presale_state.token_prices = STAGE_PRICES;
    
    // Set token amounts for each stage
    presale_state.token_amounts = STAGE_TOKEN_AMOUNTS;
    
    presale_state.sold_tokens = 0;
    presale_state.is_finalized = false;
    
    Ok(())
}

pub fn deposit_tokens(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
    // Transfer tokens from authority to presale token account
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.authority_token_account.to_account_info(),
            to: ctx.accounts.presale_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    
    anchor_spl::token::transfer(transfer_ctx, amount)?;
    
    Ok(())
}

pub fn buy(ctx: Context<Buy>, usd_amount: f64) -> Result<()> {
    // Check if presale is active
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time >= ctx.accounts.presale_state.start_time && 
        current_time <= ctx.accounts.presale_state.end_time,
        PresaleError::PresaleNotActive
    );

    // Check if presale is finalized
    require!(!ctx.accounts.presale_state.is_finalized, PresaleError::PresaleFinalized);

    // Validate purchase amount
    require!(
        usd_amount >= MIN_PURCHASE_USD && usd_amount <= MAX_PURCHASE_USD,
        PresaleError::InvalidUsdAmount
    );

    // Convert USD to SOL using fallback price
    let sol_amount = (usd_amount / FALLBACK_SOL_USD_PRICE) * LAMPORTS_PER_SOL as f64;
    let sol_amount_lamports = sol_amount as u64;

    // Get current stage
    let current_stage = ctx.accounts.presale_state.current_stage;
    let token_price = STAGE_PRICES[current_stage as usize];
    let token_amount = (usd_amount / token_price) * 10f64.powi(TOKEN_DECIMALS as i32);
    let token_amount_raw = token_amount as u64;

    // Check if enough tokens are available
    require!(
        ctx.accounts.presale_state.sold_tokens + token_amount_raw <= ctx.accounts.presale_state.token_amounts[current_stage as usize],
        PresaleError::InsufficientTokens
    );

    // Transfer SOL from buyer to authority
    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.authority.key(),
        sol_amount_lamports,
    );

    anchor_lang::solana_program::program::invoke(
        &transfer_ix,
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Transfer tokens from presale to buyer
    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.presale_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.presale_state.to_account_info(),
            },
        ),
        token_amount_raw,
    )?;

    // Update presale state
    ctx.accounts.presale_state.sold_tokens = ctx.accounts.presale_state.sold_tokens.checked_add(token_amount_raw).unwrap();

    // Record transaction
    let transaction = Transaction {
        timestamp: current_time,
        usd_amount,
        token_amount: token_amount_raw,
        stage: current_stage,
    };

    // Initialize transaction history if needed
    if ctx.accounts.transaction_history.transaction_count == 0 {
        ctx.accounts.transaction_history.user = ctx.accounts.buyer.key();
        ctx.accounts.transaction_history.transactions = Vec::new();
    }

    // Add transaction to history
    if ctx.accounts.transaction_history.transactions.len() < MAX_TRANSACTIONS {
        ctx.accounts.transaction_history.transactions.push(transaction);
    } else {
        // Remove oldest transaction and add new one
        ctx.accounts.transaction_history.transactions.remove(0);
        ctx.accounts.transaction_history.transactions.push(transaction);
    }

    ctx.accounts.transaction_history.transaction_count = ctx.accounts.transaction_history.transaction_count.checked_add(1).unwrap();

    Ok(())
}

pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
    let presale_state = &mut ctx.accounts.presale_state;
    
    // Check if the presale has ended
    let current_time = Clock::get()?.unix_timestamp;
    require!(current_time > presale_state.end_time, PresaleError::PresaleEnded);
    
    // Check if presale is already finalized
    require!(!presale_state.is_finalized, PresaleError::PresaleAlreadyFinalized);
    
    // Calculate total USD raised
    let current_stage = presale_state.current_stage as usize;
    let token_price = presale_state.token_prices[current_stage];
    let total_usd = presale_state.sold_tokens as f64 * token_price;
    
    // Check if soft cap was reached
    require!(total_usd >= SOFT_CAP_USD, PresaleError::SoftCapNotReached);
    
    // Mark presale as finalized
    presale_state.is_finalized = true;
    
    Ok(())
}

pub fn get_transaction_history(ctx: Context<GetTransactionHistory>) -> Result<Vec<Transaction>> {
    // Initialize transaction history if needed
    if ctx.accounts.transaction_history.transaction_count == 0 {
        ctx.accounts.transaction_history.user = ctx.accounts.user.key();
        ctx.accounts.transaction_history.transactions = Vec::new();
    }
    
    Ok(ctx.accounts.transaction_history.transactions.clone())
}