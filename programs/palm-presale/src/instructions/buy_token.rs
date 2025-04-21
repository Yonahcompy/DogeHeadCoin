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
use crate::constants::{REFERRER_REWARD_BPS, REFEREE_REWARD_BPS, BPS_DENOMINATOR};
use crate::errors::PresaleError;
use crate::state::TransactionHistory;
use crate::price_feed::{validate_price_feed, get_sol_price};

pub fn buy_token(
    ctx: Context<BuyToken>,
    quote_amount: u64,
    referrer_address: Option<Pubkey>,
) -> Result<()> {
    
    let presale_info = &mut ctx.accounts.presale_info;
    let user_info = &mut ctx.accounts.user_info;
    let presale_vault = &mut ctx.accounts.presale_vault;
    let cur_timestamp = u64::try_from(Clock::get()?.unix_timestamp).unwrap();

    // Check if presale is live
    if !presale_info.is_live {
        return Err(PresaleError::PresaleNotStarted.into());
    }

    // Validate price feed
    validate_price_feed(&ctx.accounts.price_feed)?;

    // Get current price from price feed
    let current_price = get_sol_price(&ctx.accounts.price_feed)?;

    // Calculate token amount based on quote amount and current price
    let token_amount = (quote_amount as f64 / current_price * 1_000_000.0) as u64;
    
    // Handle referral if provided
    let mut referee_reward = 0;
    if let Some(referrer_pubkey) = referrer_address {
        let referrer_info = &mut ctx.accounts.referrer_info;
        
        // Prevent self-referrals
        if referrer_info.to_account_info().key() == ctx.accounts.buyer.key() {
            return Err(PresaleError::SelfReferral.into());
        }
        
        // Verify referrer
        if referrer_info.to_account_info().key() != referrer_pubkey {
            return Err(PresaleError::InvalidReferralCode.into());
        }
        
        // Calculate rewards
        let referrer_reward = quote_amount
            .checked_mul(REFERRER_REWARD_BPS as u64)
            .ok_or(PresaleError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u64)
            .ok_or(PresaleError::MathOverflow)?;
            
        referee_reward = quote_amount
            .checked_mul(REFEREE_REWARD_BPS as u64)
            .ok_or(PresaleError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u64)
            .ok_or(PresaleError::MathOverflow)?;
        
        // Update referrer stats
        referrer_info.total_referrals = referrer_info.total_referrals.checked_add(1)
            .ok_or(PresaleError::MathOverflow)?;
        referrer_info.total_referral_purchases = referrer_info.total_referral_purchases
            .checked_add(quote_amount)
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
    
    // Calculate new total after this purchase
    let new_total = presale_info.total_raised
        .checked_add(quote_amount)
        .ok_or(PresaleError::MathOverflow)?;

    // Transfer SOL to presale vault
    let transfer_amount = quote_amount.checked_sub(referee_reward)
        .ok_or(PresaleError::MathOverflow)?;
        
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: presale_vault.to_account_info(),
            },
        ),
        transfer_amount,
    )?;
        
    // Update presale info
    presale_info.total_raised = new_total;
    presale_info.sold_token_amount = presale_info.sold_token_amount
        .checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;
    presale_info.tokens_sold = presale_info.tokens_sold
        .checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;
    
    // Update user info
    user_info.buy_token_amount = user_info.buy_token_amount.checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;
    user_info.buy_quote_amount = user_info.buy_quote_amount.checked_add(quote_amount)
        .ok_or(PresaleError::MathOverflow)?;
    user_info.buy_time = cur_timestamp;
    user_info.total_contributed = user_info.total_contributed.checked_add(quote_amount)
        .ok_or(PresaleError::MathOverflow)?;
    user_info.token_amount = user_info.token_amount.checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;

    // Record transaction history
    let transaction_history = &mut ctx.accounts.transaction_history;
    transaction_history.buyer = ctx.accounts.buyer.key();
    transaction_history.usd_amount = quote_amount;
    transaction_history.token_amount = token_amount;
    transaction_history.timestamp = Clock::get()?.unix_timestamp;
    transaction_history.chain = "SOL".to_string();
    transaction_history.native_amount = Some(quote_amount);
    transaction_history.oracle = None;

    Ok(())
}

#[derive(Accounts)]
#[instruction(quote_amount: u64, referrer_address: Option<Pubkey>)]
pub struct BuyToken<'info> {
    #[account(
        mut,
        seeds = [b"PRESALE_SEED"],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    /// CHECK: This is not dangerous
    pub presale_authority: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<UserInfo>(),
        seeds = [b"USER_SEED"],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    /// Referrer info account - optional but required if referrer_address is provided
    #[account(
        mut,
        constraint = referrer_address.is_none() || (referrer_info.to_account_info().key() == referrer_address.unwrap()) @ PresaleError::InvalidReferralCode
    )]
    pub referrer_info: Box<Account<'info, ReferralInfo>>,

    /// CHECK: This is not dangerous
    #[account(
        mut,
        seeds = [b"PRESALE_VAULT"],
        bump
    )]
    pub presale_vault: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: This is the price feed account from Pyth
    pub price_feed: AccountInfo<'info>,
    
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,

    #[account(
        init,
        payer = buyer,
        space = TransactionHistory::LEN,
        seeds = [b"TRANSACTION", buyer.key().as_ref(), &[Clock::get()?.unix_timestamp as u8]],
        bump
    )]
    pub transaction_history: Account<'info, TransactionHistory>,
}