use anchor_lang::prelude::*;

#[event]
pub struct TokenDeposited {
    pub authority: Pubkey,
    pub amount: u64,
    pub total_deposited: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensPurchased {
    pub buyer: Pubkey,
    pub usd_amount: f64,
    pub sol_amount: u64,
    pub token_amount: u64,
    pub stage: u8,
    pub timestamp: i64,
    pub referrer: Option<Pubkey>,
}

#[event]
pub struct StageAdvanced {
    pub authority: Pubkey,
    pub old_stage: u8,
    pub new_stage: u8,
    pub timestamp: i64,
}

#[event]
pub struct PresaleInitialized {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AccountResized {
    pub authority: Pubkey,
    pub new_size: usize,
    pub timestamp: i64,
} 