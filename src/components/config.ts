import { AnchorProvider, Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { DogePresale } from '../target/types/doge_presale';
import { connection } from './wallet';

// Program ID from your deployment
const PROGRAM_ID = new PublicKey("6LsqC27EVwj4RXcfxpf8WnUhGaB3tqEkXMxBwbxunzAq");

let provider: AnchorProvider | null = null;
let program: Program<DogePresale> | null = null;

export const getProvider = () => {
  if (!provider) {
    throw new Error('Provider not initialized. Call initializeProvider first.');
  }
  return provider;
};

export const getProgram = () => {
  if (!program) {
    throw new Error('Program not initialized. Call initializeProvider first.');
  }
  return program;
};

export const initializeProvider = (wallet: any) => {
  provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: 'processed',
  });
  
  program = new Program<DogePresale>(
    require('../target/idl/doge_presale.json'),
    PROGRAM_ID,
    provider
  );
  
  return { provider, program };
}; 