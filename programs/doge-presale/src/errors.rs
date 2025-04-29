use anchor_lang::prelude::*;

#[error_code]
pub enum PresaleError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Transaction limit reached")]
    TransactionLimitReached,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Invalid stage")]
    InvalidStage,
    #[msg("Unauthorized")]
    Unauthorized,
} 