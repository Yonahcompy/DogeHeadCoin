use anchor_lang::prelude::*;
use crate::constants::FALLBACK_SOL_USD_PRICE;

pub fn get_sol_price(_price_feed: &AccountInfo) -> Result<f64> {
    // Always return the fallback price
    Ok(FALLBACK_SOL_USD_PRICE)
}

pub fn usd_to_sol(usd_amount: f64, sol_price: f64) -> u64 {
    let sol_amount = usd_amount / sol_price;
    (sol_amount * 1e9) as u64 // Convert to lamports
} 