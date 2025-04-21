use anchor_lang::prelude::*;

#[account]
pub struct TransactionHistory {
    pub buyer: Pubkey,           // Solana address where tokens will be distributed
    pub usd_amount: u64,         // USD amount of the transaction
    pub token_amount: u64,       // Amount of tokens bought
    pub timestamp: i64,          // Transaction timestamp
    pub chain: String,           // Source chain (e.g., "BSC", "ETH", "MATIC", "SOL")
    pub native_amount: Option<u64>, // Amount in native token of the source chain
    pub oracle: Option<Pubkey>,  // Address of the oracle that processed the cross-chain payment
}

impl TransactionHistory {
    pub const LEN: usize = 8 + // discriminator
        32 + // buyer
        8 + // usd_amount
        8 + // token_amount
        8 + // timestamp
        4 + 32 + // chain (string)
        1 + 8 + // native_amount (option)
        1 + 32; // oracle (option)

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
