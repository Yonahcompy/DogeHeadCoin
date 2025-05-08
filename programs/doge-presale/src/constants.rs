// Constants for the presale program
pub const SOL_USD_PRICE: f64 = 0.0066;    // 1 USD = 0.0066 SOL
pub const MAX_TRANSACTIONS: usize = 100; // Maximum number of transactions to store (matching account space)

// Stage prices in USD
pub const STAGE_PRICES: [f64; 5] = [
    0.0001,   // Stage 1: $0.0001
    0.00033,  // Stage 2: $0.00033
    0.000957, // Stage 3: $0.000957
    0.00202,  // Stage 4: $0.00202
    0.00313,  // Stage 5: $0.00313
];

pub const STAGE_COUNT: u8 = 5;  // Total number of stages (1-5)

// Available tokens per stage (in token standard decimal 9)
pub const STAGE_AVAILABLE_TOKENS: [u64; 5] = [
    750_000_000_000_000_000,  // Stage 1: 750M tokens
    600_000_000_000_000_000,  // Stage 2: 600M tokens
    450_000_000_000_000_000,  // Stage 3: 450M tokens
    600_000_000_000_000_000,  // Stage 4: 600M tokens
    600_000_000_000_000_000,  // Stage 5: 600M tokens
];

// Vesting constants
pub const TGE_UNLOCK_PERCENTAGES: [u8; 5] = [
    3,  // Stage 1: 3% TGE unlock
    4,  // Stage 2: 4% TGE unlock
    5,  // Stage 3: 5% TGE unlock
    7,  // Stage 4: 7% TGE unlock
    10, // Stage 5: 10% TGE unlock
];

pub const CLIFF_PERIODS: [u8; 5] = [
    4,  // Stage 1: 4 months cliff
    3,  // Stage 2: 3 months cliff
    2,  // Stage 3: 2 months cliff
    1,  // Stage 4: 1 month cliff
    0,  // Stage 5: No cliff
];

pub const VESTING_PERIODS: [u8; 5] = [
    10, // Stage 1: 10 months vesting
    9,  // Stage 2: 9 months vesting
    8,  // Stage 3: 8 months vesting
    7,  // Stage 4: 7 months vesting
    6,  // Stage 5: 6 months vesting
];

// Time constants (in seconds)
pub const SECONDS_PER_MONTH: i64 = 30 * 24 * 60 * 60; // 30 days in seconds
pub const SECONDS_PER_MINUTE: i64 = 60; // 1 minute in seconds 