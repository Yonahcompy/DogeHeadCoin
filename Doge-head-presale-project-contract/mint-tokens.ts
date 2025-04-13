import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { 
    getAssociatedTokenAddress, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction
} from '@solana/spl-token';
import fs from 'fs';

async function main() {
    // Load the authority keypair from authority.json
    const keypairFile = fs.readFileSync('authority.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load token mint address from token-mint.json
    const tokenMintAddress = new PublicKey(fs.readFileSync('token-mint.json', 'utf-8').replace(/"/g, ''));
    console.log('Token Mint Address:', tokenMintAddress.toBase58());

    // Get user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        keypair.publicKey
    );
    console.log('User Token Account:', userTokenAccount.toBase58());

    // Create transaction
    const transaction = new Transaction();

    // Add instruction to create user's associated token account if it doesn't exist
    try {
        await connection.getTokenAccountBalance(userTokenAccount);
        console.log('User token account exists');
    } catch (error) {
        console.log('Creating user token account...');
        transaction.add(
            createAssociatedTokenAccountInstruction(
                keypair.publicKey, // payer
                userTokenAccount, // ata
                keypair.publicKey, // owner
                tokenMintAddress // mint
            )
        );
    }

    // Add mint instruction
    const amount = 1_000_000_000 * Math.pow(10, 9); // 1 billion tokens with 9 decimals
    transaction.add(
        createMintToInstruction(
            tokenMintAddress, // mint
            userTokenAccount, // destination
            keypair.publicKey, // authority
            amount
        )
    );

    // Send transaction
    const signature = await connection.sendTransaction(transaction, [keypair]);
    await connection.confirmTransaction(signature);
    console.log('Transaction signature:', signature);
    console.log('Tokens minted successfully!');
}

main().then(
    () => process.exit(0),
    (err) => {
        console.error(err);
        process.exit(1);
    }
); 