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
    pub treasury_wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AccountResized {
    pub authority: Pubkey,
    pub new_size: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokenMintChanged {
    pub authority: Pubkey,
    pub old_token_mint: Pubkey,
    pub new_token_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TokensClaimed {
    pub buyer: Pubkey,
    pub amount: u64,
    pub total_claimed: u64,
    pub remaining_balance: u64,
    pub timestamp: i64,
}

#[event]
pub struct PresaleEnded {
    pub authority: Pubkey,
    pub timestamp: i64,
    pub total_buyers: u64,
    pub total_tokens_sold: u64,
}

#[event]
pub struct AuthorityChanged {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TreasuryChanged {
    pub authority: Pubkey,
    pub old_treasury: Pubkey,
    pub new_treasury: Pubkey,
    pub timestamp: i64,
} 