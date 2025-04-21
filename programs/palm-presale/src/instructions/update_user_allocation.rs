use {
    anchor_lang::{prelude::*, system_program},
    anchor_spl::{
        token,
        associated_token,
    },
};

use solana_program::clock::Clock;

use crate::state::PresaleInfo;
use crate::state::UserInfo;
use crate::state::ReferralInfo;
use crate::state::PresaleStage;
use crate::constants::{REFERRER_REWARD_BPS, REFEREE_REWARD_BPS, BPS_DENOMINATOR};
use crate::errors::PresaleError;
use crate::state::TransactionHistory;

pub fn update_user_allocation(
    ctx: Context<UpdateUserAllocation>,
    solana_wallet: Pubkey,
    usd_amount: u64,
    referrer: Option<Pubkey>,
) -> Result<()> {
    
    let presale_info = &mut ctx.accounts.presale_info;
    let user_info = &mut ctx.accounts.user_info;
    let current_stage = &mut ctx.accounts.current_stage;
    let cur_timestamp = u64::try_from(Clock::get()?.unix_timestamp).unwrap();

    // Check if presale is live
    if !presale_info.is_live {
        return Err(PresaleError::PresaleNotStarted.into());
    }

    // Check if current stage is active
    if !current_stage.is_active {
        return Err(PresaleError::StageNotActive.into());
    }

    // Calculate token amount based on USD amount and current stage price
    let token_amount = (usd_amount as f64 / current_stage.price_per_token as f64 * 1_000_000.0) as u64;
    
    // Check if this is a new user
    let is_new_user = user_info.owner == Pubkey::default();
    
    if is_new_user {
        // Initialize user info for new user
        user_info.owner = solana_wallet;
        user_info.buy_token_amount = token_amount;
        user_info.buy_quote_amount = usd_amount;
        user_info.buy_time = cur_timestamp;
        user_info.claimed = false;
        user_info.was_referred = referrer.is_some();
        user_info.referrer = referrer.unwrap_or(Pubkey::default());
        user_info.referral_rewards_earned = 0;
        user_info.referral_rewards_claimed = 0;
        user_info.user = solana_wallet;
        user_info.total_contributed = usd_amount;
        user_info.token_amount = token_amount;
    } else {
        // Verify the user account matches the provided solana wallet
        require!(
            user_info.to_account_info().key() == solana_wallet,
            PresaleError::InvalidSolanaWallet
        );
        
        // Update existing user info
        user_info.buy_token_amount = user_info.buy_token_amount.checked_add(token_amount)
            .ok_or(PresaleError::MathOverflow)?;
        user_info.buy_quote_amount = user_info.buy_quote_amount.checked_add(usd_amount)
            .ok_or(PresaleError::MathOverflow)?;
        user_info.buy_time = cur_timestamp;
        user_info.total_contributed = user_info.total_contributed.checked_add(usd_amount)
            .ok_or(PresaleError::MathOverflow)?;
        user_info.token_amount = user_info.token_amount.checked_add(token_amount)
            .ok_or(PresaleError::MathOverflow)?;
    }
    
    // Handle referral if provided
    if let Some(referrer_pubkey) = referrer {
        let referrer_info = &mut ctx.accounts.referrer_info;
        
        // Prevent self-referrals
        if referrer_info.to_account_info().key() == solana_wallet {
            return Err(PresaleError::SelfReferral.into());
        }
        
        // Verify referrer
        if referrer_info.to_account_info().key() != referrer_pubkey {
            return Err(PresaleError::InvalidReferralCode.into());
        }
        
        // Calculate rewards
        let referrer_reward = usd_amount
            .checked_mul(REFERRER_REWARD_BPS as u64)
            .ok_or(PresaleError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u64)
            .ok_or(PresaleError::MathOverflow)?;
            
        let referee_reward = usd_amount
            .checked_mul(REFEREE_REWARD_BPS as u64)
            .ok_or(PresaleError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u64)
            .ok_or(PresaleError::MathOverflow)?;
        
        // Update referrer stats
        referrer_info.total_referrals = referrer_info.total_referrals.checked_add(1)
            .ok_or(PresaleError::MathOverflow)?;
        referrer_info.total_referral_purchases = referrer_info.total_referral_purchases
            .checked_add(usd_amount)
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

    // Record transaction history
    let transaction_history = &mut ctx.accounts.transaction_history;
    transaction_history.buyer = solana_wallet;
    transaction_history.usd_amount = usd_amount;
    transaction_history.token_amount = token_amount;
    transaction_history.timestamp = Clock::get()?.unix_timestamp;
    transaction_history.chain = "SOL".to_string();
    transaction_history.native_amount = Some(usd_amount);
    transaction_history.oracle = Some(ctx.accounts.updater.key());

    Ok(())
}

#[derive(Accounts)]
#[instruction(solana_wallet: Pubkey, usd_amount: u64, referrer: Option<Pubkey>)]
pub struct UpdateUserAllocation<'info> {
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
        seeds = [b"STAGE", presale_info.key().as_ref(), &[presale_info.current_stage]],
        bump
    )]
    pub current_stage: Box<Account<'info, PresaleStage>>,

    #[account(
        init_if_needed,
        payer = updater,
        space = 8 + std::mem::size_of::<UserInfo>(),
        seeds = [b"USER_SEED", solana_wallet.as_ref()],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    /// Referrer info account - optional but required if referrer is provided
    #[account(
        mut,
        constraint = referrer.is_none() || (referrer_info.to_account_info().key() == referrer.unwrap()) @ PresaleError::InvalidReferralCode
    )]
    pub referrer_info: Box<Account<'info, ReferralInfo>>,
    
    #[account(
        mut,
        constraint = updater.key() == presale_info.authorized_updater @ PresaleError::UnauthorizedUpdater
    )]
    pub updater: Signer<'info>,
    
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,

    #[account(
        init,
        payer = updater,
        space = TransactionHistory::LEN,
        seeds = [b"TRANSACTION", solana_wallet.as_ref(), &[Clock::get()?.unix_timestamp as u8]],
        bump
    )]
    pub transaction_history: Account<'info, TransactionHistory>,
}