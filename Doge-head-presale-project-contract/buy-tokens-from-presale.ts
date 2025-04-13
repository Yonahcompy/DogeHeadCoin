import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { 
    getAssociatedTokenAddress, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAccount
} from '@solana/spl-token';
import fs from 'fs';
import { IDL, PalmPresale } from './target/types/palm_presale';

async function main(): Promise<void> {
    // Load the buyer keypair from a file or use the default wallet
    let buyerKeypair: Keypair;
    try {
        const keypairFile: string = fs.readFileSync('buyer.json', 'utf-8');
        buyerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));
        console.log('Loaded buyer keypair from file');
    } catch (error: any) {
        console.log('No buyer.json file found. Using default wallet...');
        // In a real application, you would use the user's connected wallet
        // For this example, we'll create a new keypair
        buyerKeypair = Keypair.generate();
        console.log('Generated new buyer keypair:', buyerKeypair.publicKey.toBase58());
    }

    // Connect to devnet
    const connection: Connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Create provider and program
    const provider: AnchorProvider = new AnchorProvider(connection, new Wallet(buyerKeypair), {
        commitment: 'confirmed'
    });
    anchor.setProvider(provider);
    
    // Initialize the program with the program ID from your deployment
    const programId: PublicKey = new PublicKey("EsySUN7oV4ayVueVak1QVWSibQSu3ePgqfKSEeCoxyTc");
    const program: Program<PalmPresale> = new Program<PalmPresale>(IDL, programId, provider);

    // Get presale info PDA
    const [presaleInfo]: [PublicKey, number] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED")],
        program.programId
    );

    // Get presale vault PDA
    const [presaleVault]: [PublicKey, number] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_VAULT")],
        program.programId
    );

    // Get user info PDA
    const [userInfo]: [PublicKey, number] = PublicKey.findProgramAddressSync(
        [Buffer.from("USER_SEED")],
        program.programId
    );

    try {
        // Get the presale account data to verify it exists and is properly initialized
        const presaleData = await program.account.presaleInfo.fetch(presaleInfo);
        console.log('Presale info found:');
        console.log('- Token mint:', presaleData.tokenMintAddress.toBase58());
        console.log('- Current stage:', presaleData.currentStage);
        console.log('- Total stages:', presaleData.totalStages);
        console.log('- Is live:', presaleData.isLive);
        console.log('- Price per token:', presaleData.pricePerToken.toString());
        console.log('- Max tokens per address:', presaleData.maxTokenAmountPerAddress.toString());
        
        // Check if presale is live
        if (!presaleData.isLive) {
            console.error('❌ Presale is not live yet!');
            return;
        }

        // Get the current stage
        const [presaleStage]: [PublicKey, number] = PublicKey.findProgramAddressSync(
            [Buffer.from("STAGE_SEED"), Buffer.from([presaleData.currentStage])],
            program.programId
        );

        // Get stage data
        const stageData = await program.account.presaleStage.fetch(presaleStage);
        console.log('Current stage info:');
        console.log('- Available tokens:', stageData.availableTokens.toString());
        console.log('- Tokens sold:', stageData.tokensSold.toString());
        console.log('- Price per token:', stageData.pricePerToken.toString());
        console.log('- Is active:', stageData.isActive);

        // Check if stage is active
        if (!stageData.isActive) {
            console.error('❌ Current stage is not active!');
            return;
        }

        // Calculate how many tokens the user can buy
        const maxTokensPerAddress = presaleData.maxTokenAmountPerAddress.toNumber();
        const availableTokensInStage = stageData.availableTokens.sub(stageData.tokensSold).toNumber();
        const maxTokensUserCanBuy = Math.min(maxTokensPerAddress, availableTokensInStage);
        
        console.log('Token purchase limits:');
        console.log('- Max tokens per address:', maxTokensPerAddress);
        console.log('- Available tokens in stage:', availableTokensInStage);
        console.log('- Max tokens you can buy:', maxTokensUserCanBuy);

        // For this example, we'll buy 10 tokens (or the maximum if less than 10)
        const tokenAmount = Math.min(10, maxTokensUserCanBuy);
        if (tokenAmount <= 0) {
            console.error('❌ No tokens available to buy!');
            return;
        }

        // Calculate the quote amount (SOL) needed
        const quoteAmount = new BN(tokenAmount).mul(stageData.pricePerToken);
        console.log(`To buy ${tokenAmount} tokens, you need to pay ${quoteAmount.toString()} lamports (${quoteAmount.toNumber() / 1e9} SOL)`);

        // Check if the buyer has enough SOL
        const balance = await connection.getBalance(buyerKeypair.publicKey);
        console.log('Your SOL balance:', balance / 1e9, 'SOL');
        
        if (balance < quoteAmount.toNumber()) {
            console.error(`❌ Insufficient SOL balance! You need ${quoteAmount.toNumber() / 1e9} SOL but have ${balance / 1e9} SOL`);
            return;
        }

        // Optional: Check if there's a referrer code to use
        let referrerCode: number[] | null = null;
        let referrerInfo: PublicKey | null = null;
        
        try {
            const referrerCodeFile = fs.readFileSync('referrer-code.json', 'utf-8');
            const code = JSON.parse(referrerCodeFile);
            referrerCode = Array.from(new Uint8Array(code));
            console.log('Using referrer code:', Buffer.from(referrerCode).toString('hex'));
            
            // Get referrer info if available
            try {
                const referrerInfoFile = fs.readFileSync('referrer-info.json', 'utf-8');
                referrerInfo = new PublicKey(referrerInfoFile.replace(/"/g, ''));
                console.log('Using referrer info account:', referrerInfo.toBase58());
            } catch (error) {
                console.log('No referrer info account found, proceeding without referral');
                referrerCode = null;
            }
        } catch (error) {
            console.log('No referrer code found, proceeding without referral');
        }

        // Get the presale authority
        const presaleAuthority = presaleData.authority;
        console.log('Presale authority:', presaleAuthority.toBase58());

        // Prepare the accounts for the buy_token instruction
        const accounts: any = {
            presaleInfo: presaleInfo,
            presaleAuthority: presaleAuthority,
            presaleStage: presaleStage,
            userInfo: userInfo,
            presaleVault: presaleVault,
            buyer: buyerKeypair.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        };

        // If there's a referrer info, add it to the accounts
        if (referrerInfo) {
            accounts.referrerInfo = referrerInfo;
        }

        // Execute the buy_token instruction
        console.log('Buying tokens...');
        
        // Create the instruction with the correct parameter types
        const tx = await program.methods
            .buyToken(
                quoteAmount, 
                new BN(tokenAmount), 
                referrerCode
            )
            .accounts(accounts)
            .rpc();

        console.log('Transaction signature:', tx);
        console.log(`Successfully bought ${tokenAmount} tokens!`);
        console.log('View transaction: https://explorer.solana.com/tx/' + tx + '?cluster=devnet');

        // Get updated user info
        const updatedUserInfo = await program.account.userInfo.fetch(userInfo);
        console.log('Updated user info:');
        console.log('- Tokens bought:', updatedUserInfo.buyTokenAmount.toString());
        console.log('- SOL spent:', updatedUserInfo.buyQuoteAmount.toString());

    } catch (error: any) {
        console.error('Error:', error);
        
        // Add more detailed error handling
        if (error.logs) {
            console.error('\nProgram logs:');
            error.logs.forEach((log: string, i: number) => console.error(`  ${i}: ${log}`));
        }
        
        // Check for common errors
        if (error.message && error.message.includes('insufficient funds')) {
            console.error('\nYour wallet does not have enough SOL to complete this purchase.');
            console.error('Make sure you have enough SOL in your wallet.');
        } else if (error.message && error.message.includes('ConstraintRaw')) {
            console.error('\nA constraint was violated in the program. This could be because:');
            console.error('1. The presale is not in the correct state for purchases');
            console.error('2. You have reached the maximum token amount per address');
            console.error('3. The stage is not active or has ended');
        }
    }
}

main();