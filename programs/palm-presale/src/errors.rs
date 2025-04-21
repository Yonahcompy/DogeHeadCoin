use anchor_lang::prelude::*;

#[error_code]
pub enum PresaleError {
    #[msg("The presale has not started yet")]
    PresaleNotStarted,
    
    #[msg("The presale has already ended")]
    PresaleNotEnded,
    
    #[msg("The presale is not live")]
    PresaleNotLive,
    
    #[msg("Invalid Solana wallet address")]
    InvalidSolanaWallet,
    
    #[msg("Self referral is not allowed")]
    SelfReferralNotAllowed,
    
    #[msg("Unauthorized updater")]
    UnauthorizedUpdater,
    
    #[msg("Arithmetic overflow")]
    Overflow,
    
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
    
    #[msg("Presale ended")]
    PresaleEnded,
    
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

    #[msg("Invalid referrer")]
    InvalidReferrer,

    #[msg("Invalid price feed")]
    InvalidPriceFeed,
} 