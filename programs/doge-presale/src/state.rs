use anchor_lang::prelude::*;

#[account]
pub struct TransactionRecord {
    pub authority: Pubkey,      // Treasury wallet address (32 bytes)
    pub current_stage: u8,      // Current stage (0-4) (1 byte)
    pub transaction_count: u64, // Number of transactions (8 bytes)
    pub transactions: Vec<Transaction>, // Vec of transactions (4 bytes for length + 65 bytes per transaction)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Transaction {
    pub buyer: Pubkey,          // Address of the buyer (32 bytes)
    pub usd_amount: f64,        // Amount in USD (8 bytes)
    pub sol_amount: u64,        // Amount of SOL paid in lamports (8 bytes)
    pub token_amount: u64,      // Amount of tokens purchased (8 bytes)
    pub stage: u8,              // Stage of purchase (1 byte)
    pub timestamp: i64,         // Unix timestamp of transaction (8 bytes)
}