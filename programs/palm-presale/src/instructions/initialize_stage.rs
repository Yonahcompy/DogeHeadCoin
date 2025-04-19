use anchor_lang::prelude::*;

use crate::state::PresaleInfo;
use crate::state::PresaleStage;
use crate::constants::PRESALE_SEED;
use crate::constants::STAGE_SEED;

// Initialize an additional stage for the presale
pub fn initialize_stage(
    ctx: Context<InitializeStage>,
    stage_number: u8,
    available_tokens: u64,
    price_per_token: u64,
) -> Result<()> {
    // Validate stage number
    if stage_number < 2 || stage_number > 5 {
        return Err(ErrorCode::InvalidStageNumber.into());
    }

    // Check if presale info exists
    let presale_info = &ctx.accounts.presale_info;
    if presale_info.total_stages < stage_number {
        return Err(ErrorCode::StageNumberExceedsTotal.into());
    }

    // Initialize the stage
    let stage = &mut ctx.accounts.stage;
    stage.stage_number = stage_number;
    stage.available_tokens = available_tokens;
    stage.price_per_token = price_per_token;
    stage.tokens_sold = 0;
    stage.is_active = false;

    msg!(
        "Stage {} has been initialized with {} tokens at price {} lamports per token",
        stage_number, available_tokens, price_per_token
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(stage_number: u8)]
pub struct InitializeStage<'info> {
    #[account(
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<PresaleStage>(),
        seeds = [STAGE_SEED, &[stage_number]],
        bump
    )]
    pub stage: Box<Account<'info, PresaleStage>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid stage number. Must be between 2 and 5")]
    InvalidStageNumber,
    #[msg("Stage number exceeds total stages")]
    StageNumberExceedsTotal,
} 