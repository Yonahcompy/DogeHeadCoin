import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getProvider, getProgram } from './config';
import { connection, solanaPublicKey } from './wallet';

// Restore the handleSolanaBuy function
const handleSolanaBuy = async (amount: number, referrer?: string) => {
  try {
    const provider = getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const program = getProgram();
    if (!program || !solanaPublicKey) {
      throw new Error('Program or wallet not initialized');
    }

    // Get the transaction record PDA
    const [transactionRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction_record")],
      program.programId
    );

    // Use the authority wallet address as the treasury
    const treasuryWallet = new PublicKey("AyWCnEbpDdVdsweK6MfnML5FpTLQpXAzSin7b7DJnwq3");

    // Check if the transaction record account exists
    const transactionRecordInfo = await connection.getAccountInfo(transactionRecord);
    if (!transactionRecordInfo) {
      throw new Error('Transaction record account not found. Contract may not be initialized.');
    }

    // Parse and validate referrer if provided
    let referrerPubkey: PublicKey | null = null;
    if (referrer) {
      try {
        referrerPubkey = new PublicKey(referrer);
        // Validate that referrer is not the buyer
        if (referrerPubkey.equals(solanaPublicKey)) {
          throw new Error('Referrer cannot be the same as buyer');
        }
      } catch (error) {
        throw new Error('Invalid referrer address');
      }
    }

    // Call the buy instruction with amount and optional referrer
    const tx = await program.methods
      .buy(amount, referrerPubkey) // Pass the referrer pubkey (null if not provided)
      .accounts({
        buyer: solanaPublicKey,
        treasury: treasuryWallet,
        transactionRecord: transactionRecord,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Transaction successful:', tx);
    if (referrerPubkey) {
      console.log('Referrer used:', referrerPubkey.toBase58());
    }

    return tx;
  } catch (error) {
    console.error('Solana buy error:', error);
    throw error;
  }
};