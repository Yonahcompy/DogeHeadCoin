use {
    anchor_lang::prelude::*,
};

use crate::constants::REFERRAL_SEED;
use crate::state::ReferralInfo;
use crate::state::UserInfo;
use crate::constants::USER_SEED;
use crate::errors::PresaleError;

pub fn claim_referral_rewards(
    ctx: Context<ClaimReferralRewards>,
) -> Result<()> {
    let referral_info = &mut ctx.accounts.referral_info;
    let user_info = &mut ctx.accounts.user_info;
    let user = &ctx.accounts.user;
    
    // Verify user is the owner of the referral
    if referral_info.owner != user.key() {
        return Err(PresaleError::Unauthorized.into());
    }
    
    // Check if there are rewards to claim
    if referral_info.total_rewards_earned == 0 {
        return Err(PresaleError::NoReferralRewards.into());
    }
    
    // Calculate unclaimed rewards
    let unclaimed_rewards = referral_info.total_rewards_earned - user_info.referral_rewards_claimed;
    if unclaimed_rewards == 0 {
        return Err(PresaleError::RewardsAlreadyClaimed.into());
    }
    
    // Transfer the rewards to the user
    **ctx.accounts.user.try_borrow_mut_lamports()? += unclaimed_rewards;
    
    // Update tracking
    user_info.referral_rewards_claimed += unclaimed_rewards;
    
    msg!("Claimed {} lamports in referral rewards", unclaimed_rewards);
    
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimReferralRewards<'info> {
    #[account(
        mut,
        seeds = [REFERRAL_SEED, user.key().as_ref()],
        bump
    )]
    pub referral_info: Box<Account<'info, ReferralInfo>>,
    
    #[account(
        mut,
        seeds = [USER_SEED],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,
    
    #[account(mut)]
    pub user: Signer<'info>,
} 