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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = require("bn.js");
const spl_token_1 = require("@solana/spl-token");
// Import admin keypair
const admin_json_1 = __importDefault(require("../tests/wallets/admin.json"));
async function main() {
    // Configure the client to use the devnet cluster
    const connection = new web3_js_1.Connection("https://api.devnet.solana.com", "confirmed");
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(web3_js_1.Keypair.fromSecretKey(Uint8Array.from(admin_json_1.default))), { commitment: "confirmed" });
    anchor.setProvider(provider);
    const program = anchor.workspace.PalmPresale;
    const PROGRAM_ID = program.programId;
    // Configure the constants
    const PRESALE_SEED = "PRESALE_SEED";
    const USER_SEED = "USER_SEED";
    const PRESALE_VAULT = "PRESALE_VAULT";
    // Set admin
    const admin = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(admin_json_1.default));
    console.log("Admin address:", admin.publicKey.toBase58());
    // Get PDAs
    const [presalePDA] = await web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(PRESALE_SEED)], PROGRAM_ID);
    const [vaultPDA] = await web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(PRESALE_VAULT)], PROGRAM_ID);
    // Presale settings
    const softCapAmount = new bn_js_1.BN(300000);
    const hardCapAmount = new bn_js_1.BN(500000);
    const maxTokenAmountPerAddress = new bn_js_1.BN(1000);
    const pricePerToken = new bn_js_1.BN(100);
    const startTime = new bn_js_1.BN(Date.now());
    const presaleDuration = new bn_js_1.BN(5000);
    const endTime = startTime.add(presaleDuration);
    // Token settings
    const tokenDecimal = 9;
    const presaleAmount = new bn_js_1.BN(300000000).mul(new bn_js_1.BN(10 ** tokenDecimal));
    // Get the token mint from your deployed token
    const tokenMint = new web3_js_1.PublicKey("mntPPX7vem9xnqVAwpyt1VmdqEDTmmzhZeCDxSUHgBV");
    // Get admin's token account
    const adminAta = await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, admin, tokenMint, admin.publicKey);
    console.log("Initializing presale...");
    console.log("Presale PDA:", presalePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());
    console.log("Token Mint:", tokenMint.toBase58());
    console.log("Admin ATA:", adminAta.address.toBase58());
    try {
        const tx = await program.methods
            .createPresale(softCapAmount, hardCapAmount, maxTokenAmountPerAddress, pricePerToken, startTime, endTime, presaleAmount)
            .accounts({
            presaleInfo: presalePDA,
            presaleVault: vaultPDA,
            tokenMint: tokenMint,
            admin: admin.publicKey,
            adminTokenAccount: adminAta.address,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .signers([admin])
            .rpc();
        console.log("Presale initialized successfully!");
        console.log("Transaction signature:", tx);
    }
    catch (error) {
        console.error("Error initializing presale:", error);
    }
}
main().then(() => process.exit(0), (err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbGl6ZS1wcmVzYWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc2NyaXB0cy9pbml0aWFsaXplLXByZXNhbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwREFBNEM7QUFHNUMsNkNBTXlCO0FBQ3pCLGlDQUEyQjtBQUMzQixpREFJMkI7QUFFM0IsdUJBQXVCO0FBQ3ZCLDZFQUEyRDtBQUUzRCxLQUFLLFVBQVUsSUFBSTtJQUNqQixpREFBaUQ7SUFDakQsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBVSxDQUFDLCtCQUErQixFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2hGLE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FDeEMsVUFBVSxFQUNWLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLG9CQUFnQixDQUFDLENBQUMsQ0FBQyxFQUMzRSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FDNUIsQ0FBQztJQUNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFN0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFtQyxDQUFDO0lBQ3JFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFFckMsMEJBQTBCO0lBQzFCLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQztJQUNwQyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUM7SUFDOUIsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0lBRXRDLFlBQVk7SUFDWixNQUFNLEtBQUssR0FBRyxpQkFBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLG9CQUFnQixDQUFDLENBQUMsQ0FBQztJQUN2RSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixF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QUcsQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdEQsQ0FBQztBQUNILENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQ1QsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDckIsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuY2hvciBmcm9tIFwiQGNvcmFsLXh5ei9hbmNob3JcIjtcbmltcG9ydCB7IFByb2dyYW0gfSBmcm9tIFwiQGNvcmFsLXh5ei9hbmNob3JcIjtcbmltcG9ydCB7IFBhbG1QcmVzYWxlIH0gZnJvbSBcIi4uL3RhcmdldC90eXBlcy9wYWxtX3ByZXNhbGVcIjtcbmltcG9ydCB7XG4gIFB1YmxpY0tleSxcbiAgQ29ubmVjdGlvbixcbiAgS2V5cGFpcixcbiAgTEFNUE9SVFNfUEVSX1NPTCxcbiAgU3lzdGVtUHJvZ3JhbSxcbn0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuaW1wb3J0IHsgQk4gfSBmcm9tIFwiYm4uanNcIjtcbmltcG9ydCB7XG4gIFRPS0VOX1BST0dSQU1fSUQsXG4gIGdldEFzc29jaWF0ZWRUb2tlbkFkZHJlc3MsXG4gIGdldE9yQ3JlYXRlQXNzb2NpYXRlZFRva2VuQWNjb3VudCxcbn0gZnJvbSBcIkBzb2xhbmEvc3BsLXRva2VuXCI7XG5cbi8vIEltcG9ydCBhZG1pbiBrZXlwYWlyXG5pbXBvcnQgYWRtaW5TZWNyZXRBcnJheSBmcm9tIFwiLi4vdGVzdHMvd2FsbGV0cy9hZG1pbi5qc29uXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIC8vIENvbmZpZ3VyZSB0aGUgY2xpZW50IHRvIHVzZSB0aGUgZGV2bmV0IGNsdXN0ZXJcbiAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKFwiaHR0cHM6Ly9hcGkuZGV2bmV0LnNvbGFuYS5jb21cIiwgXCJjb25maXJtZWRcIik7XG4gIGNvbnN0IHByb3ZpZGVyID0gbmV3IGFuY2hvci5BbmNob3JQcm92aWRlcihcbiAgICBjb25uZWN0aW9uLFxuICAgIG5ldyBhbmNob3IuV2FsbGV0KEtleXBhaXIuZnJvbVNlY3JldEtleShVaW50OEFycmF5LmZyb20oYWRtaW5TZWNyZXRBcnJheSkpKSxcbiAgICB7IGNvbW1pdG1lbnQ6IFwiY29uZmlybWVkXCIgfVxuICApO1xuICBhbmNob3Iuc2V0UHJvdmlkZXIocHJvdmlkZXIpO1xuXG4gIGNvbnN0IHByb2dyYW0gPSBhbmNob3Iud29ya3NwYWNlLlBhbG1QcmVzYWxlIGFzIFByb2dyYW08UGFsbVByZXNhbGU+O1xuICBjb25zdCBQUk9HUkFNX0lEID0gcHJvZ3JhbS5wcm9ncmFtSWQ7XG5cbiAgLy8gQ29uZmlndXJlIHRoZSBjb25zdGFudHNcbiAgY29uc3QgUFJFU0FMRV9TRUVEID0gXCJQUkVTQUxFX1NFRURcIjtcbiAgY29uc3QgVVNFUl9TRUVEID0gXCJVU0VSX1NFRURcIjtcbiAgY29uc3QgUFJFU0FMRV9WQVVMVCA9IFwiUFJFU0FMRV9WQVVMVFwiO1xuXG4gIC8vIFNldCBhZG1pblxuICBjb25zdCBhZG1pbiA9IEtleXBhaXIuZnJvbVNlY3JldEtleShVaW50OEFycmF5LmZyb20oYWRtaW5TZWNyZXRBcnJheSkpO1xuICBjb25zb2xlLmxvZyhcIkFkbWluIGFkZHJlc3M6XCIsIGFkbWluLnB1YmxpY0tleS50b0Jhc2U1OCgpKTtcblxuICAvLyBHZXQgUERBc1xuICBjb25zdCBbcHJlc2FsZVBEQV0gPSBhd2FpdCBQdWJsaWNLZXkuZmluZFByb2dyYW1BZGRyZXNzU3luYyhcbiAgICBbQnVmZmVyLmZyb20oUFJFU0FMRV9TRUVEKV0sXG4gICAgUFJPR1JBTV9JRFxuICApO1xuICBjb25zdCBbdmF1bHRQREFdID0gYXdhaXQgUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzc1N5bmMoXG4gICAgW0J1ZmZlci5mcm9tKFBSRVNBTEVfVkFVTFQpXSxcbiAgICBQUk9HUkFNX0lEXG4gICk7XG5cbiAgLy8gUHJlc2FsZSBzZXR0aW5nc1xuICBjb25zdCBzb2Z0Q2FwQW1vdW50ID0gbmV3IEJOKDMwMDAwMCk7XG4gIGNvbnN0IGhhcmRDYXBBbW91bnQgPSBuZXcgQk4oNTAwMDAwKTtcbiAgY29uc3QgbWF4VG9rZW5BbW91bnRQZXJBZGRyZXNzID0gbmV3IEJOKDEwMDApO1xuICBjb25zdCBwcmljZVBlclRva2VuID0gbmV3IEJOKDEwMCk7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBCTihEYXRlLm5vdygpKTtcbiAgY29uc3QgcHJlc2FsZUR1cmF0aW9uID0gbmV3IEJOKDUwMDApO1xuICBjb25zdCBlbmRUaW1lID0gc3RhcnRUaW1lLmFkZChwcmVzYWxlRHVyYXRpb24pO1xuXG4gIC8vIFRva2VuIHNldHRpbmdzXG4gIGNvbnN0IHRva2VuRGVjaW1hbCA9IDk7XG4gIGNvbnN0IHByZXNhbGVBbW91bnQgPSBuZXcgQk4oMzAwMDAwMDAwKS5tdWwobmV3IEJOKDEwICoqIHRva2VuRGVjaW1hbCkpO1xuXG4gIC8vIEdldCB0aGUgdG9rZW4gbWludCBmcm9tIHlvdXIgZGVwbG95ZWQgdG9rZW5cbiAgY29uc3QgdG9rZW5NaW50ID0gbmV3IFB1YmxpY0tleShcIm1udFBQWDd2ZW05eG5xVkF3cHl0MVZtZHFFRFRtbXpoWmVDRHhTVUhnQlZcIik7XG4gIFxuICAvLyBHZXQgYWRtaW4ncyB0b2tlbiBhY2NvdW50XG4gIGNvbnN0IGFkbWluQXRhID0gYXdhaXQgZ2V0T3JDcmVhdGVBc3NvY2lhdGVkVG9rZW5BY2NvdW50KFxuICAgIGNvbm5lY3Rpb24sXG4gICAgYWRtaW4sXG4gICAgdG9rZW5NaW50LFxuICAgIGFkbWluLnB1YmxpY0tleVxuICApO1xuXG4gIGNvbnNvbGUubG9nKFwiSW5pdGlhbGl6aW5nIHByZXNhbGUuLi5cIik7XG4gIGNvbnNvbGUubG9nKFwiUHJlc2FsZSBQREE6XCIsIHByZXNhbGVQREEudG9CYXNlNTgoKSk7XG4gIGNvbnNvbGUubG9nKFwiVmF1bHQgUERBOlwiLCB2YXVsdFBEQS50b0Jhc2U1OCgpKTtcbiAgY29uc29sZS5sb2coXCJUb2tlbiBNaW50OlwiLCB0b2tlbk1pbnQudG9CYXNlNTgoKSk7XG4gIGNvbnNvbGUubG9nKFwiQWRtaW4gQVRBOlwiLCBhZG1pbkF0YS5hZGRyZXNzLnRvQmFzZTU4KCkpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgdHggPSBhd2FpdCBwcm9ncmFtLm1ldGhvZHNcbiAgICAgIC5jcmVhdGVQcmVzYWxlKFxuICAgICAgICBzb2Z0Q2FwQW1vdW50LFxuICAgICAgICBoYXJkQ2FwQW1vdW50LFxuICAgICAgICBtYXhUb2tlbkFtb3VudFBlckFkZHJlc3MsXG4gICAgICAgIHByaWNlUGVyVG9rZW4sXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZW5kVGltZSxcbiAgICAgICAgcHJlc2FsZUFtb3VudFxuICAgICAgKVxuICAgICAgLmFjY291bnRzKHtcbiAgICAgICAgcHJlc2FsZUluZm86IHByZXNhbGVQREEsXG4gICAgICAgIHByZXNhbGVWYXVsdDogdmF1bHRQREEsXG4gICAgICAgIHRva2VuTWludDogdG9rZW5NaW50LFxuICAgICAgICBhZG1pbjogYWRtaW4ucHVibGljS2V5LFxuICAgICAgICBhZG1pblRva2VuQWNjb3VudDogYWRtaW5BdGEuYWRkcmVzcyxcbiAgICAgICAgc3lzdGVtUHJvZ3JhbTogU3lzdGVtUHJvZ3JhbS5wcm9ncmFtSWQsXG4gICAgICAgIHRva2VuUHJvZ3JhbTogVE9LRU5fUFJPR1JBTV9JRCxcbiAgICAgIH0pXG4gICAgICAuc2lnbmVycyhbYWRtaW5dKVxuICAgICAgLnJwYygpO1xuXG4gICAgY29uc29sZS5sb2coXCJQcmVzYWxlIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseSFcIik7XG4gICAgY29uc29sZS5sb2coXCJUcmFuc2FjdGlvbiBzaWduYXR1cmU6XCIsIHR4KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW5pdGlhbGl6aW5nIHByZXNhbGU6XCIsIGVycm9yKTtcbiAgfVxufVxuXG5tYWluKCkudGhlbihcbiAgKCkgPT4gcHJvY2Vzcy5leGl0KDApLFxuICAoZXJyKSA9PiB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxuKTsgIl19