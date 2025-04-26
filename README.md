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