use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PresaleStage {
    // Stage number (1, 2, 3, etc.)
    pub stage_number: u8,
    
    // Total amount of tokens available in this stage
    pub available_tokens: u64,
    
    // Price per token in this stage (in lamports)
    pub price_per_token: u64,
    
    // Amount of tokens sold in this stage
    pub tokens_sold: u64,
    
    // Whether this stage is active
    pub is_active: bool,
    
    // Start time of this stage
    pub start_time: u64,
    
    // End time of this stage
    pub end_time: u64,
} 