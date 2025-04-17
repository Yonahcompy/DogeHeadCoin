use anchor_lang::prelude::*;

#[account]
pub struct TransactionHistory {
    pub buyer: Pubkey,           // Solana address where tokens will be distributed
    pub payer: Pubkey,           // Address that made the payment (could be on any chain)
    pub payment_amount: u64,     // Amount paid in lamports
    pub token_amount: u64,       // Amount of tokens bought
    pub timestamp: i64,          // Transaction timestamp
    pub referral_code: Option<Pubkey>,  // Optional referral code
    pub pay_with: String,        // Payment method (e.g., "SOL", "ETH", "MATIC")
    pub used_referral: bool,     // Whether a referral was used for this purchase
}

impl TransactionHistory {
    pub fn find_by_buyer(buyer: Pubkey) -> Result<Vec<TransactionHistory>> {
        // In a real implementation, this would query the blockchain
        // For now, return an empty vector
        Ok(Vec::new())
    }

    pub fn find_all_by_presale(presale: Pubkey) -> Result<Vec<TransactionHistory>> {
        // In a real implementation, this would query the blockchain
        // For now, return an empty vector
        Ok(Vec::new())
    }
}
