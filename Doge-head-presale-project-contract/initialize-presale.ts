import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet, Idl } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { 
    getAssociatedTokenAddress, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAccount,
    Account as TokenAccount
} from '@solana/spl-token';
import fs from 'fs';
import { IDL, PalmPresale } from './target/types/palm_presale';

// Define interfaces for better type safety
interface PresaleAccount {
  tokenMintAddress: PublicKey;
  softcapAmount: BN;
  hardcapAmount: BN;
  depositTokenAmount: BN;
  soldTokenAmount: BN;
  startTime: BN;
  endTime: BN;
  maxTokenAmountPerAddress: BN;
  pricePerToken: BN;
  isLive: boolean;
  authority: PublicKey;
  isSoftCapped: boolean;
  isHardCapped: boolean;
  currentStage: number;
  totalStages: number;
}

async function main(): Promise<void> {
    // Load the authority keypair from authority.json
    let keypair: Keypair;
    try {
        const keypairFile: string = fs.readFileSync('authority.json', 'utf-8');
        keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));
    } catch (error: any) {
        console.error('❌ Error loading authority keypair:', error.message);
        return;
    }

    // Connect to devnet
    const connection: Connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Create provider and program
    const provider: AnchorProvider = new AnchorProvider(connection, new Wallet(keypair), {
        commitment: 'confirmed'
    });
    anchor.setProvider(provider);
    
    // Initialize the program with the program ID from your deployment
    const programId: PublicKey = new PublicKey("EsySUN7oV4ayVueVak1QVWSibQSu3ePgqfKSEeCoxyTc");
    const program: Program<PalmPresale> = new Program(IDL, programId, provider);

    // Load token mint address from token-mint.json
    let tokenMintAddress: PublicKey;
    try {
        const tokenMintStr: string = fs.readFileSync('token-mint.json', 'utf-8').replace(/"/g, '');
        tokenMintAddress = new PublicKey(tokenMintStr);
        console.log('Token Mint Address from file:', tokenMintAddress.toBase58());
    } catch (error: any) {
        console.error('❌ Error loading token mint address:', error.message);
        return;
    }

    // Get presale info PDA
    const [presaleInfo]: [PublicKey, number] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED")],
        program.programId
    );

    try {
        // Get the presale account data to verify it exists and is properly initialized
        const presaleData: PresaleAccount = await program.account.presaleInfo.fetch(presaleInfo) as PresaleAccount;
        console.log('Presale info exists, authority:', presaleData.authority.toBase58());
        console.log('Presale token mint:', presaleData.tokenMintAddress.toBase58());
        
        // Check if the token mints match.
        if (!presaleData.tokenMintAddress.equals(tokenMintAddress)) {
            console.error('\n❌ TOKEN MINT MISMATCH ERROR:');
            console.error(`Token mint in your file: ${tokenMintAddress.toBase58()}`);
            console.error(`Token mint in presale contract: ${presaleData.tokenMintAddress.toBase58()}`);
            console.error('\nTo fix this issue, you have two options:');
            console.error('1. Update your token-mint.json file with the correct token mint address from the presale contract');
            console.error('2. If you need to use a different token, you must create a new presale with the correct token mint');
            
            // Write the correct token mint to a new file for convenience
            const correctTokenMintFile: string = 'correct-token-mint.json';
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
        const userTokenAccount: PublicKey = await getAssociatedTokenAddress(
            tokenMintAddress,
            keypair.publicKey
        );

        // Get presale token account
        const presaleTokenAccount: PublicKey = await getAssociatedTokenAddress(
            tokenMintAddress,
            presaleInfo,
            true // allowOwnerOffCurve = true since presaleInfo is a PDA
        );

        console.log('User Token Account:', userTokenAccount.toBase58());
        console.log('Presale Token Account:', presaleTokenAccount.toBase58());

        // Check if presale token account exists
        let presaleTokenAccountInfo: TokenAccount;
        try {
            presaleTokenAccountInfo = await getAccount(connection, presaleTokenAccount);
            console.log('Presale token account exists:', presaleTokenAccount.toBase58());
        } catch (error: any) {
            console.log('Presale token account does not exist, creating it...');
            // Create presale token account if it doesn't exist
            const createPresaleTokenAccountIx = createAssociatedTokenAccountInstruction(
                keypair.publicKey, // payer
                presaleTokenAccount, // ata
                presaleInfo, // owner
                tokenMintAddress // mint
            );

            const tx: Transaction = new Transaction().add(createPresaleTokenAccountIx);
            const signature: TransactionSignature = await connection.sendTransaction(tx, [keypair]);
            await connection.confirmTransaction(signature);
            console.log('Created presale token account:', presaleTokenAccount.toBase58());
        }

        // Deposit tokens to presale
        const depositAmount: BN = new BN('1000000000'); // Adjust as needed
        console.log('Depositing tokens to presale...');
        
        const tx: TransactionSignature = await program.methods
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
    } catch (error: any) {
        console.error('Error:', error);
        
        // Add more detailed error handling
        if (error.logs) {
            console.error('\nProgram logs:');
            error.logs.forEach((log: string, i: number) => console.error(`  ${i}: ${log}`));
        }
        
        // Check for common errors
        if (error.message && error.message.includes('insufficient funds')) {
            console.error('\nYour token account does not have enough tokens to complete this deposit.');
            console.error('Make sure you have enough tokens in your wallet.');
        } else if (error.message && error.message.includes('ConstraintRaw')) {
            console.error('\nA constraint was violated in the program. This could be because:');
            console.error('1. The token account does not belong to you');
            console.error('2. The presale is not in the correct state for deposits');
            console.error('3. The token mint does not match what the program expects');
        }
    }
}

main();