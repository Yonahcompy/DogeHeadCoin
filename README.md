# Doge Presale - Solana Token Presale Program

A Solana program for conducting token presales with a 5-stage pricing structure.

## Features

- 5-stage presale with increasing token prices
- Configurable start and end times
- Token deposit and distribution
- Buy tokens with SOL
- Finalize presale after completion

## Program Structure

The program is organized into the following modules:

- `constants`: Contains constants used throughout the program
- `errors`: Contains error definitions
- `instructions`: Contains the core logic for the presale
- `state`: Contains the state structures and account validation

## Instructions

### Initialize

Initialize a new presale with the following parameters:
- `start_time`: Unix timestamp when the presale starts
- `end_time`: Unix timestamp when the presale ends

### Deposit Tokens

Deposit tokens into the presale contract:
- `amount`: Amount of tokens to deposit

### Buy

Buy tokens during the presale:
- `amount`: Amount of SOL to spend

### Finalize

Finalize the presale after it has ended.

## Development

### Prerequisites

- Rust
- Solana CLI
- Anchor Framework

### Building

```bash
anchor build
```

### Deploying

```bash
anchor deploy
```

## License

MIT







| Stage | Available Tokens | Price Per Token ($) | Total Sale |
|-------|-----------------|----------------------|------------|
| 1     | 750,000,000     | 0.0001               |            |
| 2     | 600,000,000     | 0.00033              |            |
| 3     | 450,000,000     | 0.000957             |            |
| 4     | 600,000,000     | 0.00202              |            |
| 5     | 600,000,000     | 0.00313              |            |
| TOTAL | 3,000,000,000   |                      |            |



<!--  -->

solana-keygen new --no-bip39-passphrase -o target/deploy/doge_presale-keypair.json --force



solana-keygen pubkey ./target/deploy/doge_presale-keypair.json



solana program extend 6K7sJ3qMCCwmnmf1FGg8CN7Pdcq4NZo2c9yj8ge8SoTu 20000 -u devnet -k ./authority.json



solana program write-buffer target/deploy/doge_presale.so --keypair ./authority.json



solana program deploy --buffer ABTHzM47KhWcxvvRbgFXcep8cuuuevhnsSm45iUmZp2T --program-id 6K7sJ3qMCCwmnmf1FGg8CN7Pdcq4NZo2c9yj8ge8SoTu --keypair ./authority.json