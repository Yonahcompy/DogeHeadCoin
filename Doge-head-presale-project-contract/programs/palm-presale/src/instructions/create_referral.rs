use anchor_lang::prelude::*;

use crate::constants::REFERRAL_SEED;
use crate::state::ReferralInfo;
use crate::errors::PresaleError;

pub fn create_referral(ctx: Context<CreateReferral>) -> Result<()> {
    let referral_info = &mut ctx.accounts.referral_info;
    referral_info.owner = ctx.accounts.user.key();
    referral_info.total_referrals = 0;
    referral_info.total_referral_purchases = 0;
    referral_info.total_rewards_earned = 0;
    referral_info.rewards_claimed = false;
    
    msg!("Created referral for {}", ctx.accounts.user.key());
    Ok(())
}

#[derive(Accounts)]
pub struct CreateReferral<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<ReferralInfo>(),
        seeds = [b"REFERRAL_SEED", user.key().as_ref()],
        bump
    )]
    pub referral_info: Box<Account<'info, ReferralInfo>>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
} 