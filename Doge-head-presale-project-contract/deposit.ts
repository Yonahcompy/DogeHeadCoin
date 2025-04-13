import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';
import { PalmPresale } from './target/types/palm_presale';

async function main() {
    // Load authority keypair from id.json
    const keypairFile = fs.readFileSync('id.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const provider = new AnchorProvider(connection, new Wallet(keypair), {});
    const program = new Program<PalmPresale>(require('./target/idl/palm_presale.json'), new PublicKey('GXucHDqoRWLgX1DcRnbvUi4HmdS9KiBpJZRJQX2GHZgL'), provider);

    // Load token mint address
    const tokenMintFile = fs.readFileSync('token-mint.json', 'utf-8');
    const tokenMintAddress = new PublicKey(JSON.parse(tokenMintFile));
    console.log('Token Mint Address:', tokenMintAddress.toBase58());

    // Get presale info PDA
    const [presaleInfo] = PublicKey.findProgramAddressSync(
        [Buffer.from('PRESALE_SEED')],
        program.programId
    );

    // Get user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        keypair.publicKey
    );
    console.log('User Token Account:', userTokenAccount.toBase58());

    // Get presale token account
    const presaleTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        presaleInfo,
        true // Allow PDA as owner
    );
    console.log('Presale Token Account:', presaleTokenAccount.toBase58());

    // Create transaction
    const transaction = new anchor.web3.Transaction();

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

    // Check if presale token account exists
    const presaleTokenAccountInfo = await connection.getAccountInfo(presaleTokenAccount);
    if (!presaleTokenAccountInfo) {
        console.log('Creating presale token account...');
        transaction.add(
            createAssociatedTokenAccountInstruction(
                keypair.publicKey, // payer
                presaleTokenAccount, // ata
                presaleInfo, // owner
                tokenMintAddress // mint
            )
        );
    }

    // Add deposit instruction
    const amount = new BN(100_000_000); // 100M tokens
    transaction.add(
        await program.methods
            .depositToken(amount)
            .accounts({
                presaleInfo: presaleInfo,
                authority: keypair.publicKey,
                tokenAccount: userTokenAccount,
                presaleTokenAccount: presaleTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()
    );

    // Send and confirm transaction
    try {
        const signature = await provider.sendAndConfirm(transaction);
        console.log('Transaction signature:', signature);
        console.log('Tokens deposited successfully!');
    } catch (error) {
        console.error('Error depositing tokens:', error);
    }
}

main().catch(console.error); 