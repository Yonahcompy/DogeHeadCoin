import { Keypair } from '@solana/web3.js';
const fs = require('fs');

// Generate a new keypair
const keypair = Keypair.generate();

// Save the keypair to a file
fs.writeFileSync('authority.json', JSON.stringify(Array.from(keypair.secretKey)));

console.log('New keypair created and saved to authority.json');
console.log('Public Key:', keypair.publicKey.toBase58()); 