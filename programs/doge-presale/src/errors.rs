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
    #[msg("No tokens available to claim")]
    NoTokensToClaim,
    #[msg("Insufficient tokens in presale account")]
    InsufficientTokens,
    #[msg("Arithmetic operation would result in overflow")]
    ArithmeticOverflow,
    #[msg("Already claimed tokens in this time section")]
    AlreadyClaimedInSection,
    #[msg("Already claimed initial 3% tokens")]
    AlreadyClaimedInitial,
    #[msg("Presale has not ended yet")]
    PresaleNotEnded,
} 