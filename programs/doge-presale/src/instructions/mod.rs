use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};

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
    
    // Set token prices for each stage (in lamports)
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

pub fn buy(ctx: Context<Buy>, amount: u64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;
    
    // Check if presale is active
    require!(
        current_time >= ctx.accounts.presale_state.start_time && current_time <= ctx.accounts.presale_state.end_time,
        PresaleError::PresaleNotStarted
    );
    
    // Check if presale is finalized
    require!(!ctx.accounts.presale_state.is_finalized, PresaleError::PresaleAlreadyFinalized);
    
    // Check if current stage is valid
    require!(ctx.accounts.presale_state.current_stage < STAGE_COUNT, PresaleError::InvalidStage);
    
    // Validate purchase amount
    require!(amount >= MIN_PURCHASE_AMOUNT, PresaleError::BelowMinimumBuy);
    require!(amount <= MAX_PURCHASE_AMOUNT, PresaleError::AboveMaximumBuy);
    
    // Calculate token amount based on current stage price
    let token_price = ctx.accounts.presale_state.token_prices[ctx.accounts.presale_state.current_stage as usize];
    let token_amount = (amount as u128)
        .checked_mul(10u128.pow(TOKEN_DECIMALS as u32))
        .ok_or(PresaleError::MathOverflow)?
        .checked_div(token_price as u128)
        .ok_or(PresaleError::MathOverflow)? as u64;
    
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
        amount,
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
    
    // Mark presale as finalized
    presale_state.is_finalized = true;
    
    Ok(())
}