use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserInfo {
    pub owner: Pubkey,
    pub buy_token_amount: u64,
    pub claimed: bool,
    pub bump: u8,
    // Buy quote amount
    pub buy_quote_amount: u64,
    // Buy time
    pub buy_time: u64,
    // claim amount
    // pub claim_amount: u64,
    // claim time
    pub claim_time: u64,
    // Referrer's public key (if any)
    pub referrer: Pubkey,
    // Whether this user was referred
    pub was_referred: bool,
    // Total rewards earned from referring others
    pub referral_rewards_earned: u64,
    // Total rewards claimed from referring others
    pub referral_rewards_claimed: u64,
}