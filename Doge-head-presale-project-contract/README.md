# Doge Head Presale Smart Contract

This smart contract manages the presale for Doge Head tokens on Solana. It includes a staged presale system where each stage has different token amounts and prices, following the plan in the project specifications. It also features a referral system where users can earn rewards for referring others.

## Presale Stages

The presale is designed with 5 stages:

| Stage | Available Tokens | Price Per Token | Total Sale |
|-------|-----------------|----------------|------------|
| 1     | 750,000,000     | 0.0001         | $75,000    |
| 2     | 600,000,000     | 0.00033        | $198,000   |
| 3     | 450,000,000     | 0.000957       | $430,650   |
| 4     | 600,000,000     | 0.00202        | $1,212,000 |
| 5     | 600,000,000     | 0.00313        | $1,878,000 |
| TOTAL | 3,000,000,000   |                | $3,793,650 |

Note: The presale represents 60% of the total token supply.

## How The Staged Presale Works

1. The presale is created with a specified number of stages
2. Each stage is configured with:
   - Available token amount
   - Price per token
   - Stage number (1-5)
3. Stage progression:
   - Each stage must be activated by the presale authority
   - Stages progress sequentially (1, 2, 3, etc.)
   - A stage automatically ends when all its tokens are sold
   - The next stage must be manually activated after the previous one completes
4. Users can purchase tokens during active stages
5. Token prices automatically adjust based on the current stage

## Referral System

The presale includes a referral system that rewards users for bringing in new participants:

1. **Referral Creation**: Users can create their own referral code through the `create_referral` function
2. **Referral Process**: When a user buys tokens, they can include a referrer's code
3. **Rewards**: Both the referrer and referee receive rewards:
   - Referrer: 2% of the purchase amount in SOL
   - Referee: 2% of the purchase amount in SOL (instant discount)
4. **Tracking**: The system tracks:
   - Total number of referrals
   - Total purchase amount through referrals
   - Total rewards earned
5. **Claiming Rewards**: Referrers can claim their accumulated rewards at any time

## Smart Contract Functions

### Admin Functions

- `create_presale`: Initialize the presale contract
- `add_presale_stage`: Add a new stage with token amount and pricing
- `activate_stage`: Activate a specific stage for sales
- `deposit_token`: Deposit tokens into the presale contract
- `withdraw_sol`: Withdraw collected SOL from sales
- `withdraw_token`: Withdraw unsold tokens

### User Functions

- `buy_token`: Purchase tokens in the current active stage (with optional referral code)
- `claim_token`: Claim purchased tokens after purchase
- `create_referral`: Generate a unique referral code
- `claim_referral_rewards`: Claim earned referral rewards
- `get_referral_stats`: View statistics about your referrals

## How to Use

1. Create the presale with `create_presale` (specify 5 total stages)
2. Add each stage using `add_presale_stage`
3. Deposit tokens using `deposit_token`
4. Activate Stage 1 using `activate_stage`
5. Users can create referral codes with `create_referral`
6. Users can buy tokens with `buy_token` (can include a referral code)
7. Users can view their referral stats with `get_referral_stats`
8. Users can claim referral rewards with `claim_referral_rewards`
9. When Stage 1 sells out, activate Stage 2, and so on
10. After presale completion, users can claim their tokens

## Development

This contract is built using the Anchor framework for Solana.

## Prerequisites

Ensure you have the following tools installed:

- [Rust](https://www.rust-lang.org/tools/install)
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- [Anchor CLI](https://project-serum.github.io/anchor/getting-started/installation.html)
- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/getting-started/install)

## Getting Started

1. **Installation:** Clone the repository and install dependencies.

   ```bash
   git clone https://github.com/preciousken/doge-head-contract.git
   cd Doge-head-presale-project-contract
   yarn
   ```

2. **Build the Smart Contract:**

   ```bash
   anchor build
   ```

3. **Run Tests:**

   ```bash
   anchor test
   ```

4. **Deploy:**

   Switch to your desired network and deploy:

   ```bash
   anchor deploy
   ```



   if you want to extend instead of redeploying
   solana program extend Bxa17nCo2DYSy9FBVnugR2GeU4kGJ1tPPSxhWWzLBHDd 20000 -u devnet -k ./id.json


   <!-- create a buffer -->
   solana program write-buffer target/deploy/palm_presale.so --keypair ./id.json

   <!-- upgrade using the buffer -->

   solana program deploy --buffer 7zZVMAvdVa1mpr4YhH3ysbvfSqbBFMPymsGESNbFje5o --program-id Bxa17nCo2DYSy9FBVnugR2GeU4kGJ1tPPSxhWWzLBHDd --keypair ./id.json





syntaxloom@ademolas-MacBook-Pro Doge-head-presale-project-contract % spl-token mint 8fAdv9nFhxNPTVX9YnBjJ3ERxyLKgUANXHFqCCz4Atrq 3000000000
Minting 3000000000 tokens
  Token: 8fAdv9nFhxNPTVX9YnBjJ3ERxyLKgUANXHFqCCz4Atrq
  Recipient: GsVUdSAXCaFbzPYuSRtDNu3aRpvEgVXRLoeHJ45oxUpw

Signature: 4hNGHigjuot8GQ5ehaaRddbC45TLzngipJrXnSkk8m1fXPtgY3TLiiGmK3k34AwRco54EUKtNrj7ZnoqVAzyHfSe