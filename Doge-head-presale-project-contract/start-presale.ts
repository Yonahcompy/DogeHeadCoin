import { Connection, Keypair, PublicKey, TransactionSignature } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import { IDL, PalmPresale } from './target/types/palm_presale';

async function main(): Promise<void> {
    try {
        // Load the authority keypair from authority.json
        let authorityKeypair: Keypair;
        try {
            const keypairFile: string = fs.readFileSync('authority.json', 'utf-8');
            authorityKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));
            console.log('Authority public key:', authorityKeypair.publicKey.toBase58());
        } catch (error: any) {
            console.error('❌ Error loading authority keypair:', error.message);
            console.error('Make sure authority.json exists and contains a valid keypair');
            return;
        }

        // Connect to devnet
        console.log('Connecting to Solana devnet...');
        const connection: Connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        // Create provider and program
        const provider: AnchorProvider = new AnchorProvider(connection, new Wallet(authorityKeypair), {
            commitment: 'confirmed',
        });
        anchor.setProvider(provider);
        
        // Initialize the program with the program ID from your deployment
        const programId: PublicKey = new PublicKey("EsySUN7oV4ayVueVak1QVWSibQSu3ePgqfKSEeCoxyTc");
        const program = new Program<PalmPresale>(IDL as PalmPresale, programId, provider);

        // Get presale info PDA
        const [presaleInfo]: [PublicKey, number] = PublicKey.findProgramAddressSync(
            [Buffer.from("PRESALE_SEED")],
            program.programId
        );
        console.log('Presale Info PDA:', presaleInfo.toBase58());

        // Fetch presale data to check current status
        const presaleData = await program.account.presaleInfo.fetch(presaleInfo);
        console.log('\nCurrent presale status:');
        console.log('  Token Mint:', presaleData.tokenMintAddress.toBase58());
        console.log('  Authority:', presaleData.authority.toBase58());
        console.log('  Is Live:', presaleData.isLive);
        console.log('  Current Stage:', presaleData.currentStage);
        console.log('  Total Stages:', presaleData.totalStages);
        console.log('  Start Time:', new Date(presaleData.startTime.toNumber() * 1000).toLocaleString());
        console.log('  End Time:', new Date(presaleData.endTime.toNumber() * 1000).toLocaleString());
        
        // Check if presale is already live
        if (presaleData.isLive) {
            console.log('✅ Presale is already live!');
            return;
        }
        
        // Check if the caller is the authority
        if (!presaleData.authority.equals(authorityKeypair.publicKey)) {
            console.error('❌ Only the presale authority can start the presale!');
            console.error(`Presale authority: ${presaleData.authority.toBase58()}`);
            console.error(`Your public key: ${authorityKeypair.publicKey.toBase58()}`);
            return;
        }
        
        // Check if we have at least one stage
        if (presaleData.totalStages === 0) {
            console.error('❌ No stages defined for this presale!');
            console.error('Please add at least one stage before starting the presale.');
            return;
        }

        // Set start and end times
        const startTime: BN = new BN(Math.floor(Date.now() / 1000)); // Start now
        const endTime: BN = new BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // End in 7 days
        
        console.log('\nStarting presale with the following parameters:');
        console.log('  Start Time:', new Date(startTime.toNumber() * 1000).toLocaleString());
        console.log('  End Time:', new Date(endTime.toNumber() * 1000).toLocaleString());

        // Execute the startPresale instruction
        try {
            console.log('\nExecuting startPresale instruction...');
            
            const tx: TransactionSignature = await program.methods
                .startPresale(
                    startTime,
                    endTime
                )
                .accounts({
                    presaleInfo: presaleInfo,
                    authority: authorityKeypair.publicKey,
                })
                .rpc();
                
            console.log('✅ Transaction successful!');
            console.log('Transaction signature:', tx);
            
            // Verify the presale is now live
            const updatedPresaleData = await program.account.presaleInfo.fetch(presaleInfo);
            console.log('\nUpdated presale status:');
            console.log('  Is Live:', updatedPresaleData.isLive);
            console.log('  Start Time:', new Date(updatedPresaleData.startTime.toNumber() * 1000).toLocaleString());
            console.log('  End Time:', new Date(updatedPresaleData.endTime.toNumber() * 1000).toLocaleString());
            
            if (updatedPresaleData.isLive) {
                console.log('\n🎉 Presale is now live! Users can start buying tokens.');
                console.log('Next steps:');
                console.log('1. Share the presale with potential buyers');
                console.log('2. Monitor the presale progress');
                console.log('3. After the presale ends, users can claim their tokens');
            } else {
                console.warn('⚠️ Transaction was successful but presale is still not marked as live.');
                console.warn('Check your contract implementation for any additional requirements.');
            }
            
        } catch (error: any) {
            console.error('❌ Error starting presale:');
            
            if (error.logs) {
                console.error('\nProgram logs:');
                error.logs.forEach((log: string, i: number) => console.error(`  ${i}: ${log}`));
            }
            
            // Check for common errors
            if (error.message && error.message.includes('PresaleAlreadyStarted')) {
                console.error('\nThe presale has already been started.');
            } else if (error.message && error.message.includes('InvalidTimeSettings')) {
                console.error('\nThe time settings are invalid. Make sure end time is after start time.');
            } else if (error.message && error.message.includes('InvalidAuthority')) {
                console.error('\nYou are not authorized to start this presale.');
            }
            
            console.error('\nFull error:', error);
        }
    } catch (error: any) {
        console.error('❌ Unexpected error:', error);
    }
}

main().then(
    () => process.exit(0),
    (err: Error) => {
        console.error('Fatal error:', err);
        process.exit(1);
    }
);