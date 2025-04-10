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
    
    // Validate stage exists
    if presale_stage.stage_number != stage_number {
        return Err(PresaleError::InvalidStageNumber.into());
    }
    
    // For stages > 1, validate previous stage
    if stage_number > 1 {
        if let Some(prev_stage) = &ctx.accounts.previous_stage {
            // Check if previous stage is completed
            if !prev_stage.is_active {
                return Err(PresaleError::PreviousStageNotCompleted.into());
            }
            
            // Check if previous stage has sold all tokens
            if prev_stage.available_tokens > prev_stage.tokens_sold {
                return Err(PresaleError::PreviousStageNotSoldOut.into());
            }
        } else {
            return Err(PresaleError::PreviousStageRequired.into());
        }
    }
    
    // Check if stage is completely sold - automatically end it
    if presale_stage.tokens_sold >= presale_stage.available_tokens {
        presale_stage.is_active = false;
        msg!("Stage {} is fully sold out", stage_number);
        
        // Check if there are more stages to potentially activate
        if stage_number < presale_info.total_stages {
            msg!("Please activate stage {} to continue the presale", stage_number + 1);
        } else {
            // This was the final stage
            presale_info.is_live = false;
            msg!("Final stage completed. Presale is now finished.");
        }
    }
    
    // Activate the stage
    presale_stage.is_active = true;
    presale_info.current_stage = stage_number;
    
    msg!("Stage {} activated successfully", stage_number);
    
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