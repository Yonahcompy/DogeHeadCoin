import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, MINT_SIZE, createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import { DogePresale } from "../target/types/doge_presale";
import { BN } from "bn.js";

describe("doge-presale", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DogePresale as Program<DogePresale>;
  
  // Generate a new keypair for the presale state account
  const presaleState = Keypair.generate();
  
  // Generate a new keypair for the token mint
  const tokenMint = Keypair.generate();

  it("Is initialized!", async () => {
    // Create token mint account
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: tokenMint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    });

    // Initialize mint
    const initializeMintIx = createInitializeMintInstruction(
      tokenMint.publicKey,
      9, // decimals
      provider.wallet.publicKey,
      provider.wallet.publicKey,
    );

    // Get the associated token account for the presale
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      presaleState.publicKey,
      true
    );

    const startTime = new BN(Math.floor(Date.now() / 1000));
    const endTime = new BN(startTime.toNumber() + 7 * 24 * 60 * 60); // 7 days from now

    const tx = await program.methods
      .initialize(startTime, endTime)
      .accounts({
        presaleState: presaleState.publicKey,
        tokenMint: tokenMint.publicKey,
        tokenAccount: tokenAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .preInstructions([createMintAccountIx, initializeMintIx])
      .signers([presaleState, tokenMint])
      .rpc();

    console.log("Your transaction signature", tx);

    // Verify the presale state
    const presaleStateAccount = await program.account.presaleState.fetch(presaleState.publicKey);
    assert.equal(presaleStateAccount.authority.toString(), provider.wallet.publicKey.toString());
    assert.equal(presaleStateAccount.tokenMint.toString(), tokenMint.publicKey.toString());
    assert.equal(presaleStateAccount.tokenAccount.toString(), tokenAccount.toString());
    assert.equal(presaleStateAccount.startTime.toNumber(), startTime.toNumber());
    assert.equal(presaleStateAccount.endTime.toNumber(), endTime.toNumber());
    assert.equal(presaleStateAccount.currentStage, 0);
    assert.equal(presaleStateAccount.isFinalized, false);
  });
}); 