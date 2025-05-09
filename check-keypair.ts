const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync('authority.json', 'utf-8'))));
console.log('Public key:', keypair.publicKey.toString()); 




// 49qgSXPcnH778eUNCto9E3Hn9UoGrniegHy3oviiN5HK6chRK9NBKM986f2NBhQRsK4iDAnoHMFVZ6bfmwfbwd6