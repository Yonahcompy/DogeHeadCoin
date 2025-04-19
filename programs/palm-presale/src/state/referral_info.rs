use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ReferralInfo {
    // The wallet address that owns this referral
    pub owner: Pubkey,
    
    // Total number of referrals brought in
    pub total_referrals: u32,
    
    // Total amount of quote tokens (SOL) purchased through referrals
    pub total_referral_purchases: u64,
    
    // Total amount of quote tokens (SOL) earned as rewards
    pub total_rewards_earned: u64,
    
    // Whether rewards have been claimed
    pub rewards_claimed: bool,
} 