use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{state::*, errors::PresaleError, constants::*, events::*};

pub fn buy(ctx: Context<crate::Buy>, usd_amount: f64, referrer: Option<Pubkey>) -> Result<()> {
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

    // Validate referrer if provided
    if let Some(ref referrer_pubkey) = referrer {
        // Check if referrer is a valid Solana address
        require!(
            referrer_pubkey != &ctx.accounts.buyer.key(),
            PresaleError::InvalidReferrer
        );
        msg!("Valid referrer provided: {}", referrer_pubkey);
    }

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

    // Check if buyer already exists.
    let buyer_key = ctx.accounts.buyer.key();
    let existing_buyer = record.buyers.iter().find(|info| info.buyer_address == buyer_key);
    
    // Process SOL transfer based on whether this is a first purchase or subsequent purchase
    if let Some(buyer) = existing_buyer {
        // This is a subsequent purchase
        if let Some(referrer_address) = buyer.referrer {
            // Calculate referral reward (2% of sol_amount)
            let referral_reward = (sol_amount as f64 * 0.02).round() as u64;
            let treasury_amount = sol_amount - referral_reward;

            // Transfer referral reward to referrer
            let referral_transfer = system_instruction::transfer(
                &ctx.accounts.buyer.key(),
                &referrer_address,
                referral_reward,
            );

            anchor_lang::solana_program::program::invoke(
                &referral_transfer,
                &[
                    ctx.accounts.buyer.to_account_info(),
                    ctx.accounts.referrer.as_ref().unwrap().to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;

            // Transfer remaining amount to treasury
            let treasury_transfer = system_instruction::transfer(
                &ctx.accounts.buyer.key(),
                &ctx.accounts.treasury.key(),
                treasury_amount,
            );

            anchor_lang::solana_program::program::invoke(
                &treasury_transfer,
                &[
                    ctx.accounts.buyer.to_account_info(),
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;

            msg!("Processed referral reward: {} lamports to referrer", referral_reward);
            msg!("Sent {} lamports to treasury", treasury_amount);
        } else {
            // No referrer, send all to treasury
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
        }
    } else {
        // This is a first purchase - send all to treasury regardless of referrer
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
    }

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
    if let Some(buyer_info) = record.buyers.iter_mut().find(|info| info.buyer_address == buyer_key) {
        buyer_info.total_paid_usd += usd_amount;
        buyer_info.total_paid_sol += sol_amount;
        buyer_info.total_tokens_bought += token_amount;
        
        // Log buyer information
        msg!("Buyer total paid USD: {}", buyer_info.total_paid_usd);
        msg!("Buyer total tokens bought: {}", buyer_info.total_tokens_bought);
    } else {
        // Create new buyer info with referrer if provided
        let new_info = BuyerInfo {
            buyer_address: buyer_key,
            total_paid_usd: usd_amount,
            total_paid_sol: sol_amount,
            total_tokens_bought: token_amount,
            total_tokens_claimed: 0,
            last_claim_timestamp: 0,
            referrer,
        };
        record.buyers.push(new_info);
        
        // Log new buyer information
        msg!("New buyer added. Total paid USD: {}", usd_amount);
        msg!("New buyer total tokens bought: {}", token_amount);
        if let Some(ref referrer) = referrer {
            msg!("Referrer: {}", referrer);
        }
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

pub fn authority_buy(ctx: Context<crate::AuthorityBuy>, usd_amount: f64, buyer_address: Pubkey) -> Result<()> {
    // Verify the signer is the authority
    require!(
        ctx.accounts.authority.key() == ctx.accounts.transaction_record.authority,
        PresaleError::Unauthorized
    );

    // Check if amount is valid.
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

    // Calculate SOL amount from USD (for record keeping only)
    let sol_amount = (usd_amount * SOL_USD_PRICE * 1_000_000_000.0).round() as u64;

    // Calculate token amount
    let token_amount = (usd_amount / token_price * 1_000_000_000.0).round() as u64;

    // Log the transaction details for debugging
    msg!("Recording purchase for address: {}", buyer_address);
    msg!("USD amount: {}", usd_amount);
    msg!("Token amount: {}", token_amount);
    msg!("Current stage: {}", current_stage);
    msg!("Token price: {}", token_price);

    // Check if buyer already exists
    let _existing_buyer = record.buyers.iter().find(|info| info.buyer_address == buyer_address);
    
    // Record the transaction
    let transaction = Transaction {
        buyer: buyer_address,
        usd_amount,
        sol_amount,
        token_amount,
        stage: current_stage,
        timestamp: Clock::get()?.unix_timestamp,
    };

    // Update record totals
    record.total_usd_sold += usd_amount;
    record.total_tokens_sold += token_amount;
    record.transactions.push(transaction);
    record.transaction_count += 1;

    // Update buyer information
    if let Some(buyer_info) = record.buyers.iter_mut().find(|info| info.buyer_address == buyer_address) {
        buyer_info.total_paid_usd += usd_amount;
        buyer_info.total_paid_sol += sol_amount;
        buyer_info.total_tokens_bought += token_amount;
        
        msg!("Updated existing buyer. Total paid USD: {}", buyer_info.total_paid_usd);
        msg!("Total tokens bought: {}", buyer_info.total_tokens_bought);
    } else {
        // Create new buyer info without referrer
        let new_info = BuyerInfo {
            buyer_address,
            total_paid_usd: usd_amount,
            total_paid_sol: sol_amount,
            total_tokens_bought: token_amount,
            total_tokens_claimed: 0,
            last_claim_timestamp: 0,
            referrer: None,
        };
        record.buyers.push(new_info);
        
        msg!("New buyer added. Total paid USD: {}", usd_amount);
        msg!("Total tokens bought: {}", token_amount);
    }

    Ok(())
}

pub fn deposit_token(ctx: Context<crate::DepositToken>, amount: u64) -> Result<()> {
    let transaction_record = &mut ctx.accounts.transaction_record;
    
    // Verify the signer is the authority
    require!(
        ctx.accounts.authority.key() == transaction_record.authority,
        PresaleError::Unauthorized
    );

    // Verify mint account matches the transaction record
    require!(
        ctx.accounts.mint_account.key() == transaction_record.token_mint,
        PresaleError::InvalidTokenMint
    );

    // Verify amount is greater than zero
    require!(amount > 0, PresaleError::InvalidAmount);

    // Log the deposit details for debugging
    msg!("Depositing tokens from authority: {}", ctx.accounts.authority.key());
    msg!("Amount: {}", amount);
    msg!("From token account: {}", ctx.accounts.from_token_account.key());
    msg!("To token account: {}", ctx.accounts.presale_token_account.key());

    // Transfer tokens to the presale token account
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
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

pub fn change_token_mint(ctx: Context<crate::ChangeTokenMint>, new_token_mint: Pubkey) -> Result<()> {
    let transaction_record = &mut ctx.accounts.transaction_record;
    
    // Verify the signer is the authority
    require!(
        ctx.accounts.authority.key() == transaction_record.authority,
        PresaleError::Unauthorized
    );

    // Verify the new mint is different from the current one
    require!(
        new_token_mint != transaction_record.token_mint,
        PresaleError::InvalidTokenMint
    );

    // Store the old mint for the event
    let old_token_mint = transaction_record.token_mint;

    // Update the token mint
    transaction_record.token_mint = new_token_mint;

    // Emit event for tracking
    emit!(TokenMintChanged {
        authority: ctx.accounts.authority.key(),
        old_token_mint,
        new_token_mint,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Token mint changed successfully from {} to {}", old_token_mint, new_token_mint);

    Ok(())
} 