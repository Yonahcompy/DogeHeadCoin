use anchor_lang::prelude::*;
use pyth_sdk_solana::load_price_feed_from_account_info;

pub fn get_sol_price(price_feed: &AccountInfo) -> Result<f64> {
    let price_feed = load_price_feed_from_account_info(price_feed)
        .map_err(|_| error!(PresaleError::InvalidPriceFeed))?;
    
    let price = price_feed.get_current_price()
        .map_err(|_| error!(PresaleError::InvalidPriceFeed))?;
    
    Ok(price.price as f64 / 10f64.powi(price.expo))
}

pub fn usd_to_sol(usd_amount: f64, sol_price: f64) -> u64 {
    let sol_amount = usd_amount / sol_price;
    (sol_amount * 1e9) as u64 // Convert to lamports
} 