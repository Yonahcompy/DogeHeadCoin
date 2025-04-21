use anchor_lang::prelude::*;
use crate::state::PresaleInfo;
use crate::errors::PresaleError;

pub fn set_authorized_updater(ctx: Context<SetAuthorizedUpdater>, new_updater: Pubkey) -> Result<()> {
    ctx.accounts.presale_info.authorized_updater = new_updater;
    Ok(())
}

#[derive(Accounts)]
pub struct SetAuthorizedUpdater<'info> {
    #[account(
        mut,
        constraint = authority.key() == presale_info.authority @ PresaleError::InvalidAuthority
    )]
    pub presale_info: Account<'info, PresaleInfo>,

    /// CHECK: This is the authority that can set the authorized updater
    pub authority: Signer<'info>,
}
