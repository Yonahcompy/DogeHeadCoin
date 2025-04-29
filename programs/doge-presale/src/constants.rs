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