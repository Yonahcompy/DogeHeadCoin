import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import fs from 'fs';

async function main() {
    // Load your keypair from the JSON file
    const keypairFile = fs.readFileSync('keypair.json', 'utf-8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairFile)));

    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Your token mint address (replace with your actual mint address)
    const mintAddress = new PublicKey('YOUR_MINT_ADDRESS_HERE');

    // Get the token account address
    const tokenAddress = await getAssociatedTokenAddress(mintAddress, keypair.publicKey);

    // Create metadata
    const metadata = {
        name: "DHC",
        symbol: "DHC",
        uri: "https://your-metadata-uri.com", // Replace with your metadata URI
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    };

    // Create the metadata instruction
    const instruction = createCreateMetadataAccountV3Instruction(
        {
            metadata: PublicKey.findProgramAddressSync(
                [
                    Buffer.from('metadata'),
                    METADATA_PROGRAM_ID.toBuffer(),
                    mintAddress.toBuffer(),
                ],
                METADATA_PROGRAM_ID
            )[0],
            mint: mintAddress,
            mintAuthority: keypair.publicKey,
            payer: keypair.publicKey,
            updateAuthority: keypair.publicKey,
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
                    creators: metadata.creators,
                    collection: metadata.collection,
                    uses: metadata.uses
                },
                isMutable: true,
                collectionDetails: null
            }
        }
    );

    // Send the transaction
    const transaction = await connection.sendTransaction(
        instruction,
        [keypair],
        { skipPreflight: false }
    );

    console.log('Transaction signature:', transaction);
}

main().catch(console.error); 