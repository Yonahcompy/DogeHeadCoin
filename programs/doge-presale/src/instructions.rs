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

    // Log the transaction details for debugging
    msg!("Buying tokens with USD amount: {}", usd_amount);
    msg!("SOL amount: {}", sol_amount);
    msg!("Token amount: {}", token_amount);
    msg!("Current stage: {}", current_stage);
    msg!("Token price: {}", token_price);

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

    // Update record totals first
    record.total_usd_sold += usd_amount;
    record.total_tokens_sold += token_amount;
    record.transactions.push(transaction);
    record.transaction_count += 1;

    // Log the transaction details
    msg!("Transaction recorded successfully. New count: {}", record.transaction_count);
    msg!("Total USD sold: {}", record.total_usd_sold);
    msg!("Total tokens sold: {}", record.total_tokens_sold);

    // Update buyer information
    let buyer_key = ctx.accounts.buyer.key();
    if let Some(buyer_info) = record.buyers.iter_mut().find(|info| info.buyer_address == buyer_key) {
        buyer_info.total_paid_usd += usd_amount;
        buyer_info.total_paid_sol += sol_amount;
        buyer_info.total_tokens_bought += token_amount;
        
        // Log buyer information
        msg!("Buyer total paid USD: {}", buyer_info.total_paid_usd);
        msg!("Buyer total tokens bought: {}", buyer_info.total_tokens_bought);
    } else {
        // Create new buyer info
        let new_info = BuyerInfo {
            buyer_address: buyer_key,
            total_paid_usd: usd_amount,
            total_paid_sol: sol_amount,
            total_tokens_bought: token_amount,
            total_tokens_claimed: 0,
            last_claim_timestamp: 0,
        };
        record.buyers.push(new_info);
        
        // Log new buyer information
        msg!("New buyer added. Total paid USD: {}", usd_amount);
        msg!("New buyer total tokens bought: {}", token_amount);
    }

    Ok(())
}

pub fn next_stage(ctx: Context<crate::NextStage>) -> Result<()> {
    // Verify the signer is the authority
    require!(
        ctx.accounts.authority.key() == ctx.accounts.transaction_record.authority,
        PresaleError::Unauthorized
    );

    let record = &mut ctx.accounts.transaction_record;
    
    // Check if we can advance to next stage
    require!(
        record.current_stage < STAGE_COUNT - 1,
        PresaleError::InvalidStage
    );

    // Advance to next stage
    record.current_stage += 1;

    // Log the stage advancement
    msg!("Advanced to stage {}", record.current_stage);
    msg!("New token price: {}", STAGE_PRICES[record.current_stage as usize]);

    Ok(())
} 