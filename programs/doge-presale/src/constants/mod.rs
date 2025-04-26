// Constants for the Doge Presale program

// Token decimals (standard for SPL tokens)
pub const TOKEN_DECIMALS: u8 = 9;

// Minimum and maximum purchase amounts (in lamports)
pub const MIN_PURCHASE_AMOUNT: u64 = 100_000_000; // 0.1 SOL
pub const MAX_PURCHASE_AMOUNT: u64 = 10_000_000_000; // 10 SOL

// Soft cap and hard cap (in lamports)
pub const SOFT_CAP: u64 = 100_000_000_000; // 100 SOL
pub const HARD_CAP: u64 = 1_000_000_000_000; // 1000 SOL

// Default presale duration (in seconds)
pub const DEFAULT_PRESALE_DURATION: i64 = 7 * 24 * 60 * 60; // 7 days

// Stage information
pub const STAGE_COUNT: u8 = 5;

// Token prices for each stage (in lamports)
pub const STAGE_PRICES: [u64; STAGE_COUNT as usize] = [
    100_000, // Stage 1: 0.0001 SOL
    150_000, // Stage 2: 0.00015 SOL
    200_000, // Stage 3: 0.0002 SOL
    250_000, // Stage 4: 0.00025 SOL
    300_000, // Stage 5: 0.0003 SOL
];

// Token amounts for each stage
pub const STAGE_TOKEN_AMOUNTS: [u64; STAGE_COUNT as usize] = [
    1_000_000_000, // Stage 1: 1 billion tokens
    1_000_000_000, // Stage 2: 1 billion tokens
    1_000_000_000, // Stage 3: 1 billion tokens
    1_000_000_000, // Stage 4: 1 billion tokens
    1_000_000_000, // Stage 5: 1 billion tokens
]; 