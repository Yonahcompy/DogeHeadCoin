use {
    anchor_lang::prelude::*,
};

use crate::constants::PRESALE_SEED;
use crate::constants::STAGE_SEED;
use crate::state::PresaleInfo;
use crate::state::PresaleStage;
use crate::errors::PresaleError;

pub fn activate_stage(
    ctx: Context<ActivateStage>,
    stage_number: u8,
) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;
    let presale_stage = &mut ctx.accounts.presale_stage;
    
    // Only the authority can activate stages
    if presale_info.authority != ctx.accounts.authority.key() {
        return Err(PresaleError::InvalidAuthority.into());
    }
    
    // Validate stage number
    if stage_number == 0 || stage_number > presale_info.total_stages {
        return Err(PresaleError::InvalidStageNumber.into());
    }
    
    // Check if stage is already active
    if presale_stage.is_active {
        return Err(PresaleError::StageAlreadyActive.into());
    }
    
    // Check if this is the first stage or if the previous stage is completed
    if stage_number > 1 {
        // For stages after the first, we need to verify the previous stage was completed
        // We'll need the previous stage account to check
        if let Some(previous_stage) = &ctx.accounts.previous_stage {
            // Verify the previous stage is the right one
            if previous_stage.stage_number != stage_number - 1 {
                return Err(PresaleError::InvalidStageNumber.into());
            }
            
            // Check if previous stage was completed (tokens_sold >= available_tokens)
            if previous_stage.tokens_sold < previous_stage.available_tokens {
                msg!("Previous stage {} must sell all tokens first", stage_number - 1);
                return Err(PresaleError::StageNotActive.into());
            }
            
            // Ensure previous stage is inactive
            if previous_stage.is_active {
                msg!("Previous stage {} must be deactivated first", stage_number - 1);
                return Err(PresaleError::StageAlreadyActive.into());
            }
        } else {
            // If we're activating a stage > 1, we must provide the previous stage
            return Err(PresaleError::InvalidStageNumber.into());
        }
    }
    
    // Activate the stage
    presale_stage.is_active = true;
    presale_info.current_stage = stage_number;
    presale_info.is_live = true;
    
    // Update presale info with the active stage's values
    presale_info.price_per_token = presale_stage.price_per_token;
    
    msg!("Activated stage {} with price {} per token", 
        stage_number, presale_stage.price_per_token);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(stage_number: u8)]
pub struct ActivateStage<'info> {
    #[account(
        mut,
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,
    
    #[account(
        mut,
        seeds = [STAGE_SEED, &[stage_number]],
        bump
    )]
    pub presale_stage: Box<Account<'info, PresaleStage>>,
    
    /// Previous stage account (required for stages > 1)
    #[account(mut)]
    pub previous_stage: Option<Account<'info, PresaleStage>>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
} 