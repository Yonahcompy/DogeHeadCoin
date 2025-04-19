use anchor_lang::prelude::*;

#[error_code]
pub enum PresaleError {
    #[msg("Invalid authority")]
    InvalidAuthority,
    
    #[msg("Invalid stage number")]
    InvalidStageNumber,
    
    #[msg("Stage not active")]
    StageNotActive,
    
    #[msg("Stage already active")]
    StageAlreadyActive,
    
    #[msg("Previous stage not completed")]
    PreviousStageNotCompleted,
    
    #[msg("Previous stage not sold out")]
    PreviousStageNotSoldOut,
    
    #[msg("Previous stage required")]
    PreviousStageRequired,
    
    #[msg("Stage not started")]
    StageNotStarted,
    
    #[msg("Stage ended")]
    StageEnded,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Presale already started")]
    PresaleAlreadyStarted,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Invalid presale token account")]
    InvalidPresaleTokenAccount,
    
    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,
    
    #[msg("Insufficient token balance")]
    InsufficientTokenBalance,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Referral already exists")]
    ReferralAlreadyExists,
    
    #[msg("Invalid referral code")]
    InvalidReferralCode,
    
    #[msg("Self referral not allowed")]
    SelfReferral,
    
    #[msg("Presale not started")]
    PresaleNotStarted,
    
    #[msg("Presale ended")]
    PresaleEnded,
    
    #[msg("Presale not ended")]
    PresaleNotEnded,
    
    #[msg("Insufficient funds")]
    InsufficientFund,
    
    #[msg("Hard capped")]
    HardCapped,
    
    #[msg("Token amount mismatch")]
    TokenAmountMismatch,
    
    #[msg("Invalid time settings")]
    InvalidTimeSettings,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("No referral rewards available")]
    NoReferralRewards,

    #[msg("Rewards have already been claimed")]
    RewardsAlreadyClaimed,

    #[msg("Presale has already ended")]
    PresaleAlreadyEnded,

    #[msg("Softcap not reached")]
    SoftcapNotReached,

    #[msg("No tokens to claim")]
    NoTokensToClaim,
} 