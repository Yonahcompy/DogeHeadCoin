import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';
import fs from 'fs';

async function main() {
    // Load authority keypair from id.json
    const keypairFile = fs.readFileSync('id.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load token mint address
    const tokenMintFile = fs.readFileSync('token-mint.json', 'utf-8');
    const tokenMintAddress = new PublicKey(JSON.parse(tokenMintFile));
    console.log('Token Mint Address:', tokenMintAddress.toBase58());

    // Get user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        keypair.publicKey
    );
    console.log('User Token Account:', userTokenAccount.toBase58());

    // Create transaction
    const transaction = new Transaction();

    // Check if user's token account exists
    const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
    if (!userTokenAccountInfo) {
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
    const amount = 1_000_000_000; // 1B tokens
    transaction.add(
        createMintToInstruction(
            tokenMintAddress, // mint
            userTokenAccount, // destination
            keypair.publicKey, // authority
            amount
        )
    );

    // Send and confirm transaction
    try {
        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = keypair.publicKey;

        const signature = await connection.sendTransaction(transaction, [keypair]);
        await connection.confirmTransaction({
            signature,
            ...latestBlockhash
        });
        console.log('Transaction signature:', signature);
        console.log('Tokens minted successfully!');
    } catch (error) {
        console.error('Error minting tokens:', error);
    }
}

main().catch(console.error); 