const { ethers } = require('ethers');
require('dotenv').config();
const contractABI = require("./abi.json");

// Configuration
const CONFIG = {
    CONTRACT_ADDRESS: '0xFd4F1819456f71d92369aC87aA6ee6F75052CC7e',
    HISTORICAL_BLOCKS: 1000,
    WS_URL: `wss://bnb-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
};

// Event formatter
class EventFormatter {
    static formatEvent(event, args) {
        return {
            transaction: event.transactionHash,
            block: event.blockNumber,
            payer: args.payer,
            bnbAmount: ethers.utils.formatEther(args.bnbAmount),
            usdAmount: ethers.utils.formatUnits(args.usdAmount, 8),
            solanaWallet: args.solanaWallet,
            timestamp: new Date(args.timestamp * 1000).toISOString()
        };
    }

    static displayEvent(eventData) {
        console.log('\nPaymentReceived Event:');
        console.log('=====================');
        console.log(`Transaction: ${eventData.transaction}`);
        console.log(`Block: ${eventData.block}`);
        console.log(`Payer: ${eventData.payer}`);
        console.log(`BNB Amount: ${eventData.bnbAmount} BNB`);
        console.log(`USD Amount: $${eventData.usdAmount}`);
        console.log(`Solana Wallet: ${eventData.solanaWallet}`);
        console.log(`Time: ${eventData.timestamp}`);
        console.log('=====================');
    }

    static async callSolanaContract(eventData) {
        try {
            // Import required Solana dependencies
            const { Connection, PublicKey, Transaction, SystemProgram, Keypair } = require('@solana/web3.js');
            const { Program } = require('@project-serum/anchor');
            const idl = require('./solanaidl.json');
            const bs58 = require('bs58');

            // Initialize connection to Solana network.
            const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

            // Load the program
            const programId = new PublicKey(idl.metadata.address);
            const program = new Program(idl, programId, { connection });

            // Convert private key to keypair
            const privateKey = process.env.SOLANA_SIGNER_PRIVATE_KEY;
            const secretKey = bs58.decode(privateKey);
            const keypair = Keypair.fromSecretKey(secretKey);

            // Convert USD amount to f64 (assuming eventData.usdAmount is in USD)
            const usdAmount = parseFloat(eventData.usdAmount);

            // Convert Solana wallet address to PublicKey
            const buyerAddress = new PublicKey(eventData.solanaWallet);
            // Get the transaction record account
            const [transactionRecord] = PublicKey.findProgramAddressSync(
                [Buffer.from('transaction_record')],
                programId
            );

            // Create the recordPurchase instruction
            const tx = await program.methods
                .authorityBuy(
                    usdAmount,
                    buyerAddress
                )
                .accounts({
                    authority: keypair.publicKey,
                    transactionRecord: transactionRecord,
                })
                .transaction();

            // Sign and send the transaction
            const signature = await connection.sendTransaction(tx, [keypair]);

            console.log('Solana transaction sent:', signature);
            return signature;
        } catch (error) {
            console.error('Error calling Solana contract:', error);
            throw error;
        }
    }
}

// WebSocket event handler
class WebSocketHandler {
    constructor(provider) {
        this.provider = provider;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.provider._websocket.on('open', () => {
            console.log('WebSocket connection established');
        });

        this.provider._websocket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        this.provider._websocket.on('close', () => {
            console.log('WebSocket connection closed');
        });
    }

    async close() {
        await this.provider._websocket.close();
    }
}

// Contract event handler
class ContractEventHandler {
    constructor(contract) {
        this.contract = contract;
    }

    async fetchHistoricalEvents(fromBlock, toBlock) {
        console.log(`\nFetching historical events from blocks ${fromBlock} to ${toBlock}...`);
        const events = await this.contract.queryFilter('PaymentReceived', fromBlock, toBlock);

        if (events.length > 0) {
            console.log(`Found ${events.length} historical events:`);
            events.forEach(event => {
                const formattedEvent = EventFormatter.formatEvent(event, event.args);
                // this is where we see all the past event histories
            });
        } else {
            console.log('No historical events found in the specified block range.');
        }
    }

    setupEventListener() {
        console.log('\nNow listening for new PaymentReceived events...........');
        this.contract.on('PaymentReceived', (solanaWallet, payer, bnbAmount, usdAmount, timestamp, event) => {
            const formattedEvent = EventFormatter.formatEvent(event, {
                solanaWallet, payer, bnbAmount, usdAmount, timestamp
            });
            // EventFormatter.displayEvent(formattedEvent);
            EventFormatter.callSolanaContract(formattedEvent);
        });
    }
}

// Main application class
class PaymentEventMonitor {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.wsHandler = null;
        this.eventHandler = null;
    }

    async initialize() {
        if (!process.env.ALCHEMY_API_KEY) {
            throw new Error('ALCHEMY_API_KEY is required in .env file');
        }

        this.provider = new ethers.providers.WebSocketProvider(CONFIG.WS_URL);
        this.wsHandler = new WebSocketHandler(this.provider);

        const network = await this.provider.getNetwork();
        console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);

        this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, contractABI, this.provider);
        this.eventHandler = new ContractEventHandler(this.contract);
    }

    async start() {
        try {
            await this.initialize();

            const currentBlock = await this.provider.getBlockNumber();
            console.log(`Current block: ${currentBlock}`);

            const fromBlock = currentBlock - CONFIG.HISTORICAL_BLOCKS;
            await this.eventHandler.fetchHistoricalEvents(fromBlock, currentBlock);
            this.eventHandler.setupEventListener();

            // Setup graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\nClosing WebSocket connection...');
                await this.wsHandler.close();
                process.exit(0);
            });

        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
}

// Start the application
const monitor = new PaymentEventMonitor();
monitor.start().catch(console.error);