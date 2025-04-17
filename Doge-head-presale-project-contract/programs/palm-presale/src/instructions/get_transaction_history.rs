use anchor_lang::prelude::*;
use crate::state::TransactionHistory;

pub fn get_transaction_history(ctx: Context<GetTransactionHistory>, buyer: Pubkey) -> Result<Vec<TransactionHistory>> {
    // Return all transactions for the given buyer
    let transactions = TransactionHistory::find_by_buyer(buyer)?;
    Ok(transactions)
}

#[derive(Accounts)]
pub struct GetTransactionHistory<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
}
