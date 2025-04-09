use {
    anchor_lang::{prelude::*, system_program},
    anchor_spl::{
        token,
        associated_token,
    },
};

use solana_program::clock::Clock;

use crate::constants::PRESALE_VAULT;
use crate::constants::STAGE_SEED;
use crate::constants::REFERRAL_SEED;
use crate::state::PresaleInfo;
use crate::state::PresaleStage;
use crate::state::UserInfo;
use crate::state::ReferralInfo;
use crate::constants::{PRESALE_SEED, USER_SEED, REFERRER_REWARD_BPS, REFEREE_REWARD_BPS, BPS_DENOMINATOR};
use crate::errors::PresaleError;

pub fn buy_token(
    ctx: Context<BuyToken>,
    quote_amount: u64,
    token_amount: u64,
    referrer_code: Option<[u8; 8]>,
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

    // get time and compare with start and end time of the stage
    if presale_stage.start_time > cur_timestamp * 1000 {
        msg!("current time: {}", cur_timestamp);
        msg!("start time: {}", presale_stage.start_time);
        return Err(PresaleError::PresaleNotStarted.into());
    }

    if presale_stage.end_time < cur_timestamp * 1000 {
        msg!("start time: {}", presale_stage.start_time);
        msg!("end time: {}", presale_stage.end_time);
        msg!("current time: {}", cur_timestamp);
        return Err(PresaleError::PresaleEnded.into());
    }

    // Check if amount matches the expected quote amount based on the stage's price
    let expected_quote_amount = token_amount.checked_mul(presale_stage.price_per_token)
        .ok_or(PresaleError::MathOverflow)?;
    
    if expected_quote_amount != quote_amount {
        msg!("expected quote amount: {}", expected_quote_amount);
        msg!("provided quote amount: {}", quote_amount);
        return Err(PresaleError::TokenAmountMismatch.into());
    }

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

    // limit the presale to hardcap
    if presale_info.is_hard_capped == true {
        return Err(PresaleError::HardCapped.into())
    }
    
    // Handle referral if provided
    let mut referrer_reward = 0;
    let mut referee_reward = 0;
    
    if let Some(ref_code) = referrer_code {
        // Process referral
        if let Some(referrer_info) = &mut ctx.accounts.referrer_info {
            // Verify referral code
            if referrer_info.referral_code != ref_code {
                return Err(PresaleError::InvalidReferralCode.into());
            }
            
            // Prevent self-referral
            if referrer_info.owner == ctx.accounts.buyer.key() {
                return Err(PresaleError::SelfReferral.into());
            }
            
            // Calculate rewards
            referrer_reward = (quote_amount as u128)
                .checked_mul(REFERRER_REWARD_BPS as u128)
                .unwrap_or(0)
                .checked_div(BPS_DENOMINATOR as u128)
                .unwrap_or(0) as u64;
                
            referee_reward = (quote_amount as u128)
                .checked_mul(REFEREE_REWARD_BPS as u128)
                .unwrap_or(0)
                .checked_div(BPS_DENOMINATOR as u128)
                .unwrap_or(0) as u64;
            
            // Update referrer info
            referrer_info.total_referrals = referrer_info.total_referrals.checked_add(1).unwrap_or(u32::MAX);
            referrer_info.total_referral_purchases = referrer_info
                .total_referral_purchases
                .checked_add(quote_amount)
                .unwrap_or(u64::MAX);
            referrer_info.total_rewards_earned = referrer_info
                .total_rewards_earned
                .checked_add(referrer_reward)
                .unwrap_or(u64::MAX);
                
            // Set referrer in user info
            user_info.referrer = referrer_info.owner;
            user_info.was_referred = true;
            
            msg!("Referral processed. Referrer reward: {}, Referee reward: {}", 
                referrer_reward, referee_reward);
        }
    }
    
    // Calculate amount to transfer to vault (minus rewards)
    let vault_amount = quote_amount.checked_sub(referee_reward).unwrap_or(quote_amount);
    
    // send SOL to contract and update the user info
    user_info.buy_time = cur_timestamp;
    user_info.buy_quote_amount = user_info.buy_quote_amount.checked_add(quote_amount).unwrap_or(u64::MAX);
    user_info.buy_token_amount = user_info.buy_token_amount.checked_add(token_amount).unwrap_or(u64::MAX);
    
    // Update both presale and stage info
    presale_info.sold_token_amount = presale_info.sold_token_amount.checked_add(token_amount).unwrap_or(u64::MAX);
    presale_stage.tokens_sold = presale_stage.tokens_sold.checked_add(token_amount).unwrap_or(u64::MAX);
    
    // Check if stage is completely sold - automatically end it
    if presale_stage.tokens_sold >= presale_stage.available_tokens {
        presale_stage.is_active = false;
        msg!("Stage {} is fully sold out", stage_number);
        
        // Check if there are more stages to potentially activate
        if stage_number < presale_info.total_stages {
            msg!("Please activate stage {} to continue the presale", stage_number + 1);
        } else {
            // This was the final stage
            presale_info.is_live = false;
            msg!("Final stage completed. Presale is now finished.");
        }
    }
    
    // Transfer SOL to the presale vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: presale_vault.to_account_info(),
            }
        ),
        vault_amount
    )?;
    
    // If there was a referral with referee reward, transfer it to the buyer
    if referee_reward > 0 {
        **ctx.accounts.buyer.try_borrow_mut_lamports()? += referee_reward;
    }
    
    msg!("Presale tokens transferred successfully.");

    // show softcap status
    if presale_vault.get_lamports() > presale_info.softcap_amount {
        presale_info.is_soft_capped = true;
        msg!("Presale is softcapped");
    }
    
    // show hardcap status
    if presale_vault.get_lamports() > presale_info.hardcap_amount {
        presale_info.is_hard_capped = true;
        msg!("Presale is hardcapped");
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(quote_amount: u64, token_amount: u64, referrer_code: Option<[u8; 8]>)]
pub struct BuyToken<'info> {
    #[account(
        mut,
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    /// CHECK: This is not dangerous
    pub presale_authority: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [STAGE_SEED, &[presale_info.current_stage]],
        bump
    )]
    pub presale_stage: Box<Account<'info, PresaleStage>>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<UserInfo>(),
        seeds = [USER_SEED],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    /// Referrer info account - optional but required if referrer_code is provided
    #[account(mut)]
    pub referrer_info: Option<Box<Account<'info, ReferralInfo>>>,

    /// CHECK: This is not dangerous
    #[account(
        mut,
        seeds = [PRESALE_VAULT],
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