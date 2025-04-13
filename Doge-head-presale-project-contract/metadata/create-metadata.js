const { Metaplex } = require("@metaplex-foundation/js");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const fs = require('fs');

async function createTokenMetadata() {
    // Connect to devnet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Load the keypair from new.json
    const keypairFile = fs.readFileSync('../new.json', 'utf-8');
    const secretKey = new Uint8Array(JSON.parse(keypairFile));
    const keypair = Keypair.fromSecretKey(secretKey);
    
    // Initialize Metaplex
    const metaplex = new Metaplex(connection).use({ identity: keypair });
    
    // Token mint address
    const mintAddress = new PublicKey("14En2Sd4EHAXjfRJMmRzWHiX1kFZpZQsCM27K1tqW7jK");
    
    try {
        // Create metadata
        const { nft } = await metaplex.nfts().create({
            uri: "https://arweave.net/your-metadata-uri", // We'll update this after uploading
            name: "DHC",
            symbol: "DHC",
            sellerFeeBasisPoints: 0,
            mintAddress: mintAddress,
            tokenStandard: 0, // Fungible
            updateAuthority: keypair,
        });
        
        console.log("Metadata created successfully!");
        console.log("NFT:", nft);
    } catch (error) {
        console.error("Error creating metadata:", error);
    }
}

createTokenMetadata(); 