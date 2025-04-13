import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { 
    getAssociatedTokenAddress, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAccount
} from '@solana/spl-token';
import fs from 'fs';
import { IDL } from './target/types/palm_presale'; // Import just the IDL

async function main() {
    // Load the authority keypair from authority.json
    const keypairFile = fs.readFileSync('authority.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Create provider and program
    const provider = new AnchorProvider(connection, new Wallet(keypair), {});
    anchor.setProvider(provider);
    
    // Initialize the program with the program ID from your deployment
    const programId = new PublicKey("EsySUN7oV4ayVueVak1QVWSibQSu3ePgqfKSEeCoxyTc");
    const program = new Program(IDL, programId);

    // Load token mint address from token-mint.json
    const tokenMintAddress = new PublicKey(fs.readFileSync('token-mint.json', 'utf-8').replace(/"/g, ''));

    console.log('Token Mint Address from file:', tokenMintAddress.toBase58());

    // Get presale info PDA
    const [presaleInfo] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED")],
        program.programId
    );

    try {
        // Get the presale account data to verify it exists and is properly initialized
        const presaleData = await program.account.presaleInfo.fetch(presaleInfo);
        console.log('Presale info exists, authority:', presaleData.authority.toBase58());
        console.log('Presale token mint:', presaleData.tokenMintAddress.toBase58());
        
        // Check if the token mints match
        if (!presaleData.tokenMintAddress.equals(tokenMintAddress)) {
            console.error('\n❌ TOKEN MINT MISMATCH ERROR:');
            console.error(`Token mint in your file: ${tokenMintAddress.toBase58()}`);
            console.error(`Token mint in presale contract: ${presaleData.tokenMintAddress.toBase58()}`);
            console.error('\nTo fix this issue, you have two options:');
            console.error('1. Update your token-mint.json file with the correct token mint address from the presale contract');
            console.error('2. If you need to use a different token, you must create a new presale with the correct token mint');
            
            // Write the correct token mint to a new file for convenience
            const correctTokenMintFile = 'correct-token-mint.json';
            fs.writeFileSync(correctTokenMintFile, JSON.stringify(presaleData.tokenMintAddress.toBase58()));
            console.error(`\nFor your convenience, I've written the correct token mint to: ${correctTokenMintFile}`);
            console.error('You can use this file by running: cp correct-token-mint.json token-mint.json');
            
            return; // Exit the function
        }
        
        // Verify the caller is the authority
        if (!presaleData.authority.equals(keypair.publicKey)) {
            console.error('❌ Only the presale authority can deposit tokens!');
            console.error(`Presale authority: ${presaleData.authority.toBase58()}`);
            console.error(`Your public key: ${keypair.publicKey.toBase58()}`);
            return;
        }

        // Get user token account
        const userTokenAccount = await getAssociatedTokenAddress(
            tokenMintAddress,
            keypair.publicKey
        );

        // Get presale token account
        const presaleTokenAccount = await getAssociatedTokenAddress(
            tokenMintAddress,
            presaleInfo,
            true // allowOwnerOffCurve = true since presaleInfo is a PDA
        );

        console.log('User Token Account:', userTokenAccount.toBase58());
        console.log('Presale Token Account:', presaleTokenAccount.toBase58());

        // Check if presale token account exists
        let presaleTokenAccountInfo;
        try {
            presaleTokenAccountInfo = await getAccount(connection, presaleTokenAccount);
            console.log('Presale token account exists:', presaleTokenAccount.toBase58());
        } catch (error) {
            console.log('Presale token account does not exist, creating it...');
            // Create presale token account if it doesn't exist
            const createPresaleTokenAccountIx = createAssociatedTokenAccountInstruction(
                keypair.publicKey, // payer
                presaleTokenAccount, // ata
                presaleInfo, // owner
                tokenMintAddress // mint
            );

            const tx = new Transaction().add(createPresaleTokenAccountIx);
            const signature = await connection.sendTransaction(tx, [keypair]);
            await connection.confirmTransaction(signature);
            console.log('Created presale token account:', presaleTokenAccount.toBase58());
        }

        // Deposit tokens to presale
        const depositAmount = new BN('1000000000'); // Adjust as needed
        console.log('Depositing tokens to presale...');
        
        const tx = await program.methods
            .depositToken(depositAmount)
            .accounts({
                presaleInfo: presaleInfo,
                authority: keypair.publicKey,
                tokenAccount: userTokenAccount,
                presaleTokenAccount: presaleTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log('Transaction signature:', tx);
        console.log('Tokens deposited successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();