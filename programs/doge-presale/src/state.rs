use anchor_lang::prelude::*;

#[account]
pub struct TransactionRecord {
    pub authority: Pubkey,      // Treasury wallet address (32 bytes)
    pub token_mint: Pubkey,     // Token mint address (32 bytes)
    pub current_stage: u8,      // Current stage (1-5) (1 byte)
    pub transaction_count: u64, // Number of transactions (8 bytes)
    pub total_usd_sold: f64,    // Total USD amount sold (8 bytes)
    pub total_tokens_sold: u64, // Total tokens sold (8 bytes)
    pub deposit_token_amount: u64, // Total tokens deposited (8 bytes)
    pub transactions: Vec<Transaction>, // Vec of transactions (4 bytes for length + 65 bytes per transaction)
    pub buyers: Vec<BuyerInfo>, // List of buyer information
    pub presale_end_time: i64,  // When the presale ended (0 if not ended)
    pub total_tokens_claimed: u64,    // Total tokens claimed by all buyers
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct BuyerInfo {
    pub buyer_address: Pubkey,  // Address of the buyer
    pub total_paid_usd: f64,    // Total USD paid by this buyer
    pub total_paid_sol: u64,    // Total SOL paid by this buyer in lamports
    pub total_tokens_bought: u64, // Total tokens bought by this buyer
    pub total_tokens_claimed: u64, // Total tokens claimed by this buyer
    pub last_claim_timestamp: i64, // Timestamp of last claim
    pub referrer: Option<Pubkey>, // Optional referrer address
}