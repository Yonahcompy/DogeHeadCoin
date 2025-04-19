import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PalmPresale } from "../target/types/palm_presale";
import {
  PublicKey,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

// Import admin keypair
import adminSecretArray from "../tests/wallets/admin.json";

async function main() {
  // Configure the client to use the devnet cluster
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(Keypair.fromSecretKey(Uint8Array.from(adminSecretArray))),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.PalmPresale as Program<PalmPresale>;
  const PROGRAM_ID = program.programId;

  // Configure the constants
  const PRESALE_SEED = "PRESALE_SEED";
  const USER_SEED = "USER_SEED";
  const PRESALE_VAULT = "PRESALE_VAULT";

  // Set admin
  const admin = Keypair.fromSecretKey(Uint8Array.from(adminSecretArray));
  console.log("Admin address:", admin.publicKey.toBase58());

  // Get PDAs
  const [presalePDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from(PRESALE_SEED)],
    PROGRAM_ID
  );
  const [vaultPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from(PRESALE_VAULT)],
    PROGRAM_ID
  );

  // Presale settings
  const softCapAmount = new BN(300000);
  const hardCapAmount = new BN(500000);
  const maxTokenAmountPerAddress = new BN(1000);
  const pricePerToken = new BN(100);
  const startTime = new BN(Date.now());
  const presaleDuration = new BN(5000);
  const endTime = startTime.add(presaleDuration);

  // Token settings
  const tokenDecimal = 9;
  const presaleAmount = new BN(300000000).mul(new BN(10 ** tokenDecimal));

  // Get the token mint from your deployed token
  const tokenMint = new PublicKey("mntPPX7vem9xnqVAwpyt1VmdqEDTmmzhZeCDxSUHgBV");
  
  // Get admin's token account
  const adminAta = await getOrCreateAssociatedTokenAccount(
    connection,
    admin,
    tokenMint,
    admin.publicKey
  );

  console.log("Initializing presale...");
  console.log("Presale PDA:", presalePDA.toBase58());
  console.log("Vault PDA:", vaultPDA.toBase58());
  console.log("Token Mint:", tokenMint.toBase58());
  console.log("Admin ATA:", adminAta.address.toBase58());

  try {
    const tx = await program.methods
      .createPresale(
        softCapAmount,
        hardCapAmount,
        maxTokenAmountPerAddress,
        pricePerToken,
        startTime,
        endTime,
        presaleAmount
      )
      .accounts({
        presaleInfo: presalePDA,
        presaleVault: vaultPDA,
        tokenMint: tokenMint,
        admin: admin.publicKey,
        adminTokenAccount: adminAta.address,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    console.log("Presale initialized successfully!");
    console.log("Transaction signature:", tx);
  } catch (error) {
    console.error("Error initializing presale:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
); 