use anchor_lang::prelude::*;

use crate::constants::REFERRAL_SEED;
use crate::state::ReferralInfo;
use crate::errors::PresaleError;

pub fn create_referral(
    ctx: Context<CreateReferral>,
) -> Result<()> {
    let referral_info = &mut ctx.accounts.referral_info;
    let user = &ctx.accounts.user;
    
    // Check if user already has a referral account
    if referral_info.owner == user.key() {
        return Err(PresaleError::ReferralAlreadyExists.into());
    }
    
    // Initialize referral info
    referral_info.owner = user.key();
    referral_info.total_referrals = 0;
    referral_info.total_referral_purchases = 0;
    referral_info.total_rewards_earned = 0;
    referral_info.rewards_claimed = false;
    
    // Generate a unique referral code from the PDA address
    let account_key = referral_info.to_account_info().key();
    let referral_code = account_key.to_bytes()[0..8].try_into()
        .map_err(|_| PresaleError::ReferralCodeGenerationFailed)?;
    referral_info.referral_code = referral_code;
    
    msg!("Created referral account for user: {}", user.key());
    msg!("Referral code: {:?}", referral_code);
    
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