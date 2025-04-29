// Constants for the presale program
pub const SOL_USD_PRICE: f64 = 0.0066;    // 1 USD = 0.0066 SOL
pub const MAX_TRANSACTIONS: usize = 100; // Maximum number of transactions to store (matching account space)

// Stage prices in USD
pub const STAGE_PRICES: [f64; 4] = [
    0.0001,  // Stage 0: $0.0001
    0.0002,  // Stage 1: $0.0002
    0.0003,  // Stage 2: $0.0003
    0.0004,  // Stage 3: $0.0004
];

pub const STAGE_COUNT: u8 = 4;  // Total number of stages (0-3) 