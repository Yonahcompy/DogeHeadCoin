import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';

async function main() {
    // Load the keypair from authority.json
    const keypairFile = fs.readFileSync('authority.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    console.log('Creating new token...');

    // Create new token mint
    const mint = await createMint(
        connection,
        keypair,
        keypair.publicKey,
        keypair.publicKey,
        9 // 9 decimals
    );

    console.log('Token Mint:', mint.toBase58());

    // Get the token account of the owner address, and if it does not exist, create it
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey
    );

    console.log('Token Account:', tokenAccount.address.toBase58());

    // Mint 1 billion tokens to token account
    const mintAmount = 1_000_000_000 * Math.pow(10, 9); // 1 billion with 9 decimals
    await mintTo(
        connection,
        keypair,
        mint,
        tokenAccount.address,
        keypair,
        mintAmount
    );

    console.log('Minted', mintAmount, 'tokens to', tokenAccount.address.toBase58());

    // Save the token mint address to a file
    fs.writeFileSync('token-mint.json', JSON.stringify(mint.toBase58()));
    console.log('Token mint address saved to token-mint.json');
}

main().then(
    () => process.exit(0),
    (err) => {
        console.error(err);
        process.exit(1);
    }
); 