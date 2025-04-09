use {
    anchor_lang::prelude::*,
};

use crate::constants::PRESALE_SEED;
use crate::constants::STAGE_SEED;
use crate::state::PresaleInfo;
use crate::state::PresaleStage;
use crate::errors::PresaleError;

pub fn add_presale_stage(
    ctx: Context<AddPresaleStage>,
    stage_number: u8,
    available_tokens: u64,
    price_per_token: u64,
    start_time: u64,
    end_time: u64,
) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;
    let presale_stage = &mut ctx.accounts.presale_stage;
    
    // Only the authority can add stages
    if presale_info.authority != ctx.accounts.authority.key() {
        return Err(PresaleError::InvalidAuthority.into());
    }
    
    // Validate stage number
    if stage_number == 0 || stage_number > presale_info.total_stages {
        return Err(PresaleError::InvalidStageNumber.into());
    }
    
    // Validate times
    if start_time >= end_time {
        return Err(PresaleError::InvalidTimeSettings.into());
    }
    
    // Initialize the stage
    presale_stage.stage_number = stage_number;
    presale_stage.available_tokens = available_tokens;
    presale_stage.price_per_token = price_per_token;
    presale_stage.tokens_sold = 0;
    presale_stage.is_active = false;
    presale_stage.start_time = start_time;
    presale_stage.end_time = end_time;
    
    msg!("Added stage {} with {} tokens at {} lamports per token", 
        stage_number, available_tokens, price_per_token);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(stage_number: u8)]
pub struct AddPresaleStage<'info> {
    #[account(
        mut,
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
    pub presale_stage: Box<Account<'info, PresaleStage>>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
} 