use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

use crate::{state::*, errors::PresaleError, constants::*};

pub fn buy(ctx: Context<crate::Buy>, usd_amount: f64) -> Result<()> {
    // Check if amount is valid
    require!(usd_amount > 0.0, PresaleError::InvalidAmount);

    // Check if we can store more transactions
    let record = &mut ctx.accounts.transaction_record;
    require!(
        record.transaction_count < MAX_TRANSACTIONS as u64,
        PresaleError::TransactionLimitReached
    );

    // Get current stage and price
    let current_stage = record.current_stage;
    require!(current_stage < STAGE_COUNT, PresaleError::InvalidStage);
    let token_price = STAGE_PRICES[current_stage as usize];

    // Calculate SOL amount from USD
    let sol_amount = (usd_amount * SOL_USD_PRICE * 1_000_000_000.0).round() as u64;

    // Calculate token amount
    let token_amount = (usd_amount / token_price * 1_000_000_000.0).round() as u64;

    // Transfer SOL from buyer to treasury
    let transfer_instruction = system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.treasury.key(),
        sol_amount,
    );

    anchor_lang::solana_program::program::invoke(
        &transfer_instruction,
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Record the transaction
    let transaction = Transaction {
        buyer: ctx.accounts.buyer.key(),
        usd_amount,
        sol_amount,
        token_amount,
        stage: current_stage,
        timestamp: Clock::get()?.unix_timestamp,
    };

    record.transactions.push(transaction);
    record.transaction_count += 1;

    Ok(())
} 