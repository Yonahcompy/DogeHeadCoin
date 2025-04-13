import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';

async function main() {
    // Load your keypair from the JSON file
    const keypairFile = fs.readFileSync(path.resolve(__dirname, 'new.json'), 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Create provider
    const provider = new AnchorProvider(connection, new Wallet(keypair), {});
    anchor.setProvider(provider);

    const program = new Program(
        require('./target/idl/palm_presale.json'),
        new PublicKey('Bxa17nCo2DYSy9FBVnugR2GeU4kGJ1tPPSxhWWzLBHDd'),
        provider
    );

    // Presale parameters
    const tokenMintAddress = new PublicKey('9CgvetBL3GYxiGrquTpxEqDm1AmBtLAQE1qKz7rayzMX');
    const softcapAmount = new BN(750000000);
    const hardcapAmount = new BN(1000000000);
    const maxTokenAmountPerAddress = new BN(100000000);
    const pricePerToken = new BN(100000000); // 0.1 SOL
    const startTime = new BN(Date.now());
    const endTime = new BN(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const totalStages = 5;

    // Get the presale info PDA
    const [presaleInfoPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from('PRESALE_SEED')],
        program.programId
    );

    console.log('Creating presale...');
    console.log('Presale Info PDA:', presaleInfoPDA.toString());

    // Create the presale
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
            presaleInfo: presaleInfoPDA,
            authority: keypair.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([keypair])
        .rpc();

    console.log('Transaction signature:', tx);
    console.log('Presale created successfully!');
}

main().catch(console.error); 