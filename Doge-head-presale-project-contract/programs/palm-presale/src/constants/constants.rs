use anchor_lang::prelude::*;

#[constant]
pub const PRESALE_SEED: &[u8] = b"PRESALE_SEED";
pub const USER_SEED: &[u8] = b"USER_SEED";
pub const PRESALE_VAULT: &[u8] = b"PRESALE_VAULT";
pub const STAGE_SEED: &[u8] = b"STAGE_SEED";
pub const REFERRAL_SEED: &[u8] = b"REFERRAL_SEED";
pub const RENT_MINIMUM: u64 = 1_000_000;

// Referral reward percentages (basis points - 100 = 1%)
pub const REFERRER_REWARD_BPS: u16 = 200; // 2%
pub const REFEREE_REWARD_BPS: u16 = 200;  // 2%
pub const BPS_DENOMINATOR: u16 = 10000;   // 100%