use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("7R1ZXDsJxDetkjap3VzsAZ23WMg3pMxcfxSnzcxLa7LU");

pub const TOKEN_MINT_ADDRESS: &str = "mntPPX7vem9xnqVAwpyt1VmdqEDTmmzhZeCDxSUHgBV";

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod price_feed;

use instructions::*;
use state::TransactionHistory;
use state::PresaleInfo;
use state::UserInfo;

#[program]
pub mod palm_presale {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        token_mint_address: Pubkey,
        softcap_amount: u64,
        hardcap_amount: u64,
        max_token_amount_per_address: u64,
        token_price: u64,
    ) -> Result<()> {
        instructions::initialize::initialize(
            ctx,
            token_mint_address,
            softcap_amount,
            hardcap_amount,
            max_token_amount_per_address,
            token_price,
        )
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

    pub fn get_all_transactions(ctx: Context<GetAllTransactions>) -> Result<Vec<TransactionHistory>> {
        instructions::get_all_transactions::get_all_transactions(ctx)
    }

    pub fn set_authorized_updater(ctx: Context<SetAuthorizedUpdater>, new_updater: Pubkey) -> Result<()> {
        instructions::set_authorized_updater::set_authorized_updater(ctx, new_updater)
    }

    pub fn update_user_allocation(
        ctx: Context<UpdateUserAllocation>,
        solana_wallet: Pubkey,
        usd_amount: u64,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        instructions::update_user_allocation::update_user_allocation(ctx, solana_wallet, usd_amount, referrer)
    }
}

#[derive(Accounts)]
pub struct InitializePresale<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = PresaleInfo::LEN
    )]
    pub presale_info: Account<'info, PresaleInfo>,

    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = presale_info,
    )]
    pub presale_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the token mint for the presale
    pub token_mint: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
