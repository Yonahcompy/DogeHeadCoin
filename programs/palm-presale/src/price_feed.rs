use anchor_lang::prelude::*;
use pyth_sdk_solana::{load_price_feed_from_account_info, PriceFeed};
use solana_program::clock::Clock;

pub const PYTH_SOL_USD_PRICE_FEED: &str = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";

pub fn get_sol_price(price_feed: &AccountInfo) -> Result<f64> {
    let price_feed = load_price_feed_from_account_info(price_feed)
        .map_err(|_| error!(ErrorCode::InvalidPriceFeed))?;
    
    let price = price_feed.get_price_no_older_than(Clock::get()?.unix_timestamp, 60)
        .ok_or(ErrorCode::InvalidPriceFeed)?;
    
    // Convert price to decimal
    let price_decimal = (price.price as f64) * 10f64.powi(price.expo);
    
    Ok(price_decimal)
}

pub fn calculate_sol_amount(usd_amount: f64, sol_price: f64) -> Result<u64> {
    // Calculate SOL amount needed
    let sol_amount = usd_amount / sol_price;
    
    // Convert to lamports (1 SOL = 1_000_000_000 lamports)
    let lamports = (sol_amount * 1_000_000_000.0) as u64;
    
    Ok(lamports)
}

pub fn validate_price_feed(price_feed: &AccountInfo) -> Result<()> {
    let price_feed = load_price_feed_from_account_info(price_feed)
        .map_err(|_| error!(ErrorCode::InvalidPriceFeed))?;
    
    let _ = price_feed.get_price_no_older_than(Clock::get()?.unix_timestamp, 60)
        .ok_or(ErrorCode::StalePriceFeed)?;
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid price feed")]
    InvalidPriceFeed,
    #[msg("Price feed is stale")]
    StalePriceFeed,
} 