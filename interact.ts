import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@project-serum/anchor';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    getAccount,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import { DogePresale, IDL } from './target/types/doge_presale';

// Define types for our program's accounts
interface PresaleAccounts {
    presaleState: PublicKey;
    tokenAccount: PublicKey;
}

// Program ID of the deployed contract
const PROGRAM_ID = new PublicKey('KbExbCupd7grExTAN7YG842kbutL3ERPvQWtrEg5DJ5');

// Connect to Devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Load the authority keypair
const authorityKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(path.join(__dirname, 'authority.json'), 'utf-8')))
);

// Create a wallet from the authority keypair
const wallet = new Wallet(authorityKeypair);

// Create an AnchorProvider
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

// Create the program
const program = new Program<DogePresale>(IDL, PROGRAM_ID, provider);

// Function to request airdrop of SOL
async function requestAirdrop(publicKey: PublicKey, amount: number): Promise<void> {
    const signature = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature, 'confirmed');
    console.log(`Airdropped ${amount} SOL to ${publicKey.toString()}`);
}

// Function to create a new token mint
async function createTokenMint(): Promise<PublicKey> {
    console.log('Creating token mint...');
    const mint = await createMint(
        connection,
        authorityKeypair,
        authorityKeypair.publicKey,
        authorityKeypair.publicKey,
        9 // 9 decimals
    );
    console.log(`Token mint created: ${mint.toString()}`);
    return mint;
}

// Function to derive the token account PDA
function deriveTokenAccount(presaleState: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), presaleState.toBuffer()],
        program.programId
    );
}

// Function to initialize the presale
async function initializePresale(tokenMint: PublicKey): Promise<PresaleAccounts> {
    console.log('Initializing presale...');
    
    // Get current time and set start time to 1 minute from now and end time to 7 days from now
    const now = Math.floor(Date.now() / 1000);
    const startTime = new BN(now + 60); // 1 minute from now
    const endTime = new BN(now + 7 * 24 * 60 * 60); // 7 days from now
    
    // Create a new keypair for the presale state account
    const presaleStateKeypair = Keypair.generate();
    
    // Find the token account PDA
    const [tokenAccount, _bump] = deriveTokenAccount(presaleStateKeypair.publicKey);
    
    try {
        console.log('Initializing with accounts:', {
            authority: authorityKeypair.publicKey.toString(),
            presaleState: presaleStateKeypair.publicKey.toString(),
            tokenMint: tokenMint.toString(),
            tokenAccount: tokenAccount.toString()
        });

        // Initialize the presale
        const tx = await program.methods
            .initialize(startTime, endTime)
            .accounts({
                authority: authorityKeypair.publicKey,
                presaleState: presaleStateKeypair.publicKey,
                tokenMint: tokenMint,
                tokenAccount: tokenAccount,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
            })
            .signers([presaleStateKeypair])
            .rpc();
        
        console.log(`Presale initialized! Transaction signature: ${tx}`);
        
        // Verify the accounts were created
        const presaleStateAccount = await program.account.presaleState.fetch(presaleStateKeypair.publicKey);
        console.log('Presale state account created:', presaleStateAccount);
        
        return { presaleState: presaleStateKeypair.publicKey, tokenAccount };
    } catch (error: any) {
        console.error('Error initializing presale:', error);
        if (error.logs) {
            console.error('Program logs:', error.logs);
        }
        throw error;
    }
}

// Main function to test initialization
async function main(): Promise<void> {
    try {
        // Step 1: Request airdrop for the authority if needed
        const balance = await connection.getBalance(authorityKeypair.publicKey);
        if (balance < 2 * LAMPORTS_PER_SOL) {
            await requestAirdrop(authorityKeypair.publicKey, 5);
        }
        console.log(`Authority balance: ${await connection.getBalance(authorityKeypair.publicKey) / LAMPORTS_PER_SOL} SOL`);

        // Step 2: Create token mint
        const tokenMint = await createTokenMint();

        // Step 3: Initialize presale
        const { presaleState, tokenAccount } = await initializePresale(tokenMint);

        console.log('\nInitialization test completed successfully!');
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

// Run the main function
main().then(() => {
    console.log('Script execution completed');
}).catch((error) => {
    console.error('Script execution failed:', error);
});