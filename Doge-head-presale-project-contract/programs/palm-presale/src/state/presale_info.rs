use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PresaleInfo {
    // Mint address of the presale token
    pub token_mint_address: Pubkey,
    // Softcap
    pub softcap_amount: u64,
    // Hardcap
    pub hardcap_amount: u64,
    // Total amount of presale tokens available in the presale
    pub deposit_token_amount: u64,
    // Total amount of presale tokens sold during the presale
    pub sold_token_amount: u64,
    // Maximum amount of presale tokens an address can purchase
    pub max_token_amount_per_address: u64,
    // Presale is buyable
    pub is_live: bool,
    // Authority of the presale
    pub authority: Pubkey,
    // Status of softcapped
    pub is_soft_capped: bool,
    // Status of hardcapped
    pub is_hard_capped: bool,
    // Current active stage number
    pub current_stage: u8,
    // Total number of stages in the presale
    pub total_stages: u8,
}