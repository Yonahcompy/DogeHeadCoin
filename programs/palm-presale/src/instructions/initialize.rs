use anchor_lang::prelude::*;

use crate::state::PresaleInfo;
use crate::state::PresaleStage;

// Initialize the presale contract with only the first stage
pub fn initialize(
    ctx: Context<Initialize>,
    token_mint_address: Pubkey,
    softcap_amount: u64,
    hardcap_amount: u64,
    max_token_amount_per_address: u64,
    token_price: u64,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;
    let authority = &ctx.accounts.authority;

    // Initialize presale info
    presale_info.token_mint_address = token_mint_address;
    presale_info.softcap_amount = softcap_amount;
    presale_info.hardcap_amount = hardcap_amount;
    presale_info.deposit_token_amount = 0;
    presale_info.sold_token_amount = 0;
    presale_info.max_token_amount_per_address = max_token_amount_per_address;
    presale_info.max_token_amount = 3_000_000_000; // Set maximum token amount to 3 billion
    presale_info.is_live = true; // Start presale immediately
    presale_info.authority = authority.key();
    presale_info.is_soft_capped = false;
    presale_info.is_hard_capped = false;
    presale_info.current_stage = 1; // Start with stage 1
    presale_info.total_stages = 5; // Hardcoded to 5 stages
    presale_info.total_raised = 0;
    presale_info.min_token_amount = 1_000_000_000; // 1 billion tokens minimum (soft cap)
    presale_info.token_price = token_price;
    presale_info.start_time = start_time;
    presale_info.end_time = end_time;
    presale_info.is_active = true;
    presale_info.bump = ctx.bumps.presale_info;

    // Initialize Stage 1
    let stage1 = &mut ctx.accounts.stage1;
    stage1.stage_number = 1;
    stage1.available_tokens = 750_000_000;
    stage1.price_per_token = 100_000; // 0.0001 SOL in lamports
    stage1.tokens_sold = 0;
    stage1.is_active = true; // Activate stage 1 immediately

    msg!(
        "Presale has been initialized and started for token: {} with first stage active",
        presale_info.token_mint_address
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    token_mint_address: Pubkey,
    softcap_amount: u64,
    hardcap_amount: u64,
    max_token_amount_per_address: u64,
    token_price: u64,
    start_time: i64,
    end_time: i64,
)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [b"PRESALE_SEED"],
        bump,
        payer = authority,
        space = 8 + std::mem::size_of::<PresaleInfo>(),
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<PresaleStage>(),
        seeds = [b"STAGE_SEED", 1u8.to_le_bytes().as_ref()],
        bump
    )]
    pub stage1: Box<Account<'info, PresaleStage>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}