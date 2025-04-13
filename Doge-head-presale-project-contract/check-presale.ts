import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import { PalmPresale } from './target/types/palm_presale';

async function main() {
    // Connect to cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load keypair
    const keypairFile = fs.readFileSync('new.json', 'utf-8');
    const keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));
    
    // Create provider
    const provider = new AnchorProvider(connection, new Wallet(keypair), {});
    anchor.setProvider(provider);

    // Create program interface
    const program = new Program<PalmPresale>(
        require('./target/idl/palm_presale.json'),
        new PublicKey('GXucHDqoRWLgX1DcRnbvUi4HmdS9KiBpJZRJQX2GHZgL'),
        provider
    );

    // Get presale info PDA
    const [presaleInfo] = PublicKey.findProgramAddressSync(
        [Buffer.from('PRESALE_SEED')],
        program.programId
    );
    console.log('Presale Info PDA:', presaleInfo.toString());

    try {
        // Fetch presale info account
        const presaleInfoAccount = await program.account.presaleInfo.fetch(presaleInfo);
        console.log('Presale Info:', {
            authority: presaleInfoAccount.authority.toString(),
            tokenMintAddress: presaleInfoAccount.tokenMintAddress.toString(),
            maxTokenAmountPerAddress: presaleInfoAccount.maxTokenAmountPerAddress.toString(),
            pricePerToken: presaleInfoAccount.pricePerToken.toString(),
            isLive: presaleInfoAccount.isLive,
            startTime: new Date(Number(presaleInfoAccount.startTime.toString())).toISOString(),
            endTime: new Date(Number(presaleInfoAccount.endTime.toString())).toISOString(),
        });
    } catch (error) {
        console.error('Error fetching presale info:', error);
    }
}

main().catch(console.error); 