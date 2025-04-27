use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod constants;
pub mod errors;

use state::*;

declare_id!("4nyxJqG4nUetnAev9Zw7gbWkPpJAS1kedGReGpCRBnPG");

#[program]
pub mod doge_presale {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        instructions::initialize(ctx, start_time, end_time)
    }

    pub fn deposit_tokens(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
        instructions::deposit_tokens(ctx, amount)
    }

    pub fn buy(ctx: Context<Buy>, usd_amount: f64) -> Result<()> {
        instructions::buy(ctx, usd_amount)
    }

    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        instructions::finalize(ctx)
    }

    pub fn get_transaction_history(ctx: Context<GetTransactionHistory>) -> Result<Vec<Transaction>> {
        instructions::get_transaction_history(ctx)
    }

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        instructions::claim_tokens(ctx)
    }
}
