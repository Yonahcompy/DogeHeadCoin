use anchor_lang::prelude::*;

declare_id!("2PBB1EkqtWVqiQUjMPjdNReQeQcYrveLYQHBzaybwjwo");

pub const TOKEN_MINT_ADDRESS: &str = "mntPPX7vem9xnqVAwpyt1VmdqEDTmmzhZeCDxSUHgBV";

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::TransactionHistory;

#[program]
pub mod palm_presale {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        token_mint: Pubkey,
        softcap_amount: u64,
        hardcap_amount: u64,
        max_token_amount_per_address: u64,
        token_price: u64,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        return initialize::initialize(
            ctx,
            token_mint,
            softcap_amount,
            hardcap_amount,
            max_token_amount_per_address,
            token_price,
            start_time,
            end_time,
        );
    }

    pub fn initialize_stage(
        ctx: Context<InitializeStage>,
        stage_number: u8,
        available_tokens: u64,
        price_per_token: u64,
    ) -> Result<()> {
        return initialize_stage::initialize_stage(
            ctx,
            stage_number,
            available_tokens,
            price_per_token,
        );
    }

    pub fn deposit_token(
        ctx: Context<DepositToken>,
        amount: u64,
    ) -> Result<()> {
        return deposit_token::deposit_token (
            ctx,
            amount,
        );
    }
    
    pub fn buy_token(ctx: Context<BuyToken>, amount: u64, referrer_address: Option<Pubkey>) -> Result<()> {
        return buy_token::buy_token(ctx, amount, referrer_address);
    }

    pub fn claim_token(ctx: Context<ClaimToken>) -> Result<()> {
        return claim_token::claim_token(ctx);
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
            ctx,
            amount,
            bump
        );
    }

    pub fn create_referral(ctx: Context<CreateReferral>) -> Result<()> {
        return create_referral::create_referral(ctx);
    }

    pub fn claim_referral_rewards(
        ctx: Context<ClaimReferralRewards>,
    ) -> Result<()> {
        return claim_referral_rewards::claim_referral_rewards (
            ctx,
        );
    }

    pub fn get_referral_stats(
        ctx: Context<GetReferralStats>,
    ) -> Result<()> {
        return get_referral_stats::get_referral_stats (
            ctx,
        );
    }

    pub fn get_transaction_history(
        ctx: Context<GetTransactionHistory>,
        buyer: Pubkey,
    ) -> Result<Vec<TransactionHistory>> {
        return get_transaction_history::get_transaction_history(ctx, buyer);
    }

    pub fn get_all_transactions(
        ctx: Context<GetAllTransactions>,
    ) -> Result<Vec<TransactionHistory>> {
        return get_all_transactions::get_all_transactions(ctx);
    }
}
