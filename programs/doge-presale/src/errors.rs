use anchor_lang::prelude::*;

#[error_code]
pub enum PresaleError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Transaction limit reached")]
    TransactionLimitReached,
    #[msg("Invalid stage")]
    InvalidStage,
    #[msg("Buyer not found")]
    BuyerNotFound,
    #[msg("Invalid referrer address")]
    InvalidReferrer,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Arithmetic overflow")]
    Overflow,
} 