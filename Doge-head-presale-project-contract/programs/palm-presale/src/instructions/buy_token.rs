use {
    anchor_lang::{prelude::*, system_program},
    anchor_spl::{
        token,
        associated_token,
    },
};

use solana_program::clock::Clock;

use crate::state::PresaleInfo;
use crate::state::PresaleStage;
use crate::state::UserInfo;
use crate::state::ReferralInfo;
use crate::constants::{REFERRER_REWARD_BPS, REFEREE_REWARD_BPS, BPS_DENOMINATOR};
use crate::errors::PresaleError;

pub fn buy_token(
    ctx: Context<BuyToken>,
    quote_amount: u64,
    referrer_address: Option<Pubkey>,
) -> Result<()> {
    
    let presale_info = &mut ctx.accounts.presale_info;
    let user_info = &mut ctx.accounts.user_info;
    let presale_vault = &mut ctx.accounts.presale_vault;
    let cur_timestamp = u64::try_from(Clock::get()?.unix_timestamp).unwrap();

    // Check if presale is live
    if !presale_info.is_live {
        return Err(PresaleError::PresaleNotStarted.into());
    }

    // Get the current active stage
    let stage_number = presale_info.current_stage;
    if stage_number == 0 {
        return Err(PresaleError::PresaleNotStarted.into());
    }

    // Check if the stage is active
    let presale_stage = &mut ctx.accounts.presale_stage;
    if !presale_stage.is_active {
        return Err(PresaleError::StageNotActive.into());
    }

    // Calculate token amount based on quote amount and stage price
    let token_amount = quote_amount
        .checked_div(presale_stage.price_per_token)
        .ok_or(PresaleError::MathOverflow)?;

    // compare the rest tokens in the stage with the token_amount
    if token_amount > presale_stage.available_tokens - presale_stage.tokens_sold {
        msg!("token amount: {}", token_amount);
        msg!("rest token amount in stage: {}", presale_stage.available_tokens - presale_stage.tokens_sold);
        return Err(PresaleError::InsufficientFund.into())
    }

    // limit the token_amount per address
    if presale_info.max_token_amount_per_address < (user_info.buy_token_amount + token_amount) {
        msg!("max token amount per address: {}", presale_info.max_token_amount_per_address);
        msg!("token amount to buy: {}", user_info.buy_token_amount + token_amount);
        return Err(PresaleError::InsufficientFund.into())
    }

    // Check if the total tokens sold would exceed the maximum token amount
    if presale_info.sold_token_amount.checked_add(token_amount).unwrap_or(u64::MAX) > presale_info.max_token_amount {
        msg!("Maximum token amount reached: {}", presale_info.max_token_amount);
        return Err(PresaleError::HardCapped.into())
    }
    
    // Handle referral if provided
    let mut referee_reward = 0;
    if let Some(referrer_pubkey) = referrer_address {
        let referrer_info = &mut ctx.accounts.referrer_info;
        
        // Prevent self-referrals
        if referrer_info.to_account_info().key() == ctx.accounts.buyer.key() {
            return Err(PresaleError::SelfReferral.into());
        }
        
        // Verify referrer
        if referrer_info.to_account_info().key() != referrer_pubkey {
            return Err(PresaleError::InvalidReferralCode.into());
        }
        
        // Calculate rewards
        let referrer_reward = quote_amount
            .checked_mul(REFERRER_REWARD_BPS as u64)
            .ok_or(PresaleError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u64)
            .ok_or(PresaleError::MathOverflow)?;
            
        referee_reward = quote_amount
            .checked_mul(REFEREE_REWARD_BPS as u64)
            .ok_or(PresaleError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u64)
            .ok_or(PresaleError::MathOverflow)?;
        
        // Update referrer stats
        referrer_info.total_referrals = referrer_info.total_referrals.checked_add(1)
            .ok_or(PresaleError::MathOverflow)?;
        referrer_info.total_referral_purchases = referrer_info.total_referral_purchases
            .checked_add(quote_amount)
            .ok_or(PresaleError::MathOverflow)?;
        referrer_info.total_rewards_earned = referrer_info.total_rewards_earned
            .checked_add(referrer_reward)
            .ok_or(PresaleError::MathOverflow)?;
        
        // Update user info
        user_info.was_referred = true;
        user_info.referrer = referrer_info.to_account_info().key();
        user_info.referral_rewards_earned = user_info.referral_rewards_earned
            .checked_add(referee_reward)
            .ok_or(PresaleError::MathOverflow)?;
        
        msg!("Referral processed. Referrer: {}, Reward: {}", 
            referrer_info.to_account_info().key(), referrer_reward);
    }
    
    // Calculate new total after this purchase
    let new_total = presale_info.total_raised
        .checked_add(quote_amount)
        .ok_or(PresaleError::MathOverflow)?;

    // Transfer SOL to presale vault
    let transfer_amount = quote_amount.checked_sub(referee_reward)
        .ok_or(PresaleError::MathOverflow)?;
        
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: presale_vault.to_account_info(),
            },
        ),
        transfer_amount,
    )?;
    
    // Update presale stage
    presale_stage.tokens_sold = presale_stage.tokens_sold.checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;
        
    // Update presale info
    presale_info.total_raised = new_total;
    presale_info.sold_token_amount = presale_info.sold_token_amount
        .checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;
    
    // Check if we've reached the hard cap (token-based)
    if presale_info.sold_token_amount >= presale_info.max_token_amount {
        presale_info.is_hard_capped = true;
        msg!("Hard cap reached! No more tokens available for sale.");
    }
    
    // Update user info
    user_info.buy_token_amount = user_info.buy_token_amount.checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;
    user_info.buy_quote_amount = user_info.buy_quote_amount.checked_add(quote_amount)
        .ok_or(PresaleError::MathOverflow)?;
    user_info.buy_time = cur_timestamp;
    
    // Check if current stage is sold out
    if presale_stage.tokens_sold >= presale_stage.available_tokens {
        presale_stage.is_active = false;
        
        // If there are more stages, activate the next one
        if presale_info.current_stage < presale_info.total_stages {
            presale_info.current_stage = presale_info.current_stage.checked_add(1)
                .ok_or(PresaleError::MathOverflow)?;
            msg!("Stage {} sold out. Activating stage {}", 
                stage_number, presale_info.current_stage);
        } else {
            // All stages completed
            presale_info.is_live = false;
            msg!("All stages completed. Presale is now finished.");
        }
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(quote_amount: u64, referrer_address: Option<Pubkey>)]
pub struct BuyToken<'info> {
    #[account(
        mut,
        seeds = [b"PRESALE_SEED"],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    /// CHECK: This is not dangerous
    pub presale_authority: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"STAGE_SEED", &[presale_info.current_stage]],
        bump
    )]
    pub presale_stage: Box<Account<'info, PresaleStage>>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<UserInfo>(),
        seeds = [b"USER_SEED"],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    /// Referrer info account - optional but required if referrer_address is provided
    #[account(
        mut,
        constraint = referrer_address.is_none() || (referrer_info.to_account_info().key() == referrer_address.unwrap()) @ PresaleError::InvalidReferralCode
    )]
    pub referrer_info: Box<Account<'info, ReferralInfo>>,

    /// CHECK: This is not dangerous
    #[account(
        mut,
        seeds = [b"PRESALE_VAULT"],
        bump
    )]
    pub presale_vault: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}