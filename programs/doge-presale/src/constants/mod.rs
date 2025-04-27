// Constants for the Doge Presale program

// Token decimals (standard for SPL tokens)
pub const TOKEN_DECIMALS: u8 = 9;

// Fallback SOL/USD price (in case Pyth price feed fails)
pub const FALLBACK_SOL_USD_PRICE: f64 = 149.42;

// Minimum and maximum purchase amounts (in USD)
pub const MIN_PURCHASE_USD: f64 = 10.0; // 10 USD
pub const MAX_PURCHASE_USD: f64 = 10000.0; // 10,000 USD

// Soft cap and hard cap (in USD)
pub const SOFT_CAP_USD: f64 = 100_000.0; // 100,000 USD
pub const HARD_CAP_USD: f64 = 1_000_000.0; // 1,000,000 USD

// Default presale duration (in seconds)
pub const DEFAULT_PRESALE_DURATION: i64 = 7 * 24 * 60 * 60; // 7 days

// Stage information
pub const STAGE_COUNT: u8 = 5;

// Token prices for each stage (in USD)
pub const STAGE_PRICES: [f64; STAGE_COUNT as usize] = [
    0.0001,  // Stage 1: 0.0001 USD
    0.00033, // Stage 2: 0.00033 USD
    0.000957, // Stage 3: 0.000957 USD
    0.00202, // Stage 4: 0.00202 USD
    0.00313, // Stage 5: 0.00313 USD
];

// Token amounts for each stage
pub const STAGE_TOKEN_AMOUNTS: [u64; STAGE_COUNT as usize] = [
    750_000_000, // Stage 1: 750 million tokens
    600_000_000, // Stage 2: 600 million tokens
    450_000_000, // Stage 3: 450 million tokens
    600_000_000, // Stage 4: 600 million tokens
    600_000_000, // Stage 5: 600 million tokens
];

// Total tokens available for presale
pub const TOTAL_TOKENS: u64 = 3_000_000_000; // 3 billion tokens 

// Vesting configuration
pub const VESTING_CLIFF_DURATION: i64 = 30 * 24 * 60 * 60; // 30 days cliff
pub const VESTING_TOTAL_DURATION: i64 = 365 * 24 * 60 * 60; // 365 days total vesting

// Number of vesting tiers
pub const VESTING_TIER_COUNT: u8 = 5;

// Vesting tier percentages (must sum to 100)
pub const VESTING_TIER_PERCENTAGES: [u8; VESTING_TIER_COUNT as usize] = [
    0,    // Tier 1: 0% (cliff period)
    20,   // Tier 2: 20% after cliff
    30,   // Tier 3: 30% after 3 months
    25,   // Tier 4: 25% after 6 months
    25,   // Tier 5: 25% after 12 months
];

// Vesting tier durations (in seconds from presale end)
pub const VESTING_TIER_DURATIONS: [i64; VESTING_TIER_COUNT as usize] = [
    0,                          // Tier 1: 0 seconds (cliff)
    30 * 24 * 60 * 60,         // Tier 2: 30 days
    90 * 24 * 60 * 60,         // Tier 3: 90 days
    180 * 24 * 60 * 60,        // Tier 4: 180 days
    365 * 24 * 60 * 60,        // Tier 5: 365 days
]; 