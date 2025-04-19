use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PresaleError;
use crate::constants::PRESALE_SEED;

pub fn get_all_transactions(ctx: Context<GetAllTransactions>) -> Result<Vec<TransactionHistory>> {
    // Verify the caller is the admin
    require!(
        ctx.accounts.admin.key() == ctx.accounts.presale_info.authority,
        PresaleError::Unauthorized
    );

    // Return all transactions for the presale
    let transactions = TransactionHistory::find_all_by_presale(ctx.accounts.presale_info.key())?;
    Ok(transactions)
}

#[derive(Accounts)]
pub struct GetAllTransactions<'info> {
    #[account(seeds = [PRESALE_SEED], bump)]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    #[account(mut, constraint = admin.key() == presale_info.authority)]
    pub admin: Signer<'info>,
} 