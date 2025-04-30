import { Connection, PublicKey } from '@solana/web3.js';

// Replace with your RPC endpoint
export const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// This will be set when the wallet is connected
export let solanaPublicKey: PublicKey | null = null;

export const setSolanaPublicKey = (pubkey: PublicKey | null) => {
  solanaPublicKey = pubkey;
}; 