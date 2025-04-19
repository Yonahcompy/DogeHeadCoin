use anchor_lang::prelude::*;

use crate::constants::REFERRAL_SEED;
use crate::state::ReferralInfo;

pub fn get_referral_stats(
    ctx: Context<GetReferralStats>,
) -> Result<()> {
    let referral_info = &ctx.accounts.referral_info;
    let user = &ctx.accounts.user;
    
    // Verify user is the owner of the referral
    if referral_info.owner != user.key() {
        msg!("Warning: User is viewing referral stats for another user");
    }
    
    // Display the referral stats
    msg!("Referral statistics for user: {}", referral_info.owner);
    msg!("Total referrals: {}", referral_info.total_referrals);
    msg!("Total purchase amount via referrals: {} lamports", referral_info.total_referral_purchases);
    msg!("Total rewards earned: {} lamports", referral_info.total_rewards_earned);
    msg!("Referral code (wallet address): {}", referral_info.owner);
    
    Ok(())
}

#[derive(Accounts)]
pub struct GetReferralStats<'info> {
    #[account(
        seeds = [REFERRAL_SEED, user.key().as_ref()],
        bump
    )]
    pub referral_info: Box<Account<'info, ReferralInfo>>,
    
    pub user: Signer<'info>,
} 