use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token;

use crate::{state::*, errors::PresaleError, constants::*, events::*};

pub fn buy(ctx: Context<crate::Buy>, usd_amount: f64, referrer: Option<Pubkey>) -> Result<()> {
    // Check if amount is valid
    require!(usd_amount > 0.0, PresaleError::InvalidAmount);

    // Check if we can store more transaction/s
    let record = &mut ctx.accounts.transaction_record;
    // require!(
    //     record.transaction_count < MAX_TRANSACTION/S as u64,
    //     PresaleError::TransactionLimitReached
    // );

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
    // record.transaction/s.push(transactio/n);
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

    // Emit purchase event
    emit!(TokensPurchased {
        buyer: buyer_key,
        usd_amount,
        sol_amount,
        token_amount,
        stage: current_stage,
        timestamp: Clock::get()?.unix_timestamp,
        referrer,
    });

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

    // Check if we can store more transaction/s
    let record = &mut ctx.accounts.transaction_record;
    // require!(
    //     record.transaction_count < MAX_TRANSACTION/S as u64,
    //     PresaleError::TransactionLimitReached
    // );

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
    // record.transactio/ns.push(transactio/n);
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

pub fn claim_tokens(ctx: Context<crate::ClaimTokens>) -> Result<()> {
    let buyer_key = ctx.accounts.buyer.key();
    let current_time = Clock::get()?.unix_timestamp;
    
    // Get the transaction record info first
    let transaction_record_info = ctx.accounts.transaction_record.to_account_info();
    let record = &mut ctx.accounts.transaction_record;

    // Get necessary values before mutable borrow
    let presale_end_time = record.presale_end_time;
    let deposit_token_amount = record.deposit_token_amount;
    let presale_ended = presale_end_time > 0;

    // Find buyer info
    let buyer_index = record.buyers
        .iter()
        .position(|info| info.buyer_address == buyer_key)
        .ok_or(PresaleError::BuyerNotFound)?;

    // Get all necessary buyer info up front
    let total_tokens = record.buyers[buyer_index].total_tokens_bought;
    let already_claimed = record.buyers[buyer_index].total_tokens_claimed;
    let last_claim_timestamp = record.buyers[buyer_index].last_claim_timestamp;

    // If presale hasn't ended, check if this is the first claim
    if !presale_ended && already_claimed == 0 {
        // Calculate 3% of total tokens
        let initial_claim_amount = (total_tokens as f64 * 0.03).round() as u64;
        
        // Check if there are tokens to claim
        require!(initial_claim_amount > 0, PresaleError::NoTokensToClaim);

        // Check if presale account has enough tokens
        require!(
            deposit_token_amount >= initial_claim_amount,
            PresaleError::InsufficientTokens
        );

        // Get PDA bump from the account
        let bump = ctx.bumps.transaction_record;

        // Create PDA seeds array
        let seeds = &[b"transaction_record" as &[u8], &[bump]];
        let signer_seeds = &[&seeds[..]];

        // Transfer tokens to buyer using PDA signer
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.presale_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: transaction_record_info,
            },
            signer_seeds,
        );

        token::transfer(transfer_ctx, initial_claim_amount)?;

        // Update buyer's claimed amount
        let buyer_info = &mut record.buyers[buyer_index];
        buyer_info.total_tokens_claimed = initial_claim_amount;
        buyer_info.last_claim_timestamp = current_time;

        // Update deposit amount
        record.deposit_token_amount = deposit_token_amount
            .checked_sub(initial_claim_amount)
            .ok_or(PresaleError::ArithmeticOverflow)?;

        // Calculate remaining balance
        let remaining_balance = total_tokens.checked_sub(initial_claim_amount)
            .ok_or(PresaleError::ArithmeticOverflow)?;

        // Emit claim event
        emit!(TokensClaimed {
            buyer: buyer_key,
            amount: initial_claim_amount,
            total_claimed: initial_claim_amount,
            remaining_balance,
            timestamp: current_time,
        });

        msg!("Initial 3% tokens claimed successfully");
        msg!("Amount claimed: {}", initial_claim_amount);
        msg!("Total claimed: {}", initial_claim_amount);
        msg!("Remaining balance: {}", remaining_balance);
        msg!("Remaining deposit amount: {}", record.deposit_token_amount);

        return Ok(());
    }

    // If presale has ended or user already claimed initial 3%, follow the regular vesting schedule
    require!(presale_ended, PresaleError::PresaleNotEnded);

    // Calculate time since presale ended
    let time_since_presale_end = current_time - presale_end_time;
    let days_since_presale_end = time_since_presale_end / (24 * 60 * 60); // Convert seconds to days

    // Check if user has already claimed in this time section
    let last_claim_days = if last_claim_timestamp > 0 {
        (last_claim_timestamp - presale_end_time) / (24 * 60 * 60)
    } else {
        0
    };

    // Determine which time section the user is in and if they've already claimed in this section
    let current_section = if days_since_presale_end <= CLAIM_SCHEDULE[0].0 {
        0 // First section (0-30 days)
    } else if days_since_presale_end <= CLAIM_SCHEDULE[1].0 {
        1 // Second section (31-60 days)
    } else if days_since_presale_end <= CLAIM_SCHEDULE[2].0 {
        2 // Third section (61-100 days)
    } else {
        3 // Final section (after 100 days)
    };

    let last_claim_section = if last_claim_days <= CLAIM_SCHEDULE[0].0 {
        0
    } else if last_claim_days <= CLAIM_SCHEDULE[1].0 {
        1
    } else if last_claim_days <= CLAIM_SCHEDULE[2].0 {
        2
    } else {
        3
    };

    // Check if user is trying to claim in the same section
    require!(current_section > last_claim_section, PresaleError::AlreadyClaimedInSection);

    // Determine claimable amount based on time period
    let claimable_amount = if days_since_presale_end <= CLAIM_SCHEDULE[0].0 {
        // First period (0-30 days): 10%
        let period_amount = (total_tokens as f64 * CLAIM_SCHEDULE[0].1) as u64;
        if already_claimed < period_amount {
            period_amount - already_claimed
        } else {
            0
        }
    } else if days_since_presale_end <= CLAIM_SCHEDULE[1].0 {
        // Second period (31-60 days): 30%
        let period_amount = (total_tokens as f64 * CLAIM_SCHEDULE[1].1) as u64;
        if already_claimed < period_amount {
            period_amount - already_claimed
        } else {
            0
        }
    } else if days_since_presale_end <= CLAIM_SCHEDULE[2].0 {
        // Third period (61-100 days): 40%
        let period_amount = (total_tokens as f64 * CLAIM_SCHEDULE[2].1) as u64;
        if already_claimed < period_amount {
            period_amount - already_claimed
        } else {
            0
        }
    } else {
        // After 100 days: remaining tokens
        total_tokens.checked_sub(already_claimed).unwrap_or(0)
    };

    // Check if there are tokens to claim
    require!(claimable_amount > 0, PresaleError::NoTokensToClaim);

    // Check if presale account has enough tokens
    require!(
        deposit_token_amount >= claimable_amount,
        PresaleError::InsufficientTokens
    );

    // Get PDA bump from the account
    let bump = ctx.bumps.transaction_record;

    // Create PDA seeds array
    let seeds = &[b"transaction_record" as &[u8], &[bump]];
    let signer_seeds = &[&seeds[..]];

    // Transfer tokens to buyer using PDA signer
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.presale_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: transaction_record_info,
        },
        signer_seeds,
    );

    token::transfer(transfer_ctx, claimable_amount)?;

    // Update buyer's claimed amount and deposit amount
    let new_total_claimed = already_claimed.checked_add(claimable_amount)
        .ok_or(PresaleError::ArithmeticOverflow)?;

    let buyer_info = &mut record.buyers[buyer_index];
    buyer_info.total_tokens_claimed = new_total_claimed;
    buyer_info.last_claim_timestamp = current_time;

    // Update deposit amount
    record.deposit_token_amount = deposit_token_amount
        .checked_sub(claimable_amount)
        .ok_or(PresaleError::ArithmeticOverflow)?;

    // Calculate remaining balance
    let remaining_balance = total_tokens
        .checked_sub(new_total_claimed)
        .ok_or(PresaleError::ArithmeticOverflow)?;

    // Emit claim event
    emit!(TokensClaimed {
        buyer: buyer_key,
        amount: claimable_amount,
        total_claimed: new_total_claimed,
        remaining_balance,
        timestamp: current_time,
    });

    msg!("Tokens claimed successfully");
    msg!("Amount claimed: {}", claimable_amount);
    msg!("Total claimed: {}", new_total_claimed);
    msg!("Remaining balance: {}", remaining_balance);
    msg!("Remaining deposit amount: {}", record.deposit_token_amount);
    msg!("Days since presale end: {}", days_since_presale_end);
    msg!("Current section: {}", current_section);

    Ok(())
}

pub fn end_presale(ctx: Context<crate::EndPresale>) -> Result<()> {
    // Verify the signer is the authority
    require!(
        ctx.accounts.authority.key() == ctx.accounts.transaction_record.authority,
        PresaleError::Unauthorized
    );

    let record = &mut ctx.accounts.transaction_record;
    let current_time = Clock::get()?.unix_timestamp;

    // Set presale end time
    record.presale_end_time = current_time;

    // Emit event for tracking
    emit!(PresaleEnded {
        authority: ctx.accounts.authority.key(),
        timestamp: current_time,
        total_buyers: record.buyers.len() as u64,
        total_tokens_sold: record.total_tokens_sold,
    });

    msg!("Presale ended successfully");
    msg!("Total buyers: {}", record.buyers.len());
    msg!("Total tokens sold: {}", record.total_tokens_sold);

    Ok(())
}

pub fn change_authority(ctx: Context<crate::ChangeAuthority>, new_authority: Pubkey) -> Result<()> {
    // Verify the signer is the current authority
    require!(
        ctx.accounts.authority.key() == ctx.accounts.transaction_record.authority,
        PresaleError::Unauthorized
    );

    let record = &mut ctx.accounts.transaction_record;
    
    // Store the old authority for the event
    let old_authority = record.authority;

    // Update the authority
    record.authority = new_authority;

    // Emit event for tracking
    emit!(AuthorityChanged {
        old_authority,
        new_authority,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Authority changed successfully from {} to {}", old_authority, new_authority);

    Ok(())
} 