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

    // Initialize presale
    const softcapAmount = new BN(1000); // 1000 SOL
    const hardcapAmount = new BN(2000); // 2000 SOL
    const maxTokenAmountPerAddress = new BN(100_000_000); // 100M tokens
    const pricePerToken = new BN(1); // 1 lamport per token
    const startTime = new BN(Math.floor(Date.now() / 1000)); // Start now
    const endTime = new BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // End in 7 days
    const totalStages = 1; // Single stage

    console.log('Initializing presale...');
    console.log('Softcap:', softcapAmount.toString(), 'SOL');
    console.log('Hardcap:', hardcapAmount.toString(), 'SOL');
    console.log('Max tokens per address:', maxTokenAmountPerAddress.toString());
    console.log('Price per token:', pricePerToken.toString(), 'lamports');
    console.log('Start time:', new Date(startTime.toNumber() * 1000).toISOString());
    console.log('End time:', new Date(endTime.toNumber() * 1000).toISOString());

    try {
        const tx = await program.methods
            .createPresale(
                tokenMintAddress,
                softcapAmount,
                hardcapAmount,
                maxTokenAmountPerAddress,
                pricePerToken,
                startTime,
                endTime,
                totalStages
            )
            .accounts({
                presaleInfo: presaleInfo,
                authority: keypair.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log('Transaction signature:', tx);
        console.log('Presale initialized successfully!');
    } catch (error) {
        console.error('Error initializing presale:', error);
    }
}

main().then(
    () => process.exit(0),
    (err) => {
        console.error(err);
        process.exit(1);
    }
); 