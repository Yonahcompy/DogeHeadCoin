use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Bxa17nCo2DYSy9FBVnugR2GeU4kGJ1tPPSxhWWzLBHDd");

#[program]
pub mod palm_presale {
    use super::*;

    pub fn create_presale(
        ctx: Context<CreatePresale>,
        token_mint_address: Pubkey,
        // quote_token_mint_address: Pubkey,
        softcap_amount: u64,
        hardcap_amount: u64,
        max_token_amount_per_address: u64,
        price_per_token: u64,
        start_time: u64,
        end_time: u64,
        total_stages: u8,
        // identifier: u8
    ) -> Result<()> {
        return create_presale::create_presale(
            ctx,
            token_mint_address,
            // quote_token_mint_address,
            softcap_amount,
            hardcap_amount,
            max_token_amount_per_address,
            price_per_token,
            start_time,
            end_time,
            total_stages,
            // identifier,
        );
    }

    pub fn update_presale(
        ctx: Context<UpdatePresale>,
        max_token_amount_per_address: u64,
        price_per_token: u64,
        softcap_amount: u64,
        hardcap_amount: u64,
        start_time: u64,
        end_time: u64,
    ) -> Result<()> {
        return update_presale::update_presale (
            ctx,
            max_token_amount_per_address,
            price_per_token,
            softcap_amount,
            hardcap_amount,
            start_time,
            end_time,
        );
    }

    pub fn deposit_token(
        ctx: Context<DepositToken>,
        amount: u64,
        // identifier: u8,
    ) -> Result<()> {
        return deposit_token::deposit_token (
            ctx,
            amount,
            // identifier
        );
    }
    
    pub fn start_presale(
        ctx: Context<StartPresale>,
        start_time: u64,
        end_time: u64
    ) -> Result<()> {
        return start_presale::start_presale (
            ctx,
            start_time,
            end_time
        );
    }
    
    pub fn buy_token(
        ctx: Context<BuyToken>,
        token_amount: u64,
        quote_amount: u64,
        referrer_code: Option<[u8; 8]>,
    ) -> Result<()> {
        return buy_token::buy_token (
            ctx,
            quote_amount,
            token_amount,
            referrer_code,
        );
    }

    pub fn claim_token(
        ctx: Context<ClaimToken>,
        bump: u8
    ) -> Result<()> {
        return claim_token::claim_token (
            ctx, bump
        );
    }
    
    pub fn withdraw_sol(
        ctx: Context<WithdrawSol>,
        amount: u64,
        bump: u8
    ) -> Result<()> {
        return withdraw_sol::withdraw_sol (
            ctx,
            amount,
            bump
        );
    }

    pub fn withdraw_token(
        ctx: Context<WithdrawToken>,
        amount: u64,
        bump: u8
    ) -> Result<()> {
        return withdraw_token::withdraw_token (
            ctx, amount, bump
        );
    }

    pub fn create_referral(
        ctx: Context<CreateReferral>,
    ) -> Result<()> {
        return create_referral::create_referral(
            ctx,
        );
    }
    
    pub fn claim_referral_rewards(
        ctx: Context<ClaimReferralRewards>,
    ) -> Result<()> {
        return claim_referral_rewards::claim_referral_rewards(
            ctx,
        );
    }
    
    pub fn get_referral_stats(
        ctx: Context<GetReferralStats>,
    ) -> Result<()> {
        return get_referral_stats::get_referral_stats(
            ctx,
        );
    }

    pub fn add_presale_stage(
        ctx: Context<AddPresaleStage>,
        stage_number: u8,
        available_tokens: u64,
        price_per_token: u64,
        start_time: u64,
        end_time: u64,
    ) -> Result<()> {
        return add_presale_stage::add_presale_stage(
            ctx,
            stage_number,
            available_tokens,
            price_per_token,
            start_time,
            end_time,
        );
    }
    
    pub fn activate_stage(
        ctx: Context<ActivateStage>,
        stage_number: u8,
    ) -> Result<()> {
        return activate_stage::activate_stage(
            ctx,
            stage_number,
        );
    }
}

#[derive(Accounts)]
pub struct Initialize {}
