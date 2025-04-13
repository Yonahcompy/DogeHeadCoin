import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { 
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import fs from 'fs';

async function main() {
    // Load the authority keypair from authority.json
    const keypairFile = fs.readFileSync('authority.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    console.log('Creating new token...');

    try {
        // Create new token mint
        const mint = await createMint(
            connection,
            keypair, // payer
            keypair.publicKey, // mint authority
            keypair.publicKey, // freeze authority (you can use null to disable)
            9 // decimals
        );

        console.log('Token mint created:', mint.toBase58());

        // Create associated token account for the authority
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey
        );

        console.log('Token account:', tokenAccount.address.toBase58());

        // Mint 1 billion tokens to authority's token account
        const mintAmount = 1_000_000_000 * Math.pow(10, 9); // 1 billion with 9 decimals
        await mintTo(
            connection,
            keypair,
            mint,
            tokenAccount.address,
            keypair,
            mintAmount
        );

        console.log(`Minted ${mintAmount} tokens to ${tokenAccount.address.toBase58()}`);

        // Save the token mint address to token-mint.json
        fs.writeFileSync('token-mint.json', JSON.stringify(mint.toBase58()));
        console.log('Token mint address saved to token-mint.json');

    } catch (error) {
        console.error('Error creating token:', error);
    }
}

main(); 