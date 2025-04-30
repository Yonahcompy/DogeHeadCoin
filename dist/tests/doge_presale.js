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
const bn_js_1 = require("bn.js");
describe("doge-presale", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.DogePresale;
    // Generate a new keypair for the presale state account
    const presaleState = web3_js_1.Keypair.generate();
    // Generate a new keypair for the token mint
    const tokenMint = web3_js_1.Keypair.generate();
    // Store token accounts for later use
    let authorityTokenAccount;
    let presaleTokenAccount;
    it("Is initialized!", async () => {
        // Create token mint account
        const lamports = await provider.connection.getMinimumBalanceForRentExemption(spl_token_1.MINT_SIZE);
        const createMintAccountIx = web3_js_1.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: tokenMint.publicKey,
            space: spl_token_1.MINT_SIZE,
            lamports,
            programId: spl_token_1.TOKEN_PROGRAM_ID,
        });
        // Initialize mint
        const initializeMintIx = (0, spl_token_1.createInitializeMintInstruction)(tokenMint.publicKey, 9, // decimals
        provider.wallet.publicKey, provider.wallet.publicKey);
        // Get the associated token account for the presale
        presaleTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(tokenMint.publicKey, presaleState.publicKey, true);
        const startTime = new bn_js_1.BN(Math.floor(Date.now() / 1000));
        const endTime = new bn_js_1.BN(startTime.toNumber() + 7 * 24 * 60 * 60); // 7 days from now
        // Create and send the combined transaction
        const tx = await program.methods
            .initialize(startTime, endTime)
            .accounts({
            presaleState: presaleState.publicKey,
            tokenMint: tokenMint.publicKey,
            tokenAccount: presaleTokenAccount,
            authority: provider.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
        })
            .preInstructions([createMintAccountIx, initializeMintIx])
            .signers([presaleState, tokenMint])
            .rpc();
        console.log("Your transaction signature", tx);
        // Verify the presale state
        const presaleStateAccount = await program.account.presaleState.fetch(presaleState.publicKey);
        chai_1.assert.equal(presaleStateAccount.authority.toString(), provider.wallet.publicKey.toString());
        chai_1.assert.equal(presaleStateAccount.tokenMint.toString(), tokenMint.publicKey.toString());
        chai_1.assert.equal(presaleStateAccount.tokenAccount.toString(), presaleTokenAccount.toString());
        chai_1.assert.equal(presaleStateAccount.startTime.toNumber(), startTime.toNumber());
        chai_1.assert.equal(presaleStateAccount.endTime.toNumber(), endTime.toNumber());
        chai_1.assert.equal(presaleStateAccount.currentStage, 0);
        chai_1.assert.equal(presaleStateAccount.isFinalized, false);
        // Verify the mint is properly initialized
        const mintInfo = await (0, spl_token_1.getMint)(provider.connection, tokenMint.publicKey);
        chai_1.assert.equal(mintInfo.mintAuthority.toString(), provider.wallet.publicKey.toString());
        chai_1.assert.equal(mintInfo.decimals, 9);
    });
    it("Can deposit tokens", async () => {
        // Get the authority's associated token account
        authorityTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(tokenMint.publicKey, provider.wallet.publicKey);
        // Create the authority's token account if it doesn't exist
        try {
            const accountInfo = await provider.connection.getAccountInfo(authorityTokenAccount);
            if (!accountInfo) {
                console.log("Creating authority token account...");
                const createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(provider.wallet.publicKey, authorityTokenAccount, provider.wallet.publicKey, tokenMint.publicKey);
                const tx = await provider.sendAndConfirm(new anchor.web3.Transaction().add(createAtaIx));
                console.log("Created authority token account:", tx);
            }
        }
        catch {
            console.log("Authority token account already exists");
        }
        // Mint tokens to test
        const mintAmount = new bn_js_1.BN(1).mul(new bn_js_1.BN(10).pow(new bn_js_1.BN(9))); // 1 token with 9 decimals
        const mintToIx = (0, spl_token_1.createMintToInstruction)(tokenMint.publicKey, authorityTokenAccount, provider.wallet.publicKey, Number(mintAmount.toString()));
        console.log("Minting tokens...");
        const mintTx = await provider.sendAndConfirm(new anchor.web3.Transaction().add(mintToIx));
        console.log("Minted tokens to authority:", mintTx);
        // Verify the tokens were minted
        const authorityBalance = await provider.connection.getTokenAccountBalance(authorityTokenAccount);
        console.log("Authority token balance:", authorityBalance.value.amount);
        chai_1.assert.equal(authorityBalance.value.amount, mintAmount.toString());
        // Deposit tokens to the presale
        const depositAmount = new bn_js_1.BN(0.5).mul(new bn_js_1.BN(10).pow(new bn_js_1.BN(9))); // 0.5 tokens
        console.log("Depositing tokens...");
        const depositTx = await program.methods
            .depositTokens(depositAmount)
            .accounts({
            authority: provider.wallet.publicKey,
            presaleState: presaleState.publicKey,
            authorityTokenAccount: authorityTokenAccount,
            presaleTokenAccount: presaleTokenAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .rpc();
        console.log("Deposit transaction signature:", depositTx);
        // Verify the deposit
        const presaleTokenAccountInfo = await provider.connection.getTokenAccountBalance(presaleTokenAccount);
        chai_1.assert.equal(presaleTokenAccountInfo.value.amount, depositAmount.toString());
    });
    it("Can retrieve presale statistics", async () => {
        // Fetch the presale state account
        const presaleStateAccount = await program.account.presaleState.fetch(presaleState.publicKey);
        // Get token balances
        const presaleTokenBalance = await provider.connection.getTokenAccountBalance(presaleTokenAccount);
        console.log("\n=== PRESALE STATISTICS ===");
        console.log("Total tokens in presale contract:", presaleTokenBalance.value.uiAmount);
        console.log("Tokens sold:", presaleStateAccount.tokensSold.toString());
        console.log("USD raised:", presaleStateAccount.usdRaised.toString());
        // Get SOL balance of the authority
        const authoritySolBalance = await provider.connection.getBalance(provider.wallet.publicKey);
        console.log("SOL in authority account:", authoritySolBalance / anchor.web3.LAMPORTS_PER_SOL);
        // Get current stage information
        console.log("Current stage:", presaleStateAccount.currentStage);
        // Calculate time remaining
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = presaleStateAccount.endTime.toNumber() - currentTime;
        const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60));
        const hoursRemaining = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
        console.log("Time remaining:", daysRemaining, "days,", hoursRemaining, "hours");
        // Check if presale is finalized
        console.log("Presale finalized:", presaleStateAccount.isFinalized);
        console.log("=== END OF STATISTICS ===\n");
        // Assert that we have the expected data
        chai_1.assert.isDefined(presaleStateAccount);
        chai_1.assert.isDefined(presaleTokenBalance);
        chai_1.assert.isDefined(presaleStateAccount.tokensSold);
        chai_1.assert.isDefined(presaleStateAccount.usdRaised);
        chai_1.assert.isDefined(presaleStateAccount.currentStage);
        chai_1.assert.isDefined(timeRemaining);
        chai_1.assert.isDefined(presaleStateAccount.isFinalized);
        console.log("Test passed: Successfully retrieved presale statistics");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9nZV9wcmVzYWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdHMvZG9nZV9wcmVzYWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMERBQTRDO0FBRTVDLDZDQUFvRztBQUNwRyxpREFTMkI7QUFDM0IsK0JBQThCO0FBRTlCLGlDQUEyQjtBQUUzQixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFN0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFtQyxDQUFDO0lBRXJFLHVEQUF1RDtJQUN2RCxNQUFNLFlBQVksR0FBRyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRXhDLDRDQUE0QztJQUM1QyxNQUFNLFNBQVMsR0FBRyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRXJDLHFDQUFxQztJQUNyQyxJQUFJLHFCQUFnQyxDQUFDO0lBQ3JDLElBQUksbUJBQThCLENBQUM7SUFFbkMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLEtBQUssSUFBSSxFQUFFO1FBQy9CLDRCQUE0QjtRQUM1QixNQUFNLFFBQVEsR0FBRyxNQUFNLFFBQVEsQ0FBQyxVQUFVLENBQUMsaUNBQWlDLENBQUMscUJBQVMsQ0FBQyxDQUFDO1FBQ3hGLE1BQU0sbUJBQW1CLEdBQUcsdUJBQWEsQ0FBQyxhQUFhLENBQUM7WUFDdEQsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUztZQUNyQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsU0FBUztZQUNyQyxLQUFLLEVBQUUscUJBQVM7WUFDaEIsUUFBUTtZQUNSLFNBQVMsRUFBRSw0QkFBZ0I7U0FDNUIsQ0FBQyxDQUFD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RSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVoRixnQ0FBZ0M7UUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFFM0Msd0NBQXdDO1FBQ3hDLGFBQU0sQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUN0QyxhQUFNLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdEMsYUFBTSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqRCxhQUFNLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hELGFBQU0sQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkQsYUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNoQyxhQUFNLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRWxELE9BQU8sQ0FBQyxHQUFHLENBQUMsd0RBQXdELENBQUMsQ0FBQztJQUN4RSxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYW5jaG9yIGZyb20gXCJAY29yYWwteHl6L2FuY2hvclwiO1xuaW1wb3J0IHsgUHJvZ3JhbSB9IGZyb20gXCJAY29yYWwteHl6L2FuY2hvclwiO1xuaW1wb3J0IHsgUHVibGljS2V5LCBLZXlwYWlyLCBTeXN0ZW1Qcm9ncmFtLCBTWVNWQVJfUkVOVF9QVUJLRVksIENvbm5lY3Rpb24gfSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5pbXBvcnQgeyBcbiAgVE9LRU5fUFJPR1JBTV9JRCwgXG4gIE1JTlRfU0laRSwgXG4gIGNyZWF0ZUluaXRpYWxpemVNaW50SW5zdHJ1Y3Rpb24sIFxuICBnZXRBc3NvY2lhdGVkVG9rZW5BZGRyZXNzLCBcbiAgY3JlYXRlQXNzb2NpYXRlZFRva2VuQWNjb3VudEluc3RydWN0aW9uLCBcbiAgQVNTT0NJQVRFRF9UT0tFTl9QUk9HUkFNX0lELCBcbiAgY3JlYXRlTWludFRvSW5zdHJ1Y3Rpb24sXG4gIGdldE1pbnQsXG59IGZyb20gXCJAc29sYW5hL3NwbC10b2tlblwiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImNoYWlcIjtcbmltcG9ydCB7IERvZ2VQcmVzYWxlIH0gZnJvbSBcIi4uL3RhcmdldC90eXBlcy9kb2dlX3ByZXNhbGVcIjtcbmltcG9ydCB7IEJOIH0gZnJvbSBcImJuLmpzXCI7XG5cbmRlc2NyaWJlKFwiZG9nZS1wcmVzYWxlXCIsICgpID0+IHtcbiAgY29uc3QgcHJvdmlkZXIgPSBhbmNob3IuQW5jaG9yUHJvdmlkZXIuZW52KCk7XG4gIGFuY2hvci5zZXRQcm92aWRlcihwcm92aWRlcik7XG5cbiAgY29uc3QgcHJvZ3JhbSA9IGFuY2hvci53b3Jrc3BhY2UuRG9nZVByZXNhbGUgYXMgUHJvZ3JhbTxEb2dlUHJlc2FsZT47XG4gIFxuICAvLyBHZW5lcmF0ZSBhIG5ldyBrZXlwYWlyIGZvciB0aGUgcHJlc2FsZSBzdGF0ZSBhY2NvdW50XG4gIGNvbnN0IHByZXNhbGVTdGF0ZSA9IEtleXBhaXIuZ2VuZXJhdGUoKTtcbiAgXG4gIC8vIEdlbmVyYXRlIGEgbmV3IGtleXBhaXIgZm9yIHRoZSB0b2tlbiBtaW50XG4gIGNvbnN0IHRva2VuTWludCA9IEtleXBhaXIuZ2VuZXJhdGUoKTtcblxuICAvLyBTdG9yZSB0b2tlbiBhY2NvdW50cyBmb3IgbGF0ZXIgdXNlXG4gIGxldCBhdXRob3JpdHlUb2tlbkFjY291bnQ6IFB1YmxpY0tleTtcbiAgbGV0IHByZXNhbGVUb2tlbkFjY291bnQ6IFB1YmxpY0tleTtcblxuICBpdChcIklzIGluaXRpYWxpemVkIVwiLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gQ3JlYXRlIHRva2VuIG1pbnQgYWNjb3VudFxuICAgIGNvbnN0IGxhbXBvcnRzID0gYXdhaXQgcHJvdmlkZXIuY29ubmVjdGlvbi5nZXRNaW5pbXVtQmFsYW5jZUZvclJlbnRFeGVtcHRpb24oTUlOVF9TSVpFKTtcbiAgICBjb25zdCBjcmVhdGVNaW50QWNjb3VudEl4ID0gU3lzdGVtUHJvZ3JhbS5jcmVhdGVBY2NvdW50KHtcbiAgICAgIGZyb21QdWJrZXk6IHByb3ZpZGVyLndhbGxldC5wdWJsaWNLZXksXG4gICAgICBuZXdBY2NvdW50UHVia2V5OiB0b2tlbk1pbnQucHVibGljS2V5LFxuICAgICAgc3BhY2U6IE1JTlRfU0laRSxcbiAgICAgIGxhbXBvcnRzLFxuICAgICAgcHJvZ3JhbUlkOiBUT0tFTl9QUk9HUkFNX0lELFxuICAgIH0pO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBtaW50XG4gICAgY29uc3QgaW5pdGlhbGl6ZU1pbnRJeCA9IGNyZWF0ZUluaXRpYWxpemVNaW50SW5zdHJ1Y3Rpb24oXG4gICAgICB0b2tlbk1pbnQucHVibGljS2V5LFxuICAgICAgOSwgLy8gZGVjaW1hbHNcbiAgICAgIHByb3ZpZGVyLndhbGxldC5wdWJsaWNLZXksXG4gICAgICBwcm92aWRlci53YWxsZXQucHVibGljS2V5LFxuICAgICk7XG5cbiAgICAvLyBHZXQgdGhlIGFzc29jaWF0ZWQgdG9rZW4gYWNjb3VudCBmb3IgdGhlIHByZXNhbGVcbiAgICBwcmVzYWxlVG9rZW5BY2NvdW50ID0gYXdhaXQgZ2V0QXNzb2NpYXRlZFRva2VuQWRkcmVzcyhcbiAgICAgIHRva2VuTWludC5wdWJsaWNLZXksXG4gICAgICBwcmVzYWxlU3RhdGUucHVibGljS2V5LFxuICAgICAgdHJ1ZVxuICAgICk7XG5cbiAgICBjb25zdCBzdGFydFRpbWUgPSBuZXcgQk4oTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgQk4oc3RhcnRUaW1lLnRvTnVtYmVyKCkgKyA3ICogMjQgKiA2MCAqIDYwKTsgLy8gNyBkYXlzIGZyb20gbm93XG5cbiAgICAvLyBDcmVhdGUgYW5kIHNlbmQgdGhlIGNvbWJpbmVkIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgdHggPSBhd2FpdCBwcm9ncmFtLm1ldGhvZHNcbiAgICAgIC5pbml0aWFsaXplKHN0YXJ0VGltZSwgZW5kVGltZSlcbiAgICAgIC5hY2NvdW50cyh7XG4gICAgICAgIHByZXNhbGVTdGF0ZTogcHJlc2FsZVN0YXRlLnB1YmxpY0tleSxcbiAgICAgICAgdG9rZW5NaW50OiB0b2tlbk1pbnQucHVibGljS2V5LFxuICAgICAgICB0b2tlbkFjY291bnQ6IHByZXNhbGVUb2tlbkFjY291bnQsXG4gICAgICAgIGF1dGhvcml0eTogcHJvdmlkZXIud2FsbGV0LnB1YmxpY0tleSxcbiAgICAgICAgc3lzdGVtUHJvZ3JhbTogU3lzdGVtUHJvZ3JhbS5wcm9ncmFtSWQsXG4gICAgICAgIHRva2VuUHJvZ3JhbTogVE9LRU5fUFJPR1JBTV9JRCxcbiAgICAgICAgcmVudDogU1lTVkFSX1JFTlRfUFVCS0VZLFxuICAgICAgICBhc3NvY2lhdGVkVG9rZW5Qcm9ncmFtOiBBU1NPQ0lBVEVEX1RPS0VOX1BST0dSQU1fSUQsXG4gICAgICB9KVxuICAgICAgLnByZUluc3RydWN0aW9ucyhbY3JlYXRlTWludEFjY291bnRJeCwgaW5pdGlhbGl6ZU1pbnRJeF0pXG4gICAgICAuc2lnbmVycyhbcHJlc2FsZVN0YXRlLCB0b2tlbk1pbnRdKVxuICAgICAgLnJwYygpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3VyIHRyYW5zYWN0aW9uIHNpZ25hdHVyZVwiLCB0eCk7XG5cbiAgICAvLyBWZXJpZnkgdGhlIHByZXNhbGUgc3RhdGVcbiAgICBjb25zdCBwcmVzYWxlU3RhdGVBY2NvdW50ID0gYXdhaXQgcHJvZ3JhbS5hY2NvdW50LnByZXNhbGVTdGF0ZS5mZXRjaChwcmVzYWxlU3RhdGUucHVibGljS2V5KTtcbiAgICBhc3NlcnQuZXF1YWwocHJlc2FsZVN0YXRlQWNjb3VudC5hdXRob3JpdHkudG9TdHJpbmcoKSwgcHJvdmlkZXIud2FsbGV0LnB1YmxpY0tleS50b1N0cmluZygpKTtcbiAgICBhc3NlcnQuZXF1YWwocHJlc2FsZVN0YXRlQWNjb3VudC50b2tlbk1pbnQudG9TdHJpbmcoKSwgdG9rZW5NaW50LnB1YmxpY0tleS50b1N0cmluZygpKTtcbiAgICBhc3NlcnQuZXF1YWwocHJlc2FsZVN0YXRlQWNjb3VudC50b2tlbkFjY291bnQudG9TdHJpbmcoKSwgcHJlc2FsZVRva2VuQWNjb3VudC50b1N0cmluZygpKTtcbiAgICBhc3NlcnQuZXF1YWwocHJlc2FsZVN0YXRlQWNjb3VudC5zdGFydFRpbWUudG9OdW1iZXIoKSwgc3RhcnRUaW1lLnRvTnVtYmVyKCkpO1xuICAgIGFzc2VydC5lcXVhbChwcmVzYWxlU3RhdGVBY2NvdW50LmVuZFRpbWUudG9OdW1iZXIoKSwgZW5kVGltZS50b051bWJlcigpKTtcbiAgICBhc3NlcnQuZXF1YWwocHJlc2FsZVN0YXRlQWNjb3VudC5jdXJyZW50U3RhZ2UsIDApO1xuICAgIGFzc2VydC5lcXVhbChwcmVzYWxlU3RhdGVBY2NvdW50LmlzRmluYWxpemVkLCBmYWxzZSk7XG5cbiAgICAvLyBWZXJpZnkgdGhlIG1pbnQgaXMgcHJvcGVybHkgaW5pdGlhbGl6ZWRcbiAgICBjb25zdCBtaW50SW5mbyA9IGF3YWl0IGdldE1pbnQocHJvdmlkZXIuY29ubmVjdGlvbiBhcyB1bmtub3duIGFzIENvbm5lY3Rpb24sIHRva2VuTWludC5wdWJsaWNLZXkpO1xuICAgIGFzc2VydC5lcXVhbChtaW50SW5mby5taW50QXV0aG9yaXR5LnRvU3RyaW5nKCksIHByb3ZpZGVyLndhbGxldC5wdWJsaWNLZXkudG9TdHJpbmcoKSk7XG4gICAgYXNzZXJ0LmVxdWFsKG1pbnRJbmZvLmRlY2ltYWxzLCA5KTtcbiAgfSk7XG5cbiAgaXQoXCJDYW4gZGVwb3NpdCB0b2tlbnNcIiwgYXN5bmMgKCkgPT4ge1xuICAgIC8vIEdldCB0aGUgYXV0aG9yaXR5J3MgYXNzb2NpYXRlZCB0b2tlbiBhY2NvdW50XG4gICAgYXV0aG9yaXR5VG9rZW5BY2NvdW50ID0gYXdhaXQgZ2V0QXNzb2NpYXRlZFRva2VuQWRkcmVzcyhcbiAgICAgIHRva2VuTWludC5wdWJsaWNLZXksXG4gICAgICBwcm92aWRlci53YWxsZXQucHVibGljS2V5XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgYXV0aG9yaXR5J3MgdG9rZW4gYWNjb3VudCBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFjY291bnRJbmZvID0gYXdhaXQgcHJvdmlkZXIuY29ubmVjdGlvbi5nZXRBY2NvdW50SW5mbyhhdXRob3JpdHlUb2tlbkFjY291bnQpO1xuICAgICAgaWYgKCFhY2NvdW50SW5mbykge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIGF1dGhvcml0eSB0b2tlbiBhY2NvdW50Li4uXCIpO1xuICAgICAgICBjb25zdCBjcmVhdGVBdGFJeCA9IGNyZWF0ZUFzc29jaWF0ZWRUb2tlbkFjY291bnRJbnN0cnVjdGlvbihcbiAgICAgICAgICBwcm92aWRlci53YWxsZXQucHVibGljS2V5LFxuICAgICAgICAgIGF1dGhvcml0eVRva2VuQWNjb3VudCxcbiAgICAgICAgICBwcm92aWRlci53YWxsZXQucHVibGljS2V5LFxuICAgICAgICAgIHRva2VuTWludC5wdWJsaWNLZXlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdHggPSBhd2FpdCBwcm92aWRlci5zZW5kQW5kQ29uZmlybShuZXcgYW5jaG9yLndlYjMuVHJhbnNhY3Rpb24oKS5hZGQoY3JlYXRlQXRhSXgpKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJDcmVhdGVkIGF1dGhvcml0eSB0b2tlbiBhY2NvdW50OlwiLCB0eCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb25zb2xlLmxvZyhcIkF1dGhvcml0eSB0b2tlbiBhY2NvdW50IGFscmVhZHkgZXhpc3RzXCIpO1xuICAgIH1cblxuICAgIC8vIE1pbnQgdG9rZW5zIHRvIHRlc3RcbiAgICBjb25zdCBtaW50QW1vdW50ID0gbmV3IEJOKDEpLm11bChuZXcgQk4oMTApLnBvdyhuZXcgQk4oOSkpKTsgLy8gMSB0b2tlbiB3aXRoIDkgZGVjaW1hbHNcbiAgICBjb25zdCBtaW50VG9JeCA9IGNyZWF0ZU1pbnRUb0luc3RydWN0aW9uKFxuICAgICAgdG9rZW5NaW50LnB1YmxpY0tleSxcbiAgICAgIGF1dGhvcml0eVRva2VuQWNjb3VudCxcbiAgICAgIHByb3ZpZGVyLndhbGxldC5wdWJsaWNLZXksXG4gICAgICBOdW1iZXIobWludEFtb3VudC50b1N0cmluZygpKVxuICAgICk7XG5cbiAgICBjb25zb2xlLmxvZyhcIk1pbnRpbmcgdG9rZW5zLi4uXCIpO1xuICAgIGNvbnN0IG1pbnRUeCA9IGF3YWl0IHByb3ZpZGVyLnNlbmRBbmRDb25maXJtKFxuICAgICAgbmV3IGFuY2hvci53ZWIzLlRyYW5zYWN0aW9uKCkuYWRkKG1pbnRUb0l4KVxuICAgICk7XG4gICAgY29uc29sZS5sb2coXCJNaW50ZWQgdG9rZW5zIHRvIGF1dGhvcml0eTpcIiwgbWludFR4KTtcblxuICAgIC8vIFZlcmlmeSB0aGUgdG9rZW5zIHdlcmUgbWludGVkXG4gICAgY29uc3QgYXV0aG9yaXR5QmFsYW5jZSA9IGF3YWl0IHByb3ZpZGVyLmNvbm5lY3Rpb24uZ2V0VG9rZW5BY2NvdW50QmFsYW5jZShhdXRob3JpdHlUb2tlbkFjY291bnQpO1xuICAgIGNvbnNvbGUubG9nKFwiQXV0aG9yaXR5IHRva2VuIGJhbGFuY2U6XCIsIGF1dGhvcml0eUJhbGFuY2UudmFsdWUuYW1vdW50KTtcbiAgICBhc3NlcnQuZXF1YWwoYXV0aG9yaXR5QmFsYW5jZS52YWx1ZS5hbW91bnQsIG1pbnRBbW91bnQudG9TdHJpbmcoKSk7XG5cbiAgICAvLyBEZXBvc2l0IHRva2VucyB0byB0aGUgcHJlc2FsZVxuICAgIGNvbnN0IGRlcG9zaXRBbW91bnQgPSBuZXcgQk4oMC41KS5tdWwobmV3IEJOKDEwKS5wb3cobmV3IEJOKDkpKSk7IC8vIDAuNSB0b2tlbnNcbiAgICBjb25zb2xlLmxvZyhcIkRlcG9zaXRpbmcgdG9rZW5zLi4uXCIpO1xuICAgIGNvbnN0IGRlcG9zaXRUeCA9IGF3YWl0IHByb2dyYW0ubWV0aG9kc1xuICAgICAgLmRlcG9zaXRUb2tlbnMoZGVwb3NpdEFtb3VudClcbiAgICAgIC5hY2NvdW50cyh7XG4gICAgICAgIGF1dGhvcml0eTogcHJvdmlkZXIud2FsbGV0LnB1YmxpY0tleSxcbiAgICAgICAgcHJlc2FsZVN0YXRlOiBwcmVzYWxlU3RhdGUucHVibGljS2V5LFxuICAgICAgICBhdXRob3JpdHlUb2tlbkFjY291bnQ6IGF1dGhvcml0eVRva2VuQWNjb3VudCxcbiAgICAgICAgcHJlc2FsZVRva2VuQWNjb3VudDogcHJlc2FsZVRva2VuQWNjb3VudCxcbiAgICAgICAgdG9rZW5Qcm9ncmFtOiBUT0tFTl9QUk9HUkFNX0lELFxuICAgICAgfSlcbiAgICAgIC5ycGMoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiRGVwb3NpdCB0cmFuc2FjdGlvbiBzaWduYXR1cmU6XCIsIGRlcG9zaXRUeCk7XG5cbiAgICAvLyBWZXJpZnkgdGhlIGRlcG9zaXRcbiAgICBjb25zdCBwcmVzYWxlVG9rZW5BY2NvdW50SW5mbyA9IGF3YWl0IHByb3ZpZGVyLmNvbm5lY3Rpb24uZ2V0VG9rZW5BY2NvdW50QmFsYW5jZShwcmVzYWxlVG9rZW5BY2NvdW50KTtcbiAgICBhc3NlcnQuZXF1YWwocHJlc2FsZVRva2VuQWNjb3VudEluZm8udmFsdWUuYW1vdW50LCBkZXBvc2l0QW1vdW50LnRvU3RyaW5nKCkpO1xuICB9KTtcblxuICBpdChcIkNhbiByZXRyaWV2ZSBwcmVzYWxlIHN0YXRpc3RpY3NcIiwgYXN5bmMgKCkgPT4ge1xuICAgIC8vIEZldGNoIHRoZSBwcmVzYWxlIHN0YXRlIGFjY291bnRcbiAgICBjb25zdCBwcmVzYWxlU3RhdGVBY2NvdW50ID0gYXdhaXQgcHJvZ3JhbS5hY2NvdW50LnByZXNhbGVTdGF0ZS5mZXRjaChwcmVzYWxlU3RhdGUucHVibGljS2V5KTtcbiAgICBcbiAgICAvLyBHZXQgdG9rZW4gYmFsYW5jZXNcbiAgICBjb25zdCBwcmVzYWxlVG9rZW5CYWxhbmNlID0gYXdhaXQgcHJvdmlkZXIuY29ubmVjdGlvbi5nZXRUb2tlbkFjY291bnRCYWxhbmNlKHByZXNhbGVUb2tlbkFjY291bnQpO1xuICAgIGNvbnNvbGUubG9nKFwiXFxuPT09IFBSRVNBTEUgU1RBVElTVElDUyA9PT1cIik7XG4gICAgY29uc29sZS5sb2coXCJUb3RhbCB0b2tlbnMgaW4gcHJlc2FsZSBjb250cmFjdDpcIiwgcHJlc2FsZVRva2VuQmFsYW5jZS52YWx1ZS51aUFtb3VudCk7XG4gICAgY29uc29sZS5sb2coXCJUb2tlbnMgc29sZDpcIiwgcHJlc2FsZVN0YXRlQWNjb3VudC50b2tlbnNTb2xkLnRvU3RyaW5nKCkpO1xuICAgIGNvbnNvbGUubG9nKFwiVVNEIHJhaXNlZDpcIiwgcHJlc2FsZVN0YXRlQWNjb3VudC51c2RSYWlzZWQudG9TdHJpbmcoKSk7XG4gICAgXG4gICAgLy8gR2V0IFNPTCBiYWxhbmNlIG9mIHRoZSBhdXRob3JpdHlcbiAgICBjb25zdCBhdXRob3JpdHlTb2xCYWxhbmNlID0gYXdhaXQgcHJvdmlkZXIuY29ubmVjdGlvbi5nZXRCYWxhbmNlKHByb3ZpZGVyLndhbGxldC5wdWJsaWNLZXkpO1xuICAgIGNvbnNvbGUubG9nKFwiU09MIGluIGF1dGhvcml0eSBhY2NvdW50OlwiLCBhdXRob3JpdHlTb2xCYWxhbmNlIC8gYW5jaG9yLndlYjMuTEFNUE9SVFNfUEVSX1NPTCk7XG4gICAgXG4gICAgLy8gR2V0IGN1cnJlbnQgc3RhZ2UgaW5mb3JtYXRpb25cbiAgICBjb25zb2xlLmxvZyhcIkN1cnJlbnQgc3RhZ2U6XCIsIHByZXNhbGVTdGF0ZUFjY291bnQuY3VycmVudFN0YWdlKTtcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgdGltZSByZW1haW5pbmdcbiAgICBjb25zdCBjdXJyZW50VGltZSA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xuICAgIGNvbnN0IHRpbWVSZW1haW5pbmcgPSBwcmVzYWxlU3RhdGVBY2NvdW50LmVuZFRpbWUudG9OdW1iZXIoKSAtIGN1cnJlbnRUaW1lO1xuICAgIGNvbnN0IGRheXNSZW1haW5pbmcgPSBNYXRoLmZsb29yKHRpbWVSZW1haW5pbmcgLyAoMjQgKiA2MCAqIDYwKSk7XG4gICAgY29uc3QgaG91cnNSZW1haW5pbmcgPSBNYXRoLmZsb29yKCh0aW1lUmVtYWluaW5nICUgKDI0ICogNjAgKiA2MCkpIC8gKDYwICogNjApKTtcbiAgICBjb25zb2xlLmxvZyhcIlRpbWUgcmVtYWluaW5nOlwiLCBkYXlzUmVtYWluaW5nLCBcImRheXMsXCIsIGhvdXJzUmVtYWluaW5nLCBcImhvdXJzXCIpO1xuICAgIFxuICAgIC8vIENoZWNrIGlmIHByZXNhbGUgaXMgZmluYWxpemVkXG4gICAgY29uc29sZS5sb2coXCJQcmVzYWxlIGZpbmFsaXplZDpcIiwgcHJlc2FsZVN0YXRlQWNjb3VudC5pc0ZpbmFsaXplZCk7XG4gICAgY29uc29sZS5sb2coXCI9PT0gRU5EIE9GIFNUQVRJU1RJQ1MgPT09XFxuXCIpO1xuICAgIFxuICAgIC8vIEFzc2VydCB0aGF0IHdlIGhhdmUgdGhlIGV4cGVjdGVkIGRhdGFcbiAgICBhc3NlcnQuaXNEZWZpbmVkKHByZXNhbGVTdGF0ZUFjY291bnQpO1xuICAgIGFzc2VydC5pc0RlZmluZWQocHJlc2FsZVRva2VuQmFsYW5jZSk7XG4gICAgYXNzZXJ0LmlzRGVmaW5lZChwcmVzYWxlU3RhdGVBY2NvdW50LnRva2Vuc1NvbGQpO1xuICAgIGFzc2VydC5pc0RlZmluZWQocHJlc2FsZVN0YXRlQWNjb3VudC51c2RSYWlzZWQpO1xuICAgIGFzc2VydC5pc0RlZmluZWQocHJlc2FsZVN0YXRlQWNjb3VudC5jdXJyZW50U3RhZ2UpO1xuICAgIGFzc2VydC5pc0RlZmluZWQodGltZVJlbWFpbmluZyk7XG4gICAgYXNzZXJ0LmlzRGVmaW5lZChwcmVzYWxlU3RhdGVBY2NvdW50LmlzRmluYWxpemVkKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhcIlRlc3QgcGFzc2VkOiBTdWNjZXNzZnVsbHkgcmV0cmlldmVkIHByZXNhbGUgc3RhdGlzdGljc1wiKTtcbiAgfSk7XG59KTsgIl19