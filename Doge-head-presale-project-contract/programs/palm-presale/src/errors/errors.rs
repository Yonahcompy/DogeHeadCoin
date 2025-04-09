use anchor_lang::prelude::*;

#[error_code]
pub enum PresaleError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Not allowed")]
    NotAllowed,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Already marked")]
    AlreadyMarked,
    #[msg("Presale not started yet")]
    PresaleNotStarted,
    #[msg("Presale already ended")]
    PresaleEnded,
    #[msg("Token amount mismatch")]
    TokenAmountMismatch,
    #[msg("Insufficient Tokens")]
    InsufficientFund,
    #[msg("Presale not ended yet")]
    PresaleNotEnded,
    #[msg("Presale already ended")]
    HardCapped,
    #[msg("Invalid presale stage")]
    InvalidStageNumber,
    #[msg("Stage not active")]
    StageNotActive,
    #[msg("Invalid time settings")]
    InvalidTimeSettings,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Stage already exists")]
    StageAlreadyExists,
    #[msg("Stage already active")]
    StageAlreadyActive,
    #[msg("Self-referral is not allowed")]
    SelfReferral,
    #[msg("Invalid referral code")]
    InvalidReferralCode,
    #[msg("No referral rewards to claim")]
    NoReferralRewards,
    #[msg("Referral rewards already claimed")]
    RewardsAlreadyClaimed,
}