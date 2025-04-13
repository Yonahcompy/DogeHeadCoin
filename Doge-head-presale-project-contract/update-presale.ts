import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import { PalmPresale } from './target/types/palm_presale';

async function main() {
    // Load the authority keypair from authority.json
    const keypairFile = fs.readFileSync('authority.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Create provider and program
    const provider = new AnchorProvider(connection, new Wallet(keypair), {});
    anchor.setProvider(provider);
    const program = anchor.workspace.PalmPresale as Program<PalmPresale>;

    // Load token mint address from token-mint.json
    const tokenMintAddress = new PublicKey(fs.readFileSync('token-mint.json', 'utf-8').replace(/"/g, ''));
    console.log('Token Mint Address:', tokenMintAddress.toBase58());

    // Get presale info PDA
    const [presaleInfo] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED")],
        program.programId
    );

    // Update presale parameters
    const maxTokensPerAddress = new BN(1_000_000 * Math.pow(10, 9)); // 1 million tokens
    const pricePerToken = new BN(0.1 * Math.pow(10, 9)); // 0.1 SOL per token
    const softcap = new BN(10 * Math.pow(10, 9)); // 10 SOL
    const hardcap = new BN(100 * Math.pow(10, 9)); // 100 SOL
    const startTime = new BN(Math.floor(Date.now() / 1000)); // Start now
    const endTime = new BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // End in 7 days

    console.log('Updating presale with parameters:');
    console.log('Max tokens per address:', maxTokensPerAddress.toString());
    console.log('Price per token:', pricePerToken.toString());
    console.log('Softcap:', softcap.toString());
    console.log('Hardcap:', hardcap.toString());
    console.log('Start time:', startTime.toString());
    console.log('End time:', endTime.toString());

    try {
        const tx = await program.methods
            .updatePresale(
                maxTokensPerAddress,
                pricePerToken,
                softcap,
                hardcap,
                startTime,
                endTime
            )
            .accounts({
                presaleInfo: presaleInfo,
                authority: keypair.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log('Transaction signature:', tx);
        console.log('Presale updated successfully!');
    } catch (error) {
        console.error('Error updating presale:', error);
    }
}

main(); 