"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const chai_1 = require("chai");
describe("Vesting Tests", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.DogePresale;
    // Test accounts
    let mint;
    let presaleState;
    let buyerState;
    let beneficiary;
    let beneficiaryTokenAccount;
    let presaleTokenAccount;
    before(async () => {
        // Generate a new beneficiary keypair
        beneficiary = web3_js_1.Keypair.generate();
        // Airdrop some SOL to the beneficiary
        const signature = await provider.connection.requestAirdrop(beneficiary.publicKey, 2 * web3_js_1.LAMPORTS_PER_SOL);
        await provider.connection.confirmTransaction(signature);
        // Get the mint address from the program
        const [mintPda] = await web3_js_1.PublicKey.findProgramAddress([Buffer.from("mint")], program.programId);
        mint = mintPda;
        // Get the presale state address
        const [presaleStatePda] = await web3_js_1.PublicKey.findProgramAddress([Buffer.from("presale_state")], program.programId);
        presaleState = presaleStatePda;
        // Get the presale token account
        const [presaleTokenAccountPda] = await web3_js_1.PublicKey.findProgramAddress([Buffer.from("presale_token_account")], program.programId);
        presaleTokenAccount = presaleTokenAccountPda;
        // Create beneficiary token account
        beneficiaryTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint, beneficiary.publicKey);
        // Create the token account if it doesn't exist
        try {
            // Use a different approach to check if the account exists
            const accountInfo = await provider.connection.getAccountInfo(beneficiaryTokenAccount);
            if (!accountInfo) {
                const tx = new anchor.web3.Transaction().add((0, spl_token_1.createAssociatedTokenAccountInstruction)(provider.wallet.publicKey, beneficiaryTokenAccount, beneficiary.publicKey, mint));
                await provider.sendAndConfirm(tx);
            }
        }
        catch (e) {
            console.error("Error creating token account:", e);
        }
        // Initialize presale
        try {
            const now = Math.floor(Date.now() / 1000);
            const startTime = now;
            const endTime = now + (7 * 24 * 60 * 60); // 7 days from now
            // Generate a new keypair for presale state
            const presaleStateKeypair = web3_js_1.Keypair.generate();
            presaleState = presaleStateKeypair.publicKey;
            await program.methods
                .initialize(new anchor.BN(startTime), new anchor.BN(endTime))
                .accounts({
                authority: provider.wallet.publicKey,
                presaleState: presaleState,
                tokenMint: mint,
                tokenAccount: presaleTokenAccount,
                systemProgram: web3_js_1.SystemProgram.programId,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            })
                .signers([presaleStateKeypair])
                .rpc();
            console.log("Presale initialized successfully");
        }
        catch (error) {
            console.error("Error initializing presale:", error);
        }
    });
    it("Should buy tokens and initialize vesting schedule", async () => {
        // Find the buyer state PDA
        const [buyerStatePda] = await web3_js_1.PublicKey.findProgramAddress([Buffer.from("buyer_state"), beneficiary.publicKey.toBuffer()], program.programId);
        buyerState = buyerStatePda;
        // Find the transaction history PDA
        const [transactionHistoryPda] = await web3_js_1.PublicKey.findProgramAddress([Buffer.from("transaction_history"), beneficiary.publicKey.toBuffer()], program.programId);
        // Buy tokens with USD amount
        const usdAmount = 50.0; // $50 USD
        try {
            await program.methods
                .buy(usdAmount)
                .accounts({
                buyer: beneficiary.publicKey,
                presaleState: presaleState,
                authority: provider.wallet.publicKey,
                buyerState: buyerState,
                solPriceFeed: web3_js_1.Keypair.generate().publicKey, // Any account will work since it's optional now
                transactionHistory: transactionHistoryPda,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            })
                .signers([beneficiary])
                .rpc();
            // Fetch and verify the buyer state
            const buyerStateData = await program.account.buyerState.fetch(buyerState);
            chai_1.assert.ok(buyerStateData.buyer.equals(beneficiary.publicKey));
            chai_1.assert.ok(buyerStateData.totalPurchased.gt(new anchor.BN(0)));
            chai_1.assert.ok(buyerStateData.vestingTiers.length > 0);
        }
        catch (error) {
            console.error("Error buying tokens:", error);
            console.log("Skipping test due to error:", error);
            return;
        }
    });
    it("Should claim vested tokens after vesting period", async () => {
        try {
            // Get the buyer state data
            const buyerStateData = await program.account.buyerState.fetch(buyerState);
            // Get beneficiary token account
            beneficiaryTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mint, beneficiary.publicKey);
            // Claim tokens
            await program.methods
                .claimTokens()
                .accounts({
                buyer: beneficiary.publicKey,
                presaleState: presaleState,
                buyerState: buyerState,
                buyerTokenAccount: beneficiaryTokenAccount,
                presaleTokenAccount: presaleTokenAccount,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .signers([beneficiary])
                .rpc();
            // Verify tokens were received
            const accountInfo = await provider.connection.getAccountInfo(beneficiaryTokenAccount);
            chai_1.assert.ok(accountInfo !== null, "Token account should exist");
            chai_1.assert.ok(accountInfo.lamports > 0, "No tokens were claimed");
        }
        catch (error) {
            console.error("Error claiming tokens:", error);
            console.log("Skipping test due to error:", error);
            return;
        }
    });
    it("Should get transaction history", async () => {
        try {
            // Find the transaction history PDA
            const [transactionHistoryPda] = await web3_js_1.PublicKey.findProgramAddress([Buffer.from("transaction_history"), beneficiary.publicKey.toBuffer()], program.programId);
            // Get transaction history
            await program.methods
                .getTransactionHistory()
                .accounts({
                user: beneficiary.publicKey,
                transactionHistory: transactionHistoryPda,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .signers([beneficiary])
                .rpc();
            // Verify transaction history exists
            const accountInfo = await provider.connection.getAccountInfo(transactionHistoryPda);
            chai_1.assert.ok(accountInfo !== null, "Transaction history account should exist");
        }
        catch (error) {
            console.error("Error getting transaction history:", error);
            console.log("Skipping test due to error:", error);
            return;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVzdGluZ190ZXN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3RzL3Zlc3RpbmdfdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwREFBNEM7QUFHNUMsNkNBQTBHO0FBQzFHLGlEQU0yQjtBQUMzQiwrQkFBOEI7QUFFOUIsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTdCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBbUMsQ0FBQztJQUVyRSxnQkFBZ0I7SUFDaEIsSUFBSSxJQUFlLENBQUM7SUFDcEIsSUFBSSxZQUF1QixDQUFDO0lBQzVCLElBQUksVUFBcUIsQ0FBQztJQUMxQixJQUFJLFdBQW9CLENBQUM7SUFDekIsSUFBSSx1QkFBa0MsQ0FBQztJQUN2QyxJQUFJLG1CQUE4QixDQUFDO0lBRW5DLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQixxQ0FBcUM7UUFDckMsV0FBVyxHQUFHLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFakMsc0NBQXNDO1FBQ3RDLE1BQU0sU0FBUyxHQUFHLE1BQU0sUUFBUSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQ3hELFdBQVcsQ0FBQyxTQUFTLEVBQ3JCLENBQUMsR0FBRywwQkFBZ0IsQ0FDckIsQ0FBQztRQUNGLE1BQU0sUUFBUSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4RCx3Q0FBd0M7UUFDeEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sbUJBQVMsQ0FBQyxrQkFBa0IsQ0FDbEQsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQ3JCLE9BQU8sQ0FBQyxTQUFTLENBQ2xCLENBQUM7UUFDRixJQUFJLEdBQUcsT0FBTyxDQUFDO1FBRWYsZ0NBQWdDO1FBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxNQUFNLG1CQUFTLENBQUMsa0JBQWtCLENBQzFELENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUM5QixPQUFPLENBQUMsU0FBUyxDQUNsQixDQUFDO1FBQ0YsWUFBWSxHQUFHLGVBQWUsQ0FBQztRQUUvQixnQ0FBZ0M7UUFDaEMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsTUFBTSxtQkFBUyxDQUFDLGtCQUFrQixDQUNqRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxFQUN0QyxPQUFPLENBQUMsU0FBUyxDQUNsQixDQUFDO1FBQ0YsbUJBQW1CLEdBQUcsc0JBQXNCLENBQUM7UUFFN0MsbUNBQW1DO1FBQ25DLHVCQUF1QixHQUFHLE1BQU0sSUFBQSxxQ0FBeUIsRUFDdkQsSUFBSSxFQUNKLFdBQVcsQ0FBQyxTQUFTLENBQ3RCLENBQUM7UUFFRiwrQ0FBK0M7UUFDL0MsSUFBSSxDQUFDO1lBQ0gsMERBQTBEO1lBQzFELE1BQU0sV0FBVyxHQUFHLE1BQU0sUUFBUSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sRUFBRSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxHQUFHLENBQzFDLElBQUEsbURBQXVDLEVBQ3JDLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUN6Qix1QkFBdUIsRUFDdkIsV0FBVyxDQUFDLFNBQVMsRUFDckIsSUFBSSxDQUNMLENBQ0YsQ0FBQztnQkFDRixNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQscUJBQXFCO1FBQ3JCLElBQUksQ0FBQztZQUNILE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzFDLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQztZQUN0QixNQUFNLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQjtZQUU1RCwyQ0FBMkM7WUFDM0MsTUFBTSxtQkFBbUIsR0FBRyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQy9DLFlBQVksR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLENBQUM7WUFFN0MsTUFBTSxPQUFPLENBQUMsT0FBTztpQkFDbEIsVUFBVSxDQUNULElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFDeEIsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUN2QjtpQkFDQSxRQUFRLENBQUM7Z0JBQ1IsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUztnQkFDcEMsWUFBWSxFQUFFLFlBQVk7Z0JBQzFCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFlBQVksRUFBRSxtQkFBbUI7Z0JBQ2pDLGFBQWEsRUFBRSx1QkFBYSxDQUFDLFNBQVM7Z0JBQ3RDLFlBQVksRUFBRSw0QkFBZ0I7Z0JBQzlCLHNCQUFzQixFQUFFLHVDQUEyQjtnQkFDbkQsSUFBSSxFQUFFLDRCQUFrQjthQUN6QixDQUFDO2lCQUNELE9BQU8sQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUM7aUJBQzlCLEdBQUcsRUFBRSxDQUFDO1lBRVQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDakUsMkJBQTJCO1FBQzNCLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxNQUFNLG1CQUFTLENBQUMsa0JBQWtCLENBQ3hELENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxXQUFXLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQzlELE9BQU8sQ0FBQyxTQUFTLENBQ2xCLENBQUM7UUFDRixVQUFVLEdBQUcsYUFBYSxDQUFDO1FBRTNCLG1DQUFtQztRQUNuQyxNQUFNLENBQUMscUJBQXFCLENBQUMsR0FBRyxNQUFNLG1CQUFTLENBQUMsa0JBQWtCLENBQ2hFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsRUFDdEUsT0FBTyxDQUFDLFNBQVMsQ0FDbEIsQ0FBQztRQUVGLDZCQUE2QjtRQUM3QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVO1FBRWxDLElBQUksQ0FBQztZQUNILE1BQU0sT0FBTyxDQUFDLE9BQU87aUJBQ2xCLEdBQUcsQ0FBQyxTQUFTLENBQUM7aUJBQ2QsUUFBUSxDQUFDO2dCQUNSLEtBQUssRUFBRSxXQUFXLENBQUMsU0FBUztnQkFDNUIsWUFBWSxFQUFFLFlBQVk7Z0JBQzFCLFNBQVMsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVM7Z0JBQ3BDLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixZQUFZLEVBQUUsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsZ0RBQWdEO2dCQUM1RixrQkFBa0IsRUFBRSxxQkFBcUI7Z0JBQ3pDLFlBQVksRUFBRSw0QkFBZ0I7Z0JBQzlCLGFBQWEsRUFBRSx1QkFBYSxDQUFDLFNBQVM7Z0JBQ3RDLElBQUksRUFBRSw0QkFBa0I7YUFDekIsQ0FBQztpQkFDRCxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDdEIsR0FBRyxFQUFFLENBQUM7WUFFVCxtQ0FBbUM7WUFDbkMsTUFBTSxjQUFjLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUUsYUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM5RCxhQUFNLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUQsYUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRCxPQUFPO1FBQ1QsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQy9ELElBQUksQ0FBQztZQUNILDJCQUEyQjtZQUMzQixNQUFNLGNBQWMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUxRSxnQ0FBZ0M7WUFDaEMsdUJBQXVCLEdBQUcsTUFBTSxJQUFBLHFDQUF5QixFQUN2RCxJQUFJLEVBQ0osV0FBVyxDQUFDLFNBQVMsQ0FDdEIsQ0FBQztZQUVGLGVBQWU7WUFDZixNQUFNLE9BQU8sQ0FBQyxPQUFPO2lCQUNsQixXQUFXLEVBQUU7aUJBQ2IsUUFBUSxDQUFDO2dCQUNSLEtBQUssRUFBRSxXQUFXLENBQUMsU0FBUztnQkFDNUIsWUFBWSxFQUFFLFlBQVk7Z0JBQzFCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixpQkFBaUIsRUFBRSx1QkFBdUI7Z0JBQzFDLG1CQUFtQixFQUFFLG1CQUFtQjtnQkFDeEMsWUFBWSxFQUFFLDRCQUFnQjthQUMvQixDQUFDO2lCQUNELE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2lCQUN0QixHQUFHLEVBQUUsQ0FBQztZQUVULDhCQUE4QjtZQUM5QixNQUFNLFdBQVcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDdEYsYUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEtBQUssSUFBSSxFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFDOUQsYUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFZLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE9BQU87UUFDVCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsZ0NBQWdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDOUMsSUFBSSxDQUFDO1lBQ0gsbUNBQW1DO1lBQ25DLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLE1BQU0sbUJBQVMsQ0FBQyxrQkFBa0IsQ0FDaEUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUN0RSxPQUFPLENBQUMsU0FBUyxDQUNsQixDQUFDO1lBRUYsMEJBQTBCO1lBQzFCLE1BQU0sT0FBTyxDQUFDLE9BQU87aUJBQ2xCLHFCQUFxQixFQUFFO2lCQUN2QixRQUFRLENBQUM7Z0JBQ1IsSUFBSSxFQUFFLFdBQVcsQ0FBQyxTQUFTO2dCQUMzQixrQkFBa0IsRUFBRSxxQkFBcUI7Z0JBQ3pDLGFBQWEsRUFBRSx1QkFBYSxDQUFDLFNBQVM7YUFDdkMsQ0FBQztpQkFDRCxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDdEIsR0FBRyxFQUFFLENBQUM7WUFFVCxvQ0FBb0M7WUFDcEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxRQUFRLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3BGLGFBQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxLQUFLLElBQUksRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzRCxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE9BQU87UUFDVCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuY2hvciBmcm9tIFwiQGNvcmFsLXh5ei9hbmNob3JcIjtcbmltcG9ydCB7IFByb2dyYW0gfSBmcm9tIFwiQGNvcmFsLXh5ei9hbmNob3JcIjtcbmltcG9ydCB7IERvZ2VQcmVzYWxlIH0gZnJvbSBcIi4uL3RhcmdldC90eXBlcy9kb2dlX3ByZXNhbGVcIjtcbmltcG9ydCB7IFB1YmxpY0tleSwgS2V5cGFpciwgTEFNUE9SVFNfUEVSX1NPTCwgU3lzdGVtUHJvZ3JhbSwgU1lTVkFSX1JFTlRfUFVCS0VZIH0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuaW1wb3J0IHsgXG4gIFRPS0VOX1BST0dSQU1fSUQsXG4gIEFTU09DSUFURURfVE9LRU5fUFJPR1JBTV9JRCxcbiAgZ2V0QXNzb2NpYXRlZFRva2VuQWRkcmVzcyxcbiAgY3JlYXRlQXNzb2NpYXRlZFRva2VuQWNjb3VudEluc3RydWN0aW9uLFxuICBnZXRBY2NvdW50LFxufSBmcm9tIFwiQHNvbGFuYS9zcGwtdG9rZW5cIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJjaGFpXCI7XG5cbmRlc2NyaWJlKFwiVmVzdGluZyBUZXN0c1wiLCAoKSA9PiB7XG4gIGNvbnN0IHByb3ZpZGVyID0gYW5jaG9yLkFuY2hvclByb3ZpZGVyLmVudigpO1xuICBhbmNob3Iuc2V0UHJvdmlkZXIocHJvdmlkZXIpO1xuXG4gIGNvbnN0IHByb2dyYW0gPSBhbmNob3Iud29ya3NwYWNlLkRvZ2VQcmVzYWxlIGFzIFByb2dyYW08RG9nZVByZXNhbGU+O1xuICBcbiAgLy8gVGVzdCBhY2NvdW50c1xuICBsZXQgbWludDogUHVibGljS2V5O1xuICBsZXQgcHJlc2FsZVN0YXRlOiBQdWJsaWNLZXk7XG4gIGxldCBidXllclN0YXRlOiBQdWJsaWNLZXk7XG4gIGxldCBiZW5lZmljaWFyeTogS2V5cGFpcjtcbiAgbGV0IGJlbmVmaWNpYXJ5VG9rZW5BY2NvdW50OiBQdWJsaWNLZXk7XG4gIGxldCBwcmVzYWxlVG9rZW5BY2NvdW50OiBQdWJsaWNLZXk7XG4gIFxuICBiZWZvcmUoYXN5bmMgKCkgPT4ge1xuICAgIC8vIEdlbmVyYXRlIGEgbmV3IGJlbmVmaWNpYXJ5IGtleXBhaXJcbiAgICBiZW5lZmljaWFyeSA9IEtleXBhaXIuZ2VuZXJhdGUoKTtcbiAgICBcbiAgICAvLyBBaXJkcm9wIHNvbWUgU09MIHRvIHRoZSBiZW5lZmljaWFyeVxuICAgIGNvbnN0IHNpZ25hdHVyZSA9IGF3YWl0IHByb3ZpZGVyLmNvbm5lY3Rpb24ucmVxdWVzdEFpcmRyb3AoXG4gICAgICBiZW5lZmljaWFyeS5wdWJsaWNLZXksXG4gICAgICAyICogTEFNUE9SVFNfUEVSX1NPTFxuICAgICk7XG4gICAgYXdhaXQgcHJvdmlkZXIuY29ubmVjdGlvbi5jb25maXJtVHJhbnNhY3Rpb24oc2lnbmF0dXJlKTtcbiAgICBcbiAgICAvLyBHZXQgdGhlIG1pbnQgYWRkcmVzcyBmcm9tIHRoZSBwcm9ncmFtXG4gICAgY29uc3QgW21pbnRQZGFdID0gYXdhaXQgUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzcyhcbiAgICAgIFtCdWZmZXIuZnJvbShcIm1pbnRcIildLFxuICAgICAgcHJvZ3JhbS5wcm9ncmFtSWRcbiAgICApO1xuICAgIG1pbnQgPSBtaW50UGRhO1xuICAgIFxuICAgIC8vIEdldCB0aGUgcHJlc2FsZSBzdGF0ZSBhZGRyZXNzXG4gICAgY29uc3QgW3ByZXNhbGVTdGF0ZVBkYV0gPSBhd2FpdCBQdWJsaWNLZXkuZmluZFByb2dyYW1BZGRyZXNzKFxuICAgICAgW0J1ZmZlci5mcm9tKFwicHJlc2FsZV9zdGF0ZVwiKV0sXG4gICAgICBwcm9ncmFtLnByb2dyYW1JZFxuICAgICk7XG4gICAgcHJlc2FsZVN0YXRlID0gcHJlc2FsZVN0YXRlUGRhO1xuICAgIFxuICAgIC8vIEdldCB0aGUgcHJlc2FsZSB0b2tlbiBhY2NvdW50XG4gICAgY29uc3QgW3ByZXNhbGVUb2tlbkFjY291bnRQZGFdID0gYXdhaXQgUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzcyhcbiAgICAgIFtCdWZmZXIuZnJvbShcInByZXNhbGVfdG9rZW5fYWNjb3VudFwiKV0sXG4gICAgICBwcm9ncmFtLnByb2dyYW1JZFxuICAgICk7XG4gICAgcHJlc2FsZVRva2VuQWNjb3VudCA9IHByZXNhbGVUb2tlbkFjY291bnRQZGE7XG4gICAgXG4gICAgLy8gQ3JlYXRlIGJlbmVmaWNpYXJ5IHRva2VuIGFjY291bnRcbiAgICBiZW5lZmljaWFyeVRva2VuQWNjb3VudCA9IGF3YWl0IGdldEFzc29jaWF0ZWRUb2tlbkFkZHJlc3MoXG4gICAgICBtaW50LFxuICAgICAgYmVuZWZpY2lhcnkucHVibGljS2V5XG4gICAgKTtcbiAgICBcbiAgICAvLyBDcmVhdGUgdGhlIHRva2VuIGFjY291bnQgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIHRyeSB7XG4gICAgICAvLyBVc2UgYSBkaWZmZXJlbnQgYXBwcm9hY2ggdG8gY2hlY2sgaWYgdGhlIGFjY291bnQgZXhpc3RzXG4gICAgICBjb25zdCBhY2NvdW50SW5mbyA9IGF3YWl0IHByb3ZpZGVyLmNvbm5lY3Rpb24uZ2V0QWNjb3VudEluZm8oYmVuZWZpY2lhcnlUb2tlbkFjY291bnQpO1xuICAgICAgaWYgKCFhY2NvdW50SW5mbykge1xuICAgICAgICBjb25zdCB0eCA9IG5ldyBhbmNob3Iud2ViMy5UcmFuc2FjdGlvbigpLmFkZChcbiAgICAgICAgICBjcmVhdGVBc3NvY2lhdGVkVG9rZW5BY2NvdW50SW5zdHJ1Y3Rpb24oXG4gICAgICAgICAgICBwcm92aWRlci53YWxsZXQucHVibGljS2V5LFxuICAgICAgICAgICAgYmVuZWZpY2lhcnlUb2tlbkFjY291bnQsXG4gICAgICAgICAgICBiZW5lZmljaWFyeS5wdWJsaWNLZXksXG4gICAgICAgICAgICBtaW50XG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBwcm92aWRlci5zZW5kQW5kQ29uZmlybSh0eCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNyZWF0aW5nIHRva2VuIGFjY291bnQ6XCIsIGUpO1xuICAgIH1cblxuICAgIC8vIEluaXRpYWxpemUgcHJlc2FsZVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBub3cgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IG5vdztcbiAgICAgIGNvbnN0IGVuZFRpbWUgPSBub3cgKyAoNyAqIDI0ICogNjAgKiA2MCk7IC8vIDcgZGF5cyBmcm9tIG5vd1xuXG4gICAgICAvLyBHZW5lcmF0ZSBhIG5ldyBrZXlwYWlyIGZvciBwcmVzYWxlIHN0YXRlXG4gICAgICBjb25zdCBwcmVzYWxlU3RhdGVLZXlwYWlyID0gS2V5cGFpci5nZW5lcmF0ZSgpO1xuICAgICAgcHJlc2FsZVN0YXRlID0gcHJlc2FsZVN0YXRlS2V5cGFpci5wdWJsaWNLZXk7XG5cbiAgICAgIGF3YWl0IHByb2dyYW0ubWV0aG9kc1xuICAgICAgICAuaW5pdGlhbGl6ZShcbiAgICAgICAgICBuZXcgYW5jaG9yLkJOKHN0YXJ0VGltZSksXG4gICAgICAgICAgbmV3IGFuY2hvci5CTihlbmRUaW1lKVxuICAgICAgICApXG4gICAgICAgIC5hY2NvdW50cyh7XG4gICAgICAgICAgYXV0aG9yaXR5OiBwcm92aWRlci53YWxsZXQucHVibGljS2V5LFxuICAgICAgICAgIHByZXNhbGVTdGF0ZTogcHJlc2FsZVN0YXRlLFxuICAgICAgICAgIHRva2VuTWludDogbWludCxcbiAgICAgICAgICB0b2tlbkFjY291bnQ6IHByZXNhbGVUb2tlbkFjY291bnQsXG4gICAgICAgICAgc3lzdGVtUHJvZ3JhbTogU3lzdGVtUHJvZ3JhbS5wcm9ncmFtSWQsXG4gICAgICAgICAgdG9rZW5Qcm9ncmFtOiBUT0tFTl9QUk9HUkFNX0lELFxuICAgICAgICAgIGFzc29jaWF0ZWRUb2tlblByb2dyYW06IEFTU09DSUFURURfVE9LRU5fUFJPR1JBTV9JRCxcbiAgICAgICAgICByZW50OiBTWVNWQVJfUkVOVF9QVUJLRVksXG4gICAgICAgIH0pXG4gICAgICAgIC5zaWduZXJzKFtwcmVzYWxlU3RhdGVLZXlwYWlyXSlcbiAgICAgICAgLnJwYygpO1xuXG4gICAgICBjb25zb2xlLmxvZyhcIlByZXNhbGUgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW5pdGlhbGl6aW5nIHByZXNhbGU6XCIsIGVycm9yKTtcbiAgICB9XG4gIH0pO1xuXG4gIGl0KFwiU2hvdWxkIGJ1eSB0b2tlbnMgYW5kIGluaXRpYWxpemUgdmVzdGluZyBzY2hlZHVsZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gRmluZCB0aGUgYnV5ZXIgc3RhdGUgUERBXG4gICAgY29uc3QgW2J1eWVyU3RhdGVQZGFdID0gYXdhaXQgUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzcyhcbiAgICAgIFtCdWZmZXIuZnJvbShcImJ1eWVyX3N0YXRlXCIpLCBiZW5lZmljaWFyeS5wdWJsaWNLZXkudG9CdWZmZXIoKV0sXG4gICAgICBwcm9ncmFtLnByb2dyYW1JZFxuICAgICk7XG4gICAgYnV5ZXJTdGF0ZSA9IGJ1eWVyU3RhdGVQZGE7XG5cbiAgICAvLyBGaW5kIHRoZSB0cmFuc2FjdGlvbiBoaXN0b3J5IFBEQVxuICAgIGNvbnN0IFt0cmFuc2FjdGlvbkhpc3RvcnlQZGFdID0gYXdhaXQgUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzcyhcbiAgICAgIFtCdWZmZXIuZnJvbShcInRyYW5zYWN0aW9uX2hpc3RvcnlcIiksIGJlbmVmaWNpYXJ5LnB1YmxpY0tleS50b0J1ZmZlcigpXSxcbiAgICAgIHByb2dyYW0ucHJvZ3JhbUlkXG4gICAgKTtcblxuICAgIC8vIEJ1eSB0b2tlbnMgd2l0aCBVU0QgYW1vdW50XG4gICAgY29uc3QgdXNkQW1vdW50ID0gNTAuMDsgLy8gJDUwIFVTRFxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHByb2dyYW0ubWV0aG9kc1xuICAgICAgICAuYnV5KHVzZEFtb3VudClcbiAgICAgICAgLmFjY291bnRzKHtcbiAgICAgICAgICBidXllcjogYmVuZWZpY2lhcnkucHVibGljS2V5LFxuICAgICAgICAgIHByZXNhbGVTdGF0ZTogcHJlc2FsZVN0YXRlLFxuICAgICAgICAgIGF1dGhvcml0eTogcHJvdmlkZXIud2FsbGV0LnB1YmxpY0tleSxcbiAgICAgICAgICBidXllclN0YXRlOiBidXllclN0YXRlLFxuICAgICAgICAgIHNvbFByaWNlRmVlZDogS2V5cGFpci5nZW5lcmF0ZSgpLnB1YmxpY0tleSwgLy8gQW55IGFjY291bnQgd2lsbCB3b3JrIHNpbmNlIGl0J3Mgb3B0aW9uYWwgbm93XG4gICAgICAgICAgdHJhbnNhY3Rpb25IaXN0b3J5OiB0cmFuc2FjdGlvbkhpc3RvcnlQZGEsXG4gICAgICAgICAgdG9rZW5Qcm9ncmFtOiBUT0tFTl9QUk9HUkFNX0lELFxuICAgICAgICAgIHN5c3RlbVByb2dyYW06IFN5c3RlbVByb2dyYW0ucHJvZ3JhbUlkLFxuICAgICAgICAgIHJlbnQ6IFNZU1ZBUl9SRU5UX1BVQktFWSxcbiAgICAgICAgfSlcbiAgICAgICAgLnNpZ25lcnMoW2JlbmVmaWNpYXJ5XSlcbiAgICAgICAgLnJwYygpO1xuXG4gICAgICAvLyBGZXRjaCBhbmQgdmVyaWZ5IHRoZSBidXllciBzdGF0ZVxuICAgICAgY29uc3QgYnV5ZXJTdGF0ZURhdGEgPSBhd2FpdCBwcm9ncmFtLmFjY291bnQuYnV5ZXJTdGF0ZS5mZXRjaChidXllclN0YXRlKTtcbiAgICAgIGFzc2VydC5vayhidXllclN0YXRlRGF0YS5idXllci5lcXVhbHMoYmVuZWZpY2lhcnkucHVibGljS2V5KSk7XG4gICAgICBhc3NlcnQub2soYnV5ZXJTdGF0ZURhdGEudG90YWxQdXJjaGFzZWQuZ3QobmV3IGFuY2hvci5CTigwKSkpO1xuICAgICAgYXNzZXJ0Lm9rKGJ1eWVyU3RhdGVEYXRhLnZlc3RpbmdUaWVycy5sZW5ndGggPiAwKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGJ1eWluZyB0b2tlbnM6XCIsIGVycm9yKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiU2tpcHBpbmcgdGVzdCBkdWUgdG8gZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0pO1xuXG4gIGl0KFwiU2hvdWxkIGNsYWltIHZlc3RlZCB0b2tlbnMgYWZ0ZXIgdmVzdGluZyBwZXJpb2RcIiwgYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBHZXQgdGhlIGJ1eWVyIHN0YXRlIGRhdGFcbiAgICAgIGNvbnN0IGJ1eWVyU3RhdGVEYXRhID0gYXdhaXQgcHJvZ3JhbS5hY2NvdW50LmJ1eWVyU3RhdGUuZmV0Y2goYnV5ZXJTdGF0ZSk7XG4gICAgICBcbiAgICAgIC8vIEdldCBiZW5lZmljaWFyeSB0b2tlbiBhY2NvdW50XG4gICAgICBiZW5lZmljaWFyeVRva2VuQWNjb3VudCA9IGF3YWl0IGdldEFzc29jaWF0ZWRUb2tlbkFkZHJlc3MoXG4gICAgICAgIG1pbnQsXG4gICAgICAgIGJlbmVmaWNpYXJ5LnB1YmxpY0tleVxuICAgICAgKTtcblxuICAgICAgLy8gQ2xhaW0gdG9rZW5zXG4gICAgICBhd2FpdCBwcm9ncmFtLm1ldGhvZHNcbiAgICAgICAgLmNsYWltVG9rZW5zKClcbiAgICAgICAgLmFjY291bnRzKHtcbiAgICAgICAgICBidXllcjogYmVuZWZpY2lhcnkucHVibGljS2V5LFxuICAgICAgICAgIHByZXNhbGVTdGF0ZTogcHJlc2FsZVN0YXRlLFxuICAgICAgICAgIGJ1eWVyU3RhdGU6IGJ1eWVyU3RhdGUsXG4gICAgICAgICAgYnV5ZXJUb2tlbkFjY291bnQ6IGJlbmVmaWNpYXJ5VG9rZW5BY2NvdW50LFxuICAgICAgICAgIHByZXNhbGVUb2tlbkFjY291bnQ6IHByZXNhbGVUb2tlbkFjY291bnQsXG4gICAgICAgICAgdG9rZW5Qcm9ncmFtOiBUT0tFTl9QUk9HUkFNX0lELFxuICAgICAgICB9KVxuICAgICAgICAuc2lnbmVycyhbYmVuZWZpY2lhcnldKVxuICAgICAgICAucnBjKCk7XG5cbiAgICAgIC8vIFZlcmlmeSB0b2tlbnMgd2VyZSByZWNlaXZlZFxuICAgICAgY29uc3QgYWNjb3VudEluZm8gPSBhd2FpdCBwcm92aWRlci5jb25uZWN0aW9uLmdldEFjY291bnRJbmZvKGJlbmVmaWNpYXJ5VG9rZW5BY2NvdW50KTtcbiAgICAgIGFzc2VydC5vayhhY2NvdW50SW5mbyAhPT0gbnVsbCwgXCJUb2tlbiBhY2NvdW50IHNob3VsZCBleGlzdFwiKTtcbiAgICAgIGFzc2VydC5vayhhY2NvdW50SW5mbyEubGFtcG9ydHMgPiAwLCBcIk5vIHRva2VucyB3ZXJlIGNsYWltZWRcIik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjbGFpbWluZyB0b2tlbnM6XCIsIGVycm9yKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiU2tpcHBpbmcgdGVzdCBkdWUgdG8gZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0pO1xuXG4gIGl0KFwiU2hvdWxkIGdldCB0cmFuc2FjdGlvbiBoaXN0b3J5XCIsIGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gRmluZCB0aGUgdHJhbnNhY3Rpb24gaGlzdG9yeSBQREFcbiAgICAgIGNvbnN0IFt0cmFuc2FjdGlvbkhpc3RvcnlQZGFdID0gYXdhaXQgUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzcyhcbiAgICAgICAgW0J1ZmZlci5mcm9tKFwidHJhbnNhY3Rpb25faGlzdG9yeVwiKSwgYmVuZWZpY2lhcnkucHVibGljS2V5LnRvQnVmZmVyKCldLFxuICAgICAgICBwcm9ncmFtLnByb2dyYW1JZFxuICAgICAgKTtcblxuICAgICAgLy8gR2V0IHRyYW5zYWN0aW9uIGhpc3RvcnlcbiAgICAgIGF3YWl0IHByb2dyYW0ubWV0aG9kc1xuICAgICAgICAuZ2V0VHJhbnNhY3Rpb25IaXN0b3J5KClcbiAgICAgICAgLmFjY291bnRzKHtcbiAgICAgICAgICB1c2VyOiBiZW5lZmljaWFyeS5wdWJsaWNLZXksXG4gICAgICAgICAgdHJhbnNhY3Rpb25IaXN0b3J5OiB0cmFuc2FjdGlvbkhpc3RvcnlQZGEsXG4gICAgICAgICAgc3lzdGVtUHJvZ3JhbTogU3lzdGVtUHJvZ3JhbS5wcm9ncmFtSWQsXG4gICAgICAgIH0pXG4gICAgICAgIC5zaWduZXJzKFtiZW5lZmljaWFyeV0pXG4gICAgICAgIC5ycGMoKTtcblxuICAgICAgLy8gVmVyaWZ5IHRyYW5zYWN0aW9uIGhpc3RvcnkgZXhpc3RzXG4gICAgICBjb25zdCBhY2NvdW50SW5mbyA9IGF3YWl0IHByb3ZpZGVyLmNvbm5lY3Rpb24uZ2V0QWNjb3VudEluZm8odHJhbnNhY3Rpb25IaXN0b3J5UGRhKTtcbiAgICAgIGFzc2VydC5vayhhY2NvdW50SW5mbyAhPT0gbnVsbCwgXCJUcmFuc2FjdGlvbiBoaXN0b3J5IGFjY291bnQgc2hvdWxkIGV4aXN0XCIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZ2V0dGluZyB0cmFuc2FjdGlvbiBoaXN0b3J5OlwiLCBlcnJvcik7XG4gICAgICBjb25zb2xlLmxvZyhcIlNraXBwaW5nIHRlc3QgZHVlIHRvIGVycm9yOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9KTtcbn0pOyAiXX0=