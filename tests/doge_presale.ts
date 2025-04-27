import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, Connection } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  MINT_SIZE, 
  createInitializeMintInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  createMintToInstruction,
  getMint
} from "@solana/spl-token";
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

  // Store token accounts for later use
  let authorityTokenAccount: PublicKey;
  let presaleTokenAccount: PublicKey;

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
    presaleTokenAccount = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      presaleState.publicKey,
      true
    );

    const startTime = new BN(Math.floor(Date.now() / 1000));
    const endTime = new BN(startTime.toNumber() + 7 * 24 * 60 * 60); // 7 days from now

    // Create and send the combined transaction
    const tx = await program.methods
      .initialize(startTime, endTime)
      .accounts({
        presaleState: presaleState.publicKey,
        tokenMint: tokenMint.publicKey,
        tokenAccount: presaleTokenAccount,
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
    assert.equal(presaleStateAccount.tokenAccount.toString(), presaleTokenAccount.toString());
    assert.equal(presaleStateAccount.startTime.toNumber(), startTime.toNumber());
    assert.equal(presaleStateAccount.endTime.toNumber(), endTime.toNumber());
    assert.equal(presaleStateAccount.currentStage, 0);
    assert.equal(presaleStateAccount.isFinalized, false);

    // Verify the mint is properly initialized
    const mintInfo = await getMint(provider.connection as unknown as Connection, tokenMint.publicKey);
    assert.equal(mintInfo.mintAuthority.toString(), provider.wallet.publicKey.toString());
    assert.equal(mintInfo.decimals, 9);
  });

  it("Can deposit tokens", async () => {
    // Get the authority's associated token account
    authorityTokenAccount = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      provider.wallet.publicKey
    );

    // Get the presale token account
    presaleTokenAccount = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      presaleState.publicKey,
      true // Allow owner off curve
    );

    // Create the authority's token account if it doesn't exist
    try {
      const accountInfo = await provider.connection.getAccountInfo(authorityTokenAccount);
      if (!accountInfo) {
        throw new Error("Account does not exist");
      }
      console.log("Authority token account already exists");
    } catch {
      console.log("Creating authority token account...");
      const createAtaIx = createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        authorityTokenAccount,
        provider.wallet.publicKey,
        tokenMint.publicKey
      );
      const tx = await provider.sendAndConfirm(new anchor.web3.Transaction().add(createAtaIx));
      console.log("Created authority token account:", tx);
    }

    // Create the presale token account if it doesn't exist
    try {
      const accountInfo = await provider.connection.getAccountInfo(presaleTokenAccount);
      if (!accountInfo) {
        throw new Error("Account does not exist");
      }
      console.log("Presale token account already exists");
    } catch {
      console.log("Creating presale token account...");
      const createPresaleAtaIx = createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        presaleTokenAccount,
        presaleState.publicKey,
        tokenMint.publicKey
      );
      const tx = await provider.sendAndConfirm(new anchor.web3.Transaction().add(createPresaleAtaIx));
      console.log("Created presale token account:", tx);
    }

    // Verify mint authority and accounts
    const mintInfo = await getMint(provider.connection as unknown as Connection, tokenMint.publicKey);
    console.log("Mint authority:", mintInfo.mintAuthority?.toString());
    console.log("Expected authority:", provider.wallet.publicKey.toString());
    console.log("Freeze authority:", mintInfo.freezeAuthority?.toString());

    // Verify token accounts exist
    const authorityAccountInfo = await provider.connection.getAccountInfo(authorityTokenAccount);
    const presaleAccountInfo = await provider.connection.getAccountInfo(presaleTokenAccount);
    console.log("Authority account exists:", !!authorityAccountInfo);
    console.log("Presale account exists:", !!presaleAccountInfo);

    // Mint a small amount of tokens to test
    const mintAmount = new BN(1).mul(new BN(10).pow(new BN(9))); // 1 token with 9 decimals
    const mintToIx = createMintToInstruction(
      tokenMint.publicKey,
      authorityTokenAccount,
      provider.wallet.publicKey,
      Number(mintAmount.toString()) // Use Number for small amounts
    );

    console.log("Minting tokens...");
    const mintTx = await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(mintToIx)
    );
    console.log("Minted tokens to authority:", mintTx);

    // Verify the tokens were minted
    const authorityBalance = await provider.connection.getTokenAccountBalance(authorityTokenAccount);
    console.log("Authority token balance:", authorityBalance.value.amount);
    assert.equal(authorityBalance.value.amount, mintAmount.toString());

    // Deposit tokens to the presale
    const depositAmount = new BN(0.5).mul(new BN(10).pow(new BN(9))); // 0.5 tokens
    console.log("Depositing tokens...");
    const depositTx = await program.methods
      .depositTokens(depositAmount)
      .accounts({
        authority: provider.wallet.publicKey,
        presaleState: presaleState.publicKey,
        authorityTokenAccount: authorityTokenAccount,
        presaleTokenAccount: presaleTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Deposit transaction signature:", depositTx);

    // Verify the deposit
    const presaleTokenAccountInfo = await provider.connection.getTokenAccountBalance(presaleTokenAccount);
    assert.equal(presaleTokenAccountInfo.value.amount, depositAmount.toString());
  });
}); 