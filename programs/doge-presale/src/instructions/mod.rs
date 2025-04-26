use anchor_lang::prelude::*;
use anchor_spl::token::Transfer;
use pyth_sdk_solana::load_price_feed_from_account_info;

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
    let current_time = Clock::get()?.unix_timestamp;
    let current_slot = Clock::get()?.slot;
    
    // Check if presale is active
    require!(
        current_time >= ctx.accounts.presale_state.start_time && current_time <= ctx.accounts.presale_state.end_time,
        PresaleError::PresaleNotStarted
    );
    
    // Check if presale is finalized
    require!(!ctx.accounts.presale_state.is_finalized, PresaleError::PresaleAlreadyFinalized);
    
    // Check if current stage is valid
    require!(ctx.accounts.presale_state.current_stage < STAGE_COUNT, PresaleError::InvalidStage);
    
    // Validate purchase amount in USD
    require!(usd_amount >= MIN_PURCHASE_USD, PresaleError::BelowMinimumBuy);
    require!(usd_amount <= MAX_PURCHASE_USD, PresaleError::AboveMaximumBuy);
    
    // Get SOL price from Pyth price feed
    let price_feed = load_price_feed_from_account_info(&ctx.accounts.sol_price_feed)
        .map_err(|_| error!(PresaleError::InvalidPriceFeed))?;
    
    let price_data = price_feed.get_price_no_older_than(60, current_slot)
        .ok_or(error!(PresaleError::InvalidPriceFeed))?;
    
    // Convert SOL price to a float (price is in price * 10^expo format)
    let sol_price_float = price_data.price as f64 / 10f64.powi(price_data.expo);
    
    // Convert USD amount to SOL (in lamports)
    let sol_amount = (usd_amount / sol_price_float * 1e9) as u64;
    
    // Calculate token amount based on current stage price
    let token_price = ctx.accounts.presale_state.token_prices[ctx.accounts.presale_state.current_stage as usize];
    let token_amount = (usd_amount / token_price) as u64;
    
    // Check if enough tokens are available in the current stage
    let stage_tokens = ctx.accounts.presale_state.token_amounts[ctx.accounts.presale_state.current_stage as usize];
    let new_sold_tokens = ctx.accounts.presale_state.sold_tokens.checked_add(token_amount).unwrap();
    require!(
        new_sold_tokens <= stage_tokens,
        PresaleError::NoTokensAvailable
    );
    
    // Transfer SOL from buyer to authority
    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.authority.key(),
        sol_amount,
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
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.presale_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.presale_state.to_account_info(),
        },
    );
    
    anchor_spl::token::transfer(transfer_ctx, token_amount)?;
    
    // Update presale state
    let presale_state = &mut ctx.accounts.presale_state;
    presale_state.sold_tokens = new_sold_tokens;
    
    // Check if current stage is completed
    if presale_state.sold_tokens >= presale_state.token_amounts[presale_state.current_stage as usize] {
        presale_state.current_stage = presale_state.current_stage.checked_add(1).unwrap();
    }
    
    Ok(())
}

pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
    let presale_state = &mut ctx.accounts.presale_state;
    let current_time = Clock::get()?.unix_timestamp;
    
    // Check if presale has ended
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