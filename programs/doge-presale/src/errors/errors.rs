use anchor_lang::prelude::*;

#[error_code]
pub enum PresaleError {
    #[msg("Presale has not started yet")]
    PresaleNotStarted,
    
    #[msg("Presale has ended")]
    PresaleEnded,
    
    #[msg("Presale is already finalized")]
    PresaleAlreadyFinalized,
    
    #[msg("Purchase amount is below minimum")]
    BelowMinimumBuy,
    
    #[msg("Purchase amount is above maximum")]
    AboveMaximumBuy,
    
    #[msg("Hard cap would be exceeded")]
    HardCapExceeded,
    
    #[msg("Soft cap not reached")]
    SoftCapNotReached,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Math operation overflow")]
    MathOverflow,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    #[msg("Invalid stage number")]
    InvalidStage,
    
    #[msg("No tokens available in this stage")]
    NoTokensAvailable,
    
    #[msg("Invalid price feed")]
    InvalidPriceFeed,
    
    #[msg("Price feed is stale")]
    StalePriceFeed,
    
    #[msg("User account not found")]
    UserNotFound,
    
    #[msg("Invalid token amount")]
    InvalidTokenAmount,
    
    #[msg("Invalid USD amount")]
    InvalidUsdAmount,
    
    #[msg("Presale is not active")]
    PresaleNotActive,
    
    #[msg("Presale is finalized")]
    PresaleFinalized,
    
    #[msg("All stages completed")]
    AllStagesCompleted,
    
    #[msg("Insufficient tokens available")]
    InsufficientTokens,
    
    #[msg("Arithmetic overflow")]
    Overflow,
    
    #[msg("Presale still active")]
    PresaleStillActive,
    
    #[msg("No tokens to claim")]
    NoTokensToClaim,
    
    #[msg("Presale not finalized")]
    PresaleNotFinalized,
    
    #[msg("Vesting has not started yet")]
    VestingNotStarted,
}