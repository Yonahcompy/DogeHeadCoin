use anchor_lang::prelude::*;

use crate::constants::REFERRAL_SEED;
use crate::state::ReferralInfo;

pub fn create_referral(
    ctx: Context<CreateReferral>,
) -> Result<()> {
    let referral_info = &mut ctx.accounts.referral_info;
    let user = &ctx.accounts.user;
    
    // Initialize referral info
    referral_info.owner = user.key();
    referral_info.total_referrals = 0;
    referral_info.total_referral_purchases = 0;
    referral_info.total_rewards_earned = 0;
    referral_info.rewards_claimed = false;
    
    // Generate a unique referral code from the account's PDA address
    // We'll use the first 8 bytes of the account address as a simple referral code
    let account_bytes = referral_info.to_account_info().key().to_bytes();
    let mut referral_code = [0u8; 8];
    referral_code.copy_from_slice(&account_bytes[0..8]);
    referral_info.referral_code = referral_code;
    
    msg!("Created referral for user: {}", user.key());
    // Convert the referral code to a displayable hex string for the user
    let code_hex = format!("{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}", 
        referral_code[0], referral_code[1], referral_code[2], referral_code[3],
        referral_code[4], referral_code[5], referral_code[6], referral_code[7]);
    msg!("Referral code: {}", code_hex);
    
    Ok(())
}

#[derive(Accounts)]
pub struct CreateReferral<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<ReferralInfo>(),
        seeds = [REFERRAL_SEED, user.key().as_ref()],
        bump
    )]
    pub referral_info: Box<Account<'info, ReferralInfo>>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
} 