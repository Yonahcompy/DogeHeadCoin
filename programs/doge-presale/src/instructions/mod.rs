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

    // Validate purchase amount with proper precision (6 decimals for better micro-transaction handling)
    let usd_amount_precise = (usd_amount * 1_000_000.0).round() / 1_000_000.0;
    require!(
        usd_amount_precise >= MIN_PURCHASE_USD && 
        usd_amount_precise <= MAX_PURCHASE_USD,
        PresaleError::InvalidUsdAmount
    );

    // Convert USD to SOL using fallback price with proper precision
    let sol_amount = ((usd_amount_precise * LAMPORTS_PER_SOL as f64) / FALLBACK_SOL_USD_PRICE).round();
    let sol_amount_lamports = sol_amount as u64;

    // Get current stage
    let current_stage = ctx.accounts.presale_state.current_stage;
    let token_price = STAGE_PRICES[current_stage as usize];
    
    // Calculate token amount with proper precision handling for micro-transactions
    // For very small amounts, we need to ensure we get at least 1 token
    let token_amount_with_decimals = if usd_amount_precise < token_price {
        // If USD amount is less than token price, give exactly 1 token
        10u64.pow(TOKEN_DECIMALS as u32)
    } else {
        // For larger amounts, calculate normally
        // Scale to 12 decimals for intermediate calculations
        let usd_amount_scaled = (usd_amount_precise * 1_000_000_000_000.0).round() as u128;
        let token_price_scaled = (token_price * 1_000_000_000_000.0).round() as u128;
        
        // Calculate base tokens (before decimals) with full precision
        let base_token_amount = usd_amount_scaled
            .checked_div(token_price_scaled)
            .ok_or(error!(PresaleError::ArithmeticOverflow))? as u64;

        // Apply token decimals
        base_token_amount
            .checked_mul(10u64.pow(TOKEN_DECIMALS as u32))
            .ok_or(error!(PresaleError::ArithmeticOverflow))?
    };

    // Check if enough tokens are available
    require!(
        ctx.accounts.presale_state.sold_tokens.checked_add(token_amount_with_decimals)
            .map_or(false, |sum| sum <= ctx.accounts.presale_state.token_amounts[current_stage as usize]),
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

    // Initialize buyer state if it's new
    if ctx.accounts.buyer_state.buyer == Pubkey::default() {
        ctx.accounts.buyer_state.buyer = ctx.accounts.buyer.key();
        ctx.accounts.buyer_state.total_purchased = 0;
        ctx.accounts.buyer_state.claimed_tokens = 0;
        ctx.accounts.buyer_state.vesting_start_time = ctx.accounts.presale_state.end_time;
        ctx.accounts.buyer_state.vesting_end_time = ctx.accounts.presale_state.end_time + VESTING_TOTAL_DURATION;
        ctx.accounts.buyer_state.vesting_tiers = Vec::new();
        
        // Initialize vesting tiers
        for i in 0..VESTING_TIER_COUNT as usize {
            let release_time = ctx.accounts.presale_state.end_time + VESTING_TIER_DURATIONS[i];
            ctx.accounts.buyer_state.vesting_tiers.push(VestingTier {
                percentage: VESTING_TIER_PERCENTAGES[i],
                release_time,
                claimed: false,
            });
        }
    }

    // Update buyer state with purchased tokens
    ctx.accounts.buyer_state.total_purchased = ctx.accounts.buyer_state.total_purchased
        .checked_add(token_amount_with_decimals)
        .ok_or(error!(PresaleError::ArithmeticOverflow))?;

    // Update presale state
    ctx.accounts.presale_state.sold_tokens = ctx.accounts.presale_state.sold_tokens
        .checked_add(token_amount_with_decimals)
        .ok_or(error!(PresaleError::ArithmeticOverflow))?;

    // Record transaction with 6 decimal precision for USD amount
    let transaction = Transaction {
        timestamp: current_time,
        usd_amount: usd_amount_precise,
        token_amount: token_amount_with_decimals,
        stage: current_stage,
    };

    // Add transaction to history
    let transaction_history = &mut ctx.accounts.transaction_history;
    if transaction_history.transaction_count < MAX_TRANSACTIONS as u8 {
        transaction_history.transactions.push(transaction);
        transaction_history.transaction_count = transaction_history.transaction_count.checked_add(1).unwrap();
    }

    Ok(())
}

pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
    let presale_state = &mut ctx.accounts.presale_state;
    
    // Check if the presale has ended
    let current_time = Clock::get()?.unix_timestamp;
    require!(current_time > presale_state.end_time, PresaleError::PresaleEnded);
    
    // Check if presale is already finalized
    require!(!presale_state.is_finalized, PresaleError::PresaleAlreadyFinalized);
    
    // Calculate total USD raised with proper precision handling
    let current_stage = presale_state.current_stage as usize;
    let token_price = presale_state.token_prices[current_stage];
    
    // Convert sold tokens back to raw amount (without decimals) for USD calculation
    let sold_tokens_raw = presale_state.sold_tokens.checked_div(10u64.pow(TOKEN_DECIMALS as u32))
        .ok_or(error!(PresaleError::ArithmeticOverflow))?;
    
    // Calculate total USD raised
    let total_usd = (sold_tokens_raw as f64) * token_price;
    
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

pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
    // Check if presale is finalized
    require!(ctx.accounts.presale_state.is_finalized, PresaleError::PresaleNotFinalized);
    
    let current_time = Clock::get()?.unix_timestamp;
    let buyer_state = &mut ctx.accounts.buyer_state;
    
    // Check if vesting has started
    require!(current_time >= buyer_state.vesting_start_time, PresaleError::VestingNotStarted);
    
    // Calculate claimable tokens based on vesting schedule with proper precision
    let mut claimable_amount: u64 = 0;
    let total_purchased = buyer_state.total_purchased;
    
    for tier in &mut buyer_state.vesting_tiers {
        if !tier.claimed && current_time >= tier.release_time {
            // Calculate tier amount with proper precision handling
            // Convert percentage to a precise decimal representation
            let tier_amount = (total_purchased as u128)
                .checked_mul(tier.percentage as u128)
                .ok_or(error!(PresaleError::ArithmeticOverflow))?
                .checked_div(100)
                .ok_or(error!(PresaleError::ArithmeticOverflow))? as u64;
                
            claimable_amount = claimable_amount
                .checked_add(tier_amount)
                .ok_or(error!(PresaleError::ArithmeticOverflow))?;
                
            tier.claimed = true;
        }
    }
    
    // Check if there are tokens to claim
    require!(claimable_amount > 0, PresaleError::NoTokensToClaim);
    
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
        claimable_amount,
    )?;
    
    // Update claimed tokens
    buyer_state.claimed_tokens = buyer_state.claimed_tokens
        .checked_add(claimable_amount)
        .ok_or(error!(PresaleError::ArithmeticOverflow))?;
    
    Ok(())
}