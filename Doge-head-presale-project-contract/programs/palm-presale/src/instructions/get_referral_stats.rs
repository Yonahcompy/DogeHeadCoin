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
    
    // Convert the referral code to a displayable hex string
    let code = referral_info.referral_code;
    let code_hex = format!("{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}", 
        code[0], code[1], code[2], code[3], code[4], code[5], code[6], code[7]);
    msg!("Referral code: {}", code_hex);
    
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