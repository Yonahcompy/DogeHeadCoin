import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { 
    getAssociatedTokenAddress, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAccount,
    createInitializeAccountInstruction
} from '@solana/spl-token';
import fs from 'fs';
import { PalmPresale } from './target/types/palm_presale';

async function main() {
    // Load the keypair from authority.json
    const keypairFile = fs.readFileSync('authority.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Create provider and program
    const provider = new AnchorProvider(connection, new Wallet(keypair), {});
    const program = new Program<PalmPresale>(
        require('./target/idl/palm_presale.json'),
        new PublicKey('EsySUN7oV4ayVueVak1QVWSibQSu3ePgqfKSEeCoxyTc'),
        provider
    );

    // Load token mint address
    const tokenMintAddress = fs.readFileSync('token-mint.json', 'utf-8').replace(/"/g, '');
    const tokenMint = new PublicKey(tokenMintAddress);

    console.log('Token Mint Address:', tokenMint.toBase58());

    // Get presale info PDA
    const [presaleInfo] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED")],
        program.programId
    );

    // Get user token account
    const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        keypair.publicKey
    );

    // Get presale token account PDA
    const [presaleTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_TOKEN_ACCOUNT"), tokenMint.toBuffer()],
        program.programId
    );

    console.log('User Token Account:', userTokenAccount.toBase58());
    console.log('Presale Token Account:', presaleTokenAccount.toBase58());

    // Create transaction
    const transaction = new Transaction();

    // Add instruction to create user's associated token account if it doesn't exist
    try {
        await getAccount(connection, userTokenAccount);
        console.log('User token account exists');
    } catch (error) {
        console.log('Creating user token account...');
        transaction.add(
            createAssociatedTokenAccountInstruction(
                keypair.publicKey,
                userTokenAccount,
                keypair.publicKey,
                tokenMint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );
    }

    // Add instruction to create presale token account if it doesn't exist
    try {
        await getAccount(connection, presaleTokenAccount);
        console.log('Presale token account exists');
    } catch (error) {
        console.log('Creating presale token account...');
        transaction.add(
            createInitializeAccountInstruction(
                presaleTokenAccount,
                tokenMint,
                presaleInfo,
                TOKEN_PROGRAM_ID
            )
        );
    }

    // Add deposit instruction
    const depositAmount = new BN(100_000_000); // 100 million tokens
    console.log('Depositing', depositAmount.toString(), 'tokens to presale');

    const depositInstruction = await program.methods
        .depositToken(depositAmount)
        .accounts({
            presaleInfo,
            authority: keypair.publicKey,
            tokenAccount: userTokenAccount,
            presaleTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        })
        .instruction();

    transaction.add(depositInstruction);

    // Send transaction
    const signature = await provider.sendAndConfirm(transaction, [keypair]);
    console.log('Transaction signature:', signature);
    console.log('Tokens deposited successfully!');
}

main().then(
    () => process.exit(0),
    (err) => {
        console.error(err);
        process.exit(1);
    }
); 