"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiChainPresale = void 0;
const react_1 = require("react");
const wallet_adapter_react_1 = require("@solana/wallet-adapter-react");
const wagmi_1 = require("wagmi");
const wagmi_2 = require("wagmi");
const react_toastify_1 = require("react-toastify");
require("react-toastify/dist/ReactToastify.css");
const MultiChainPresale_module_css_1 = __importDefault(require("../styles/MultiChainPresale.module.css"));
const baseEth_1 = require("../contracts/baseEth");
const bscContract_1 = require("../contracts/bscContract");
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const solanaIdl_1 = require("../contracts/solanaIdl");
const react_2 = __importDefault(require("react"));
// Chain IDs
const CHAIN_IDS = {
    BASE_ETH: 84532, // Base Sepolia
    POLYGON_TESTNET: 80001, // Mumbai
    BSC_TESTNET: 97, // BSC Testnet
    SOLANA: 'solana', // Solana Devnet
};
// Payment options
const PAYMENT_OPTIONS = [
    {
        id: 'solana',
        name: 'Solana (Devnet)',
        chainId: CHAIN_IDS.SOLANA,
        icon: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
        isDisabled: false
    },
    {
        id: 'base',
        name: 'Base ETH (Sepolia)',
        chainId: CHAIN_IDS.BASE_ETH,
        icon: 'https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-6278326_1280.png',
        isDisabled: false
    },
    {
        id: 'polygon',
        name: 'Polygon (Mumbai)',
        chainId: CHAIN_IDS.POLYGON_TESTNET,
        icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFI4axCrJbxy8fjqJhZEu_DXCHYAqXjSICXg&s',
        isDisabled: true
    },
    {
        id: 'bsc',
        name: 'BSC (Testnet)',
        chainId: CHAIN_IDS.BSC_TESTNET,
        icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP9cUvoCvmCXO4pNHvnREHBCKW30U-BVxKfg&s',
        isDisabled: false
    },
];
// Custom toast styles
const toastStyles = {
    style: {
        background: '#1a1a1a',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    progressStyle: {
        background: 'linear-gradient(to right, #4a90e2, #50e3c2)',
    },
};
// Presale stages data
const presaleStages = [
    { stage: 1, availableTokens: 750000000, pricePerToken: 0.0001 },
    { stage: 2, availableTokens: 600000000, pricePerToken: 0.00033 },
    { stage: 3, availableTokens: 450000000, pricePerToken: 0.000957 },
    { stage: 4, availableTokens: 600000000, pricePerToken: 0.00202 },
    { stage: 5, availableTokens: 600000000, pricePerToken: 0.00313 },
];
const MultiChainPresale = () => {
    // Solana wallet state
    const { connected: solanaConnected, publicKey: solanaPublicKey, connecting: solanaConnecting, disconnect: disconnectSolana } = (0, wallet_adapter_react_1.useWallet)();
    // EVM wallet state - using existing w3m connections
    const { address: evmAddress, isConnected: evmConnected } = (0, wagmi_1.useAccount)();
    const { chain } = (0, wagmi_1.useNetwork)();
    const { switchNetwork } = (0, wagmi_1.useSwitchNetwork)();
    // Presale state
    const [selectedPaymentChain, setSelectedPaymentChain] = (0, react_1.useState)(null);
    const [amount, setAmount] = (0, react_1.useState)('');
    const [tokensToReceive, setTokensToReceive] = (0, react_1.useState)('0');
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [currentStage, setCurrentStage] = (0, react_1.useState)(0); // Default to stage 1
    const stageData = presaleStages.find(s => s.stage === currentStage);
    // Add these state variables near your other state declarations
    const [totalUsdSold, setTotalUsdSold] = (0, react_1.useState)(0);
    const [totalTokensSold, setTotalTokensSold] = (0, react_1.useState)(0);
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    // Move hooks to component level
    const publicClient = (0, wagmi_2.usePublicClient)();
    const { data: walletClient } = (0, wagmi_2.useWalletClient)();
    const [provider, setProvider] = (0, react_1.useState)(null);
    // Add utility function to format token amounts
    const formatTokenAmount = (amount) => {
        // Convert from 9 decimals to a readable number
        const formattedAmount = amount / 1e9;
        return formattedAmount.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        });
    };
    // Add utility function to format SOL amounts
    const formatSolAmount = (amount) => {
        // Convert from lamports (9 decimals) to SOL
        const formattedAmount = amount / 1e9;
        return formattedAmount.toLocaleString(undefined, {
            maximumFractionDigits: 4,
            minimumFractionDigits: 2
        });
    };
    // Calculate tokens to receive based on amount and current stage
    (0, react_1.useEffect)(() => {
        if (amount && !isNaN(Number(amount)) && currentStage > 0) {
            const currentStageData = presaleStages.find(s => s.stage === currentStage);
            if (currentStageData) {
                // Calculate tokens based on USD amount and current stage price
                const tokens = Number(amount) / currentStageData.pricePerToken;
                setTokensToReceive(tokens.toLocaleString(undefined, { maximumFractionDigits: 2 }));
            }
            else {
                setTokensToReceive('0');
            }
        }
        else {
            setTokensToReceive('0');
        }
    }, [amount, currentStage]);
    // Add function to get current stage info
    const getCurrentStageInfo = () => {
        return presaleStages.find(s => s.stage === currentStage) || presaleStages[0];
    };
    // Add function to format price
    const formatPrice = (price) => {
        return price.toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        });
    };
    // Handle payment chain selection
    const handlePaymentChainSelect = (chainId) => {
        const selectedOption = PAYMENT_OPTIONS.find(option => option.id === chainId);
        if (selectedOption?.isDisabled) {
            react_toastify_1.toast.error('This payment option is currently disabled', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            return;
        }
        setSelectedPaymentChain(chainId);
        // Switch to the selected network if needed (only for EVM chains)
        if (chainId !== 'solana') {
            const chainIdNum = PAYMENT_OPTIONS.find(option => option.id === chainId)?.chainId;
            if (chainIdNum && chain?.id !== chainIdNum && switchNetwork) {
                switchNetwork(chainIdNum);
            }
        }
    };
    const { connection } = (0, wallet_adapter_react_1.useConnection)();
    // Get Anchor provider
    const getProvider = (0, react_1.useCallback)(() => {
        if (!solanaPublicKey || !connection)
            return null;
        const wallet = {
            publicKey: solanaPublicKey,
            signTransaction: window.solana?.signTransaction,
            signAllTransactions: window.solana?.signAllTransactions,
        };
        const provider = new anchor_1.AnchorProvider(connection, wallet, { commitment: 'processed' });
        // Set the provider globally
        setProvider(provider);
        return provider;
    }, [connection, solanaPublicKey]);
    // Get program instance
    const getProgram = (0, react_1.useCallback)(() => {
        const provider = getProvider();
        if (!provider)
            return null;
        // Create a proper PublicKey object for the program ID
        const programId = new web3_js_1.PublicKey("7pFUVAWGA8KzhZvDz5GRYi8JVkshrcHYbVYCBwZnBkJG");
        // Pass the programId as the second parameter
        return new anchor_1.Program(solanaIdl_1.IDL, programId, provider);
    }, [getProvider]);
    // Presale state
    const [isInitialized, setIsInitialized] = (0, react_1.useState)(false);
    const [isAdmin, setIsAdmin] = (0, react_1.useState)(false);
    // Check if the contract is initialized
    const checkInitialization = (0, react_1.useCallback)(async () => {
        if (!solanaConnected || !solanaPublicKey)
            return;
        try {
            const program = getProgram();
            if (!program)
                return;
            // Get the transaction record PDA
            const [transactionRecord] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("transaction_record")], program.programId);
            // Try to fetch the account using a more generic approach
            try {
                // Use the connection directly to check if the account exists
                const accountInfo = await connection.getAccountInfo(transactionRecord);
                const isInitialized = !!accountInfo;
                setIsInitialized(isInitialized);
                if (isInitialized) {
                    // If the account exists, we'll assume the current user is the admin for now
                    // In a production app, you would want to properly decode the account data
                    setIsAdmin(true);
                }
            }
            catch (error) {
                console.error('Error fetching account:', error);
                setIsInitialized(false);
            }
        }
        catch (error) {
            console.error('Error checking initialization:', error);
            setIsInitialized(false);
        }
    }, [solanaConnected, solanaPublicKey, getProgram, connection]);
    // Initialize the contract
    const handleInitialize = async () => {
        if (!solanaConnected || !solanaPublicKey) {
            react_toastify_1.toast.error('Please connect your Solana wallet first', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            return;
        }
        setIsProcessing(true);
        react_toastify_1.toast.info('Initializing contract...', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
        });
        try {
            const provider = getProvider();
            if (!provider) {
                throw new Error('Provider not initialized');
            }
            const program = getProgram();
            if (!program || !solanaPublicKey) {
                throw new Error('Program or wallet not initialized');
            }
            const [transactionRecord] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("transaction_record")], program.programId);
            const accountInfo = await connection.getAccountInfo(transactionRecord);
            if (accountInfo) {
                react_toastify_1.toast.info('Contract already initialized', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
                setIsInitialized(true);
                setIsAdmin(true);
                return;
            }
            // Step 1: Initialize with minimal space
            const initTx = await program.methods
                .initialize()
                .accounts({
                authority: solanaPublicKey,
                transactionRecord: transactionRecord,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .rpc();
            react_toastify_1.toast.info('Contract initialized, resizing account...', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            // Step 2: Resize to required space
            const resizeTx = await program.methods
                .resize()
                .accounts({
                authority: solanaPublicKey,
                transactionRecord: transactionRecord,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .rpc();
            react_toastify_1.toast.success(`Contract initialized and resized! Init Hash: ${initTx}, Resize Hash: ${resizeTx}`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            setIsInitialized(true);
            setIsAdmin(true);
        }
        catch (error) {
            console.error('Initialization error:', error);
            react_toastify_1.toast.error('Failed to initialize contract. Please try again.', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
        }
        finally {
            setIsProcessing(false);
        }
    };
    // Function to create the treasury account
    const createTreasuryAccount = async () => {
        if (!solanaConnected || !solanaPublicKey) {
            react_toastify_1.toast.error('Please connect your Solana wallet first', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            return;
        }
        setIsProcessing(true);
        react_toastify_1.toast.info('Creating treasury account...', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
        });
        try {
            // Create a new account for the treasury
            const treasuryKeypair = web3_js_1.Keypair.generate();
            // Get the minimum rent for the account
            const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
            // Create the account
            const createAccountIx = web3_js_1.SystemProgram.createAccount({
                fromPubkey: solanaPublicKey,
                newAccountPubkey: treasuryKeypair.publicKey,
                lamports: rentExemption,
                space: 0,
                programId: web3_js_1.SystemProgram.programId,
            });
            // Create a transaction
            const transaction = new web3_js_1.Transaction().add(createAccountIx);
            // Send the transaction
            const tx = await connection.sendTransaction(transaction, [treasuryKeypair]);
            react_toastify_1.toast.success(`Treasury account created! Hash: ${tx}`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            // Save the treasury public key for future use
            localStorage.setItem('treasuryPublicKey', treasuryKeypair.publicKey.toString());
        }
        catch (error) {
            console.error('Create treasury error:', error);
            react_toastify_1.toast.error('Failed to create treasury account. Please try again.', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
        }
        finally {
            setIsProcessing(false);
        }
    };
    // Add handleNextStage function
    const handleNextStage = async () => {
        if (!solanaConnected || !solanaPublicKey || !isAdmin) {
            console.log('Cannot advance stage:', {
                solanaConnected,
                solanaPublicKey: solanaPublicKey?.toString(),
                isAdmin
            });
            react_toastify_1.toast.error('You must be the admin to advance to the next stage', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            return;
        }
        setIsProcessing(true);
        console.log('Advancing to next stage...');
        react_toastify_1.toast.info('Advancing to next stage...', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
        });
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
            const [transactionRecord] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("transaction_record")], program.programId);
            console.log('Transaction record PDA:', transactionRecord.toString());
            console.log('Current stage before advancement:', currentStage);
            // Call the nextStage instruction
            const tx = await program.methods
                .nextStage()
                .accounts({
                authority: solanaPublicKey,
                transactionRecord: transactionRecord,
            })
                .rpc();
            console.log('Next stage transaction:', tx);
            console.log('Advanced to next stage successfully');
            react_toastify_1.toast.success(`Advanced to next stage! Hash: ${tx}`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            // Refresh the presale data
            fetchPresaleData();
        }
        catch (error) {
            console.error('Next stage error:', error);
            react_toastify_1.toast.error('Failed to advance to next stage. Please try again.', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
        }
        finally {
            setIsProcessing(false);
        }
    };
    // Restore the handleSolanaBuy function
    const handleSolanaBuy = async (amount) => {
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
            const [transactionRecord] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("transaction_record")], program.programId);
            // Use the authority wallet address as the treasury
            const treasuryWallet = new web3_js_1.PublicKey("AyWCnEbpDdVdsweK6MfnML5FpTLQpXAzSin7b7DJnwq3");
            // Check if the transaction record account exists
            const transactionRecordInfo = await connection.getAccountInfo(transactionRecord);
            if (!transactionRecordInfo) {
                throw new Error('Transaction record account not found. Contract may not be initialized.');
            }
            // Call the buy instruction with the new parameter type (f64 instead of u64)
            const tx = await program.methods
                .buy(amount) // Now passing a f64 value directly
                .accounts({
                buyer: solanaPublicKey,
                treasury: treasuryWallet,
                transactionRecord: transactionRecord,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .rpc();
            return tx;
        }
        catch (error) {
            console.error('Solana buy error:', error);
            throw error;
        }
    };
    // Add fetchPresaleData function to refresh data after stage change
    const fetchPresaleData = (0, react_1.useCallback)(async () => {
        if (!solanaConnected || !solanaPublicKey) {
            console.log('Cannot fetch presale data: wallet not connected');
            return;
        }
        try {
            console.log('Fetching presale data...');
            const program = getProgram();
            if (!program) {
                console.log('Program not initialized');
                return;
            }
            // Get the transaction record PDA
            const [transactionRecord] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("transaction_record")], program.programId);
            console.log('Transaction record PDA:', transactionRecord.toString());
            // Fetch the transaction record account
            const account = await program.account.transactionRecord.fetch(transactionRecord);
            console.log('Fetched account data:', {
                currentStage: account.currentStage,
                totalUsdSold: account.totalUsdSold,
                totalTokensSold: account.totalTokensSold,
                transactionCount: account.transactionCount,
                authority: account.authority.toString(),
                currentUser: solanaPublicKey.toString(),
                isAdmin: account.authority.equals(solanaPublicKey)
            });
            // Update state with fetched data
            setCurrentStage(account.currentStage + 1);
            setTotalUsdSold(account.totalUsdSold);
            setTotalTokensSold(account.totalTokensSold);
            setTransactions(account.transactions);
            // Check if the current user is the admin
            const isUserAdmin = account.authority.equals(solanaPublicKey);
            console.log('Is user admin?', isUserAdmin);
            setIsAdmin(isUserAdmin);
        }
        catch (error) {
            console.error('Error fetching presale data:', error);
        }
    }, [solanaConnected, solanaPublicKey, getProgram]);
    // Handle buy tokens
    const handleBuyTokens = async () => {
        if (!solanaConnected) {
            react_toastify_1.toast.error('Please connect your Solana wallet first', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            return;
        }
        if (Number(amount) < 1) {
            react_toastify_1.toast.error('Minimum purchase amount is $1', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            return;
        }
        if (selectedPaymentChain === 'solana') {
            if (!isInitialized) {
                react_toastify_1.toast.error('Contract not initialized. Please contact the admin.', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
                return;
            }
        }
        else {
            // For EVM chains, we need EVM connection
            if (!evmConnected || !selectedPaymentChain) {
                react_toastify_1.toast.error('Please connect your payment wallet and select a payment chain', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
                return;
            }
            if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                react_toastify_1.toast.error('Please enter a valid amount', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
                return;
            }
        }
        setIsProcessing(true);
        react_toastify_1.toast.info('Processing transaction...', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
        });
        try {
            if (selectedPaymentChain === 'solana') {
                // Convert amount to a number and ensure it's valid
                const amountNum = Number(amount);
                if (isNaN(amountNum) || amountNum <= 0) {
                    throw new Error('Invalid amount');
                }
                const tx = await handleSolanaBuy(amountNum);
                react_toastify_1.toast.success(`Transaction submitted! Hash: ${tx}`, {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
            }
            else if (selectedPaymentChain === 'base') {
                if (!walletClient) {
                    throw new Error('Wallet client not available');
                }
                // Convert amount to cents (multiply by 100)
                const amountInCents = BigInt(Math.floor(parseFloat(amount)));
                // Get quote for ETH amount
                const quote = await publicClient.readContract({
                    ...baseEth_1.BASE_ETH_CONTRACT,
                    functionName: 'getQuote',
                    args: [amountInCents],
                });
                // Make the purchase
                const hash = await walletClient.writeContract({
                    ...baseEth_1.BASE_ETH_CONTRACT,
                    functionName: 'purchaseWithUSDAmount',
                    args: [amountInCents, solanaPublicKey?.toString() || ''],
                    value: quote,
                });
                react_toastify_1.toast.success(`Transaction submitted! Hash: ${hash}`, {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
                // Wait for transaction confirmation
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                if (receipt.status === 'success') {
                    react_toastify_1.toast.success('Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        ...toastStyles,
                    });
                }
                else {
                    throw new Error('Transaction failed');
                }
            }
            else if (selectedPaymentChain === 'bsc') {
                if (!walletClient) {
                    throw new Error('Wallet client not available');
                }
                // Convert amount to cents (multiply by 100)
                const amountInCents = BigInt(Math.floor(parseFloat(amount)));
                // Get quote for BNB amount
                const quote = await publicClient.readContract({
                    ...bscContract_1.BSC_CONTRACT,
                    functionName: 'getQuote',
                    args: [amountInCents],
                });
                // Make the purchase
                const hash = await walletClient.writeContract({
                    ...bscContract_1.BSC_CONTRACT,
                    functionName: 'purchaseWithUSDAmount',
                    args: [amountInCents, solanaPublicKey?.toString() || ''],
                    value: quote,
                });
                react_toastify_1.toast.success(`Transaction submitted! Hash: ${hash}`, {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
                // Wait for transaction confirmation
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                if (receipt.status === 'success') {
                    react_toastify_1.toast.success('Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        ...toastStyles,
                    });
                }
                else {
                    throw new Error('Transaction failed');
                }
            }
            else {
                // Simulate transaction for other chains (replace with actual implementation)
                await new Promise(resolve => setTimeout(resolve, 2000));
                react_toastify_1.toast.success('Transaction successful! Doge-Head tokens will be sent to your Solana wallet.', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastStyles,
                });
            }
            // After successful transaction
            await fetchTransactionRecord(); // Refresh the data
        }
        catch (error) {
            console.error('Transaction error:', error);
            react_toastify_1.toast.error('Transaction failed. Please try again.', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
        }
        finally {
            setIsProcessing(false);
        }
    };
    // Check initialization status when wallet connects
    (0, react_1.useEffect)(() => {
        if (solanaConnected && solanaPublicKey) {
            checkInitialization();
        }
    }, [solanaConnected, solanaPublicKey, checkInitialization]);
    // Add this function to fetch transaction record data
    const fetchTransactionRecord = (0, react_1.useCallback)(async () => {
        if (!solanaConnected || !solanaPublicKey)
            return;
        try {
            const program = getProgram();
            if (!program)
                return;
            // Get the transaction record PDA
            const [transactionRecord] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("transaction_record")], program.programId);
            // Fetch the account data
            const accountInfo = await connection.getAccountInfo(transactionRecord);
            if (!accountInfo)
                return;
            // Decode the account data
            const decodedData = await program.coder.accounts.decode('transactionRecord', accountInfo.data);
            // Update state with the fetched data
            setTotalUsdSold(decodedData.totalUsdSold);
            setTotalTokensSold(decodedData.totalTokensSold);
            setTransactions(decodedData.transactions);
            setCurrentStage(decodedData.currentStage + 1);
            console.log("Transaction record data:", decodedData);
        }
        catch (error) {
            console.error('Error fetching transaction record:', error);
        }
    }, [solanaConnected, solanaPublicKey, getProgram, connection]);
    // Add this useEffect to fetch data when wallet connects
    (0, react_1.useEffect)(() => {
        if (solanaConnected && solanaPublicKey) {
            fetchTransactionRecord();
        }
    }, [solanaConnected, solanaPublicKey, fetchTransactionRecord]);
    // Add useEffect to fetch presale data on component mount and when wallet changes
    (0, react_1.useEffect)(() => {
        if (solanaConnected && solanaPublicKey) {
            fetchPresaleData();
        }
    }, [solanaConnected, solanaPublicKey, fetchPresaleData]);
    const [userProfile, setUserProfile] = (0, react_1.useState)(null);
    // Add loading state for user profile
    const [isProfileLoading, setIsProfileLoading] = (0, react_1.useState)(false);
    // Add function to fetch user profile
    const fetchUserProfile = (0, react_1.useCallback)(async () => {
        if (!solanaConnected || !solanaPublicKey) {
            setUserProfile(null);
            return;
        }
        setIsProfileLoading(true);
        try {
            const program = getProgram();
            if (!program) {
                throw new Error('Program not initialized');
            }
            // Get the transaction record PDA
            const [transactionRecord] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("transaction_record")], program.programId);
            // Fetch the transaction record account
            const account = await program.account.transactionRecord.fetch(transactionRecord);
            // Find the user's buyer info
            const buyerInfo = account.buyers.find(b => b.buyerAddress.equals(solanaPublicKey));
            if (!buyerInfo) {
                setUserProfile(null);
                return;
            }
            // Get user's transactions
            const userTransactions = account.transactions
                .filter(tx => tx.buyer.equals(solanaPublicKey))
                .map(tx => ({
                usdAmount: tx.usdAmount,
                solAmount: tx.solAmount,
                tokenAmount: tx.tokenAmount,
                stage: tx.stage,
                timestamp: tx.timestamp,
            }));
            setUserProfile({
                totalPaidUsd: buyerInfo.totalPaidUsd,
                totalPaidSol: buyerInfo.totalPaidSol,
                totalTokensBought: buyerInfo.totalTokensBought,
                totalTokensClaimed: buyerInfo.totalTokensClaimed,
                lastClaimTimestamp: buyerInfo.lastClaimTimestamp,
                transactions: userTransactions,
            });
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            react_toastify_1.toast.error('Failed to fetch user profile. Please try again.', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                ...toastStyles,
            });
            setUserProfile(null);
        }
        finally {
            setIsProfileLoading(false);
        }
    }, [solanaConnected, solanaPublicKey, getProgram]);
    // Add useEffect to fetch user profile when wallet connects or after successful transaction
    (0, react_1.useEffect)(() => {
        if (solanaConnected && solanaPublicKey) {
            fetchUserProfile();
        }
    }, [solanaConnected, solanaPublicKey, fetchUserProfile]);
    // Add format functions for display
    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };
    return (<div className={MultiChainPresale_module_css_1.default.presaleContainer}>
      <react_toastify_1.ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark"/>
      <div className={MultiChainPresale_module_css_1.default.presaleCard}>
        <div className={MultiChainPresale_module_css_1.default.tokenInfo}>
          <div className={MultiChainPresale_module_css_1.default.tokenHeader}>
            <h2>Doge-Head Token Presale</h2>
            <span className={MultiChainPresale_module_css_1.default.tokenSymbol}>$DOGE-HEAD</span>
          </div>

          <div className={MultiChainPresale_module_css_1.default.presaleStats}>
            <div className={MultiChainPresale_module_css_1.default.statItem}>
              <span className={MultiChainPresale_module_css_1.default.statLabel}>Stage {currentStage}</span>
              <span className={MultiChainPresale_module_css_1.default.statValue}>{stageData?.availableTokens.toLocaleString()} tokens</span>
              <span className={MultiChainPresale_module_css_1.default.statSubValue}>${stageData?.pricePerToken} per token</span>
            </div>
            <div className={MultiChainPresale_module_css_1.default.statItem}>
              <span className={MultiChainPresale_module_css_1.default.statLabel}>Total USD Sold</span>
              <span className={MultiChainPresale_module_css_1.default.statValue}>${totalUsdSold.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className={MultiChainPresale_module_css_1.default.statItem}>
              <span className={MultiChainPresale_module_css_1.default.statLabel}>Total Tokens Sold</span>
              <span className={MultiChainPresale_module_css_1.default.statValue}>{formatTokenAmount(totalTokensSold)}</span>
            </div>
          </div>

          <div className={MultiChainPresale_module_css_1.default.progressBar}>
            <div className={MultiChainPresale_module_css_1.default.progress} style={{
            width: `${Math.min(((totalTokensSold / 1e9) / (stageData?.availableTokens || 1)) * 100, 100)}%`
        }}></div>
            <div className={MultiChainPresale_module_css_1.default.progressText}>
              {Math.floor(totalTokensSold / 1e9).toLocaleString()}/{stageData?.availableTokens.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        <div className={MultiChainPresale_module_css_1.default.walletSection}>
          <div className={MultiChainPresale_module_css_1.default.walletStatus}>
            <div className={MultiChainPresale_module_css_1.default.walletStatusItem}>
              <span className={MultiChainPresale_module_css_1.default.walletLabel}>Solana Wallet (Devnet):</span>
              <span className={`${MultiChainPresale_module_css_1.default.walletValue} ${solanaConnected ? MultiChainPresale_module_css_1.default.connected : ''}`}>
                {solanaConnected
            ? `${solanaPublicKey?.toString().slice(0, 4)}...${solanaPublicKey?.toString().slice(-4)}`
            : 'Not Connected'}
              </span>
              {solanaConnected ? (<button className={MultiChainPresale_module_css_1.default.disconnectButton} onClick={disconnectSolana}>
                  Disconnect
                </button>) : (<button className={MultiChainPresale_module_css_1.default.connectButton} disabled={solanaConnecting}>
                  {solanaConnecting ? 'Connecting...' : 'Connect Solana'}
                </button>)}
            </div>

            {selectedPaymentChain !== 'solana' && (<div className={MultiChainPresale_module_css_1.default.walletStatusItem}>
                <span className={MultiChainPresale_module_css_1.default.walletLabel}>Payment Wallet (Testnet):</span>
                <span className={`${MultiChainPresale_module_css_1.default.walletValue} ${evmConnected ? MultiChainPresale_module_css_1.default.connected : ''}`}>
                  {evmConnected
                ? `${evmAddress?.slice(0, 4)}...${evmAddress?.slice(-4)}`
                : 'Not Connected'}
                </span>
                {evmConnected && (<div className={MultiChainPresale_module_css_1.default.chainInfo}>
                    <span className={MultiChainPresale_module_css_1.default.chainName}>
                      {chain?.name || 'Connected'}
                    </span>
                  </div>)}
              </div>)}
          </div>

          {/* Admin controls */}
          {solanaConnected && (<div className={MultiChainPresale_module_css_1.default.adminControls}>
              <h3>Admin Controls</h3>
              {!isInitialized ? (<button className={MultiChainPresale_module_css_1.default.adminButton} onClick={handleInitialize} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Initialize Contract'}
                </button>) : isAdmin ? (<div className={MultiChainPresale_module_css_1.default.initializedStatus}>
                  <span className={MultiChainPresale_module_css_1.default.initializedText}>Contract Initialized</span>
                  <span className={MultiChainPresale_module_css_1.default.adminBadge}>You are the admin</span>
                  <button className={MultiChainPresale_module_css_1.default.adminButton} onClick={handleNextStage} disabled={isProcessing || currentStage >= presaleStages.length - 1}>
                    {isProcessing ? 'Processing...' : 'Next Stage'}
                  </button>
                </div>) : (<div className={MultiChainPresale_module_css_1.default.initializedStatus}>
                  <span className={MultiChainPresale_module_css_1.default.initializedText}>Contract Initialized</span>
                  <span className={MultiChainPresale_module_css_1.default.adminBadge}>Waiting for admin...</span>
                </div>)}
            </div>)}

          <div className={MultiChainPresale_module_css_1.default.paymentOptions}>
            <h3>Select Payment Chain</h3>
            <div className={MultiChainPresale_module_css_1.default.paymentOptionsGrid}>
              {PAYMENT_OPTIONS.map((option) => (<div key={option.id} className={`${MultiChainPresale_module_css_1.default.paymentOption} ${selectedPaymentChain === option.id ? MultiChainPresale_module_css_1.default.selected : ''} ${option.isDisabled ? MultiChainPresale_module_css_1.default.disabled : ''}`} onClick={() => !option.isDisabled && handlePaymentChainSelect(option.id)}>
                  <img src={option.icon} alt={option.name} className={MultiChainPresale_module_css_1.default.chainIcon}/>
                  <span>{option.name}</span>
                  {option.isDisabled && <span className={MultiChainPresale_module_css_1.default.disabledLabel}>Coming Soon</span>}
                </div>))}
            </div>
          </div>

          <div className={MultiChainPresale_module_css_1.default.buySection}>
            <div className={MultiChainPresale_module_css_1.default.inputGroup}>
              <label>Amount ($)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className={MultiChainPresale_module_css_1.default.input} disabled={!solanaConnected ||
            (selectedPaymentChain !== 'solana' && !evmConnected) ||
            !selectedPaymentChain ||
            isProcessing ||
            (selectedPaymentChain === 'solana' && !isInitialized)}/>
            </div>

            <div className={MultiChainPresale_module_css_1.default.tokenCalculation}>
              <span>You will receive:</span>
              <span className={MultiChainPresale_module_css_1.default.tokenAmount}>
                {tokensToReceive} DOGE-HEAD
              </span>
            </div>

            <button className={MultiChainPresale_module_css_1.default.buyButton} onClick={handleBuyTokens} disabled={!solanaConnected ||
            (selectedPaymentChain !== 'solana' && !evmConnected) ||
            !selectedPaymentChain ||
            !amount ||
            isProcessing ||
            (selectedPaymentChain === 'solana' && !isInitialized)}>
              {isProcessing ? 'Processing...' : 'Buy Doge-Head Tokens'}
            </button>
            {selectedPaymentChain === 'solana' && !isInitialized && (<p className={MultiChainPresale_module_css_1.default.warningText}>Contract not initialized. Please contact the admin.</p>)}
          </div>
        </div>
      </div>
      <div className={MultiChainPresale_module_css_1.default.roadmapSection}>
        <h2>Roadmap</h2>
        <div className={MultiChainPresale_module_css_1.default.roadmapTimeline}>
          <div className={MultiChainPresale_module_css_1.default.roadmapItem}>
            <div className={MultiChainPresale_module_css_1.default.roadmapPhase}>1</div>
            <div className={MultiChainPresale_module_css_1.default.roadmapContent}>
              <h3>Gaming Focus</h3>
              <p>Continue focusing on video games and all mini-projects that will sustain $DHC</p>
            </div>
          </div>
          <div className={MultiChainPresale_module_css_1.default.roadmapItem}>
            <div className={MultiChainPresale_module_css_1.default.roadmapPhase}>2</div>
            <div className={MultiChainPresale_module_css_1.default.roadmapContent}>
              <h3>Presale Completion</h3>
              <p>Complete the presale and distribute tokens to early supporters</p>
            </div>
          </div>
          <div className={MultiChainPresale_module_css_1.default.roadmapItem}>
            <div className={MultiChainPresale_module_css_1.default.roadmapPhase}>3</div>
            <div className={MultiChainPresale_module_css_1.default.roadmapContent}>
              <h3>DEX Listing</h3>
              <p>List on decentralized exchanges to provide liquidity and trading options</p>
            </div>
          </div>
          <div className={MultiChainPresale_module_css_1.default.roadmapItem}>
            <div className={MultiChainPresale_module_css_1.default.roadmapPhase}>4</div>
            <div className={MultiChainPresale_module_css_1.default.roadmapContent}>
              <h3>Artist Platform</h3>
              <p>Launch a platform where artists of all kinds can receive tips in $DHC</p>
            </div>
          </div>
          <div className={MultiChainPresale_module_css_1.default.roadmapItem}>
            <div className={MultiChainPresale_module_css_1.default.roadmapPhase}>5</div>
            <div className={MultiChainPresale_module_css_1.default.roadmapContent}>
              <h3>CEX Listing</h3>
              <p>List on centralized exchanges to reach a wider audience and increase trading volume</p>
            </div>
          </div>
        </div>
      </div>
      {/* Add a transactions section if you want to display them */}
      {transactions.length > 0 && (<div className={MultiChainPresale_module_css_1.default.transactionsSection}>
          <div className={MultiChainPresale_module_css_1.default.transactionsHeader}>
            <h3>Recent Transactions</h3>
            <div className={MultiChainPresale_module_css_1.default.transactionsFilter}>
              <button className={MultiChainPresale_module_css_1.default.filterButton}>All</button>
              <button className={MultiChainPresale_module_css_1.default.filterButton}>Today</button>
              <button className={MultiChainPresale_module_css_1.default.filterButton}>This Week</button>
            </div>
          </div>

          <div className={MultiChainPresale_module_css_1.default.transactionsList}>
            {transactions.slice(-5).reverse().map((tx, index) => {
                return (<div key={index} className={MultiChainPresale_module_css_1.default.transactionItem}>
                  <div className={MultiChainPresale_module_css_1.default.transactionCard}>
                    <div className={MultiChainPresale_module_css_1.default.transactionCardFront}>
                      <div className={MultiChainPresale_module_css_1.default.transactionIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      <div className={MultiChainPresale_module_css_1.default.transactionMainInfo}>
                        <div className={MultiChainPresale_module_css_1.default.transactionType}>Token Purchase</div>
                        <div className={MultiChainPresale_module_css_1.default.transactionAmount}>${tx.usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className={MultiChainPresale_module_css_1.default.transactionTime}>{new Date(tx.timestamp * 1000).toLocaleString()}</div>
                      </div>

                      <div className={MultiChainPresale_module_css_1.default.transactionStage}>
                        <span className={MultiChainPresale_module_css_1.default.stageBadge}>Stage {tx.stage + 1}</span>
                      </div>
                    </div>

                    <div className={MultiChainPresale_module_css_1.default.transactionCardBack}>
                      <div className={MultiChainPresale_module_css_1.default.transactionDetails}>
                        <div className={MultiChainPresale_module_css_1.default.detailGroup}>
                          <div className={MultiChainPresale_module_css_1.default.detailLabel}>Buyer</div>
                          <div className={MultiChainPresale_module_css_1.default.detailValue}>{tx.buyer.toString().slice(0, 4)}...{tx.buyer.toString().slice(-4)}</div>
                        </div>

                        <div className={MultiChainPresale_module_css_1.default.detailGroup}>
                          <div className={MultiChainPresale_module_css_1.default.detailLabel}>SOL Paid</div>
                          <div className={MultiChainPresale_module_css_1.default.detailValue}>{formatSolAmount(tx.solAmount)} SOL</div>
                        </div>

                        <div className={MultiChainPresale_module_css_1.default.detailGroup}>
                          <div className={MultiChainPresale_module_css_1.default.detailLabel}>Tokens Received</div>
                          <div className={MultiChainPresale_module_css_1.default.detailValue}>{formatTokenAmount(tx.tokenAmount)} DOGE-HEAD</div>
                        </div>
                      </div>

                      <div className={MultiChainPresale_module_css_1.default.transactionActions}>
                        <button className={MultiChainPresale_module_css_1.default.actionButton}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          View Details
                        </button>
                        <button className={MultiChainPresale_module_css_1.default.actionButton}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>);
            })}
          </div>

          {transactions.length > 5 && (<div className={MultiChainPresale_module_css_1.default.viewMoreContainer}>
              <button className={MultiChainPresale_module_css_1.default.viewMoreButton}>
                <span>View All Transactions</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>)}
        </div>)}

      {/* User Profile Section */}
      {solanaConnected && (<div className={MultiChainPresale_module_css_1.default.userProfileSection}>
          <h2>Your Profile</h2>
          
          {isProfileLoading ? (<div className={MultiChainPresale_module_css_1.default.loadingContainer}>
              <div className={MultiChainPresale_module_css_1.default.loadingSpinner}/>
              <span>Loading profile...</span>
            </div>) : userProfile ? (<react_2.default.Fragment>
              <div className={MultiChainPresale_module_css_1.default.profileStats}>
                <div className={MultiChainPresale_module_css_1.default.statCard}>
                  <h3>Total Investment</h3>
                  <div className={MultiChainPresale_module_css_1.default.statValue}>
                    <span>${userProfile.totalPaidUsd.toFixed(2)}</span>
                    <span>{formatSolAmount(userProfile.totalPaidSol)} SOL</span>
                  </div>
                </div>
                
                <div className={MultiChainPresale_module_css_1.default.statCard}>
                  <h3>Tokens</h3>
                  <div className={MultiChainPresale_module_css_1.default.statValue}>
                    <span>Bought: {formatTokenAmount(userProfile.totalTokensBought)}</span>
                    <span>Claimed: {formatTokenAmount(userProfile.totalTokensClaimed)}</span>
                    <span>Pending: {formatTokenAmount(userProfile.totalTokensBought - userProfile.totalTokensClaimed)}</span>
                  </div>
                </div>
                
                <div className={MultiChainPresale_module_css_1.default.statCard}>
                  <h3>Last Claim</h3>
                  <div className={MultiChainPresale_module_css_1.default.statValue}>
                    {userProfile.lastClaimTimestamp > 0 ? (<span>{formatDate(userProfile.lastClaimTimestamp)}</span>) : (<span>No claims yet</span>)}
                  </div>
                </div>
              </div>

              <div className={MultiChainPresale_module_css_1.default.transactionHistory}>
                <div className={MultiChainPresale_module_css_1.default.transactionHistoryHeader}>
                  <h3>Transaction History</h3>
                  <button className={MultiChainPresale_module_css_1.default.refreshButton} onClick={fetchUserProfile} disabled={isProfileLoading}>
                    {isProfileLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                <div className={MultiChainPresale_module_css_1.default.transactionList}>
                  {userProfile.transactions.map((tx, index) => (<div key={index} className={MultiChainPresale_module_css_1.default.transactionCard}>
                      <div className={MultiChainPresale_module_css_1.default.transactionHeader}>
                        <span className={MultiChainPresale_module_css_1.default.stageBadge}>Stage {tx.stage + 1}</span>
                        <span className={MultiChainPresale_module_css_1.default.timestamp}>{formatDate(tx.timestamp)}</span>
                      </div>
                      <div className={MultiChainPresale_module_css_1.default.transactionDetails}>
                        <div className={MultiChainPresale_module_css_1.default.detailRow}>
                          <span>Amount Paid:</span>
                          <span>${tx.usdAmount.toFixed(2)} ({formatSolAmount(tx.solAmount)} SOL)</span>
                        </div>
                        <div className={MultiChainPresale_module_css_1.default.detailRow}>
                          <span>Tokens Received:</span>
                          <span>{formatTokenAmount(tx.tokenAmount)}</span>
                        </div>
                      </div>
                    </div>))}
                </div>
              </div>
            </react_2.default.Fragment>) : (<div className={MultiChainPresale_module_css_1.default.noProfileContainer}>
              <p>No purchase history found. Buy some tokens to see your profile!</p>
            </div>)}
        </div>)}
    </div>);
};
exports.MultiChainPresale = MultiChainPresale;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9pbnRlcmFjdC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsaUNBQTZEO0FBQzdELHVFQUEyRjtBQUMzRixpQ0FBNEY7QUFJNUYsaUNBQXlEO0FBRXpELG1EQUF1RDtBQUN2RCxpREFBK0M7QUFDL0MsMEdBQTREO0FBQzVELGtEQUF5RDtBQUN6RCwwREFBd0Q7QUFFeEQsNkNBQWlGO0FBQ2pGLDhDQUFtRjtBQUNuRixzREFBMEQ7QUFDMUQsa0RBQTBCO0FBRTFCLFlBQVk7QUFDWixNQUFNLFNBQVMsR0FBRztJQUNoQixRQUFRLEVBQUUsS0FBSyxFQUFFLGVBQWU7SUFDaEMsZUFBZSxFQUFFLEtBQUssRUFBRSxTQUFTO0lBQ2pDLFdBQVcsRUFBRSxFQUFFLEVBQUUsY0FBYztJQUMvQixNQUFNLEVBQUUsUUFBUSxFQUFFLGdCQUFnQjtDQUNuQyxDQUFDO0FBRUYsa0JBQWtCO0FBQ2xCLE1BQU0sZUFBZSxHQUFHO0lBQ3RCO1FBQ0UsRUFBRSxFQUFFLFFBQVE7UUFDWixJQUFJLEVBQUUsaUJBQWlCO1FBQ3ZCLE9BQU8sRUFBRSxTQUFTLENBQUMsTUFBTTtRQUN6QixJQUFJLEVBQUUsZ0VBQWdFO1FBQ3RFLFVBQVUsRUFBRSxLQUFLO0tBQ2xCO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsTUFBTTtRQUNWLElBQUksRUFBRSxvQkFBb0I7UUFDMUIsT0FBTyxFQUFFLFNBQVMsQ0FBQyxRQUFRO1FBQzNCLElBQUksRUFBRSwwRUFBMEU7UUFDaEYsVUFBVSxFQUFFLEtBQUs7S0FDbEI7SUFDRDtRQUNFLEVBQUUsRUFBRSxTQUFTO1FBQ2IsSUFBSSxFQUFFLGtCQUFrQjtRQUN4QixPQUFPLEVBQUUsU0FBUyxDQUFDLGVBQWU7UUFDbEMsSUFBSSxFQUFFLDhGQUE4RjtRQUNwRyxVQUFVLEVBQUUsSUFBSTtLQUNqQjtJQUNEO1FBQ0UsRUFBRSxFQUFFLEtBQUs7UUFDVCxJQUFJLEVB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Q0FBQyxFQUFFLElBQUksQ0FDakQ7d0JBQUEsRUFBRSxHQUFHLENBQ1A7c0JBQUEsRUFBRSxHQUFHLENBQ1A7b0JBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUFDLENBQ0o7Z0JBQUEsRUFBRSxHQUFHLENBQ1A7Y0FBQSxFQUFFLEdBQUcsQ0FDUDtZQUFBLEVBQUUsZUFBSyxDQUFDLFFBQVEsQ0FBQyxDQUNsQixDQUFDLENBQUMsQ0FBQyxDQUNGLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLHNDQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FDeEM7Y0FBQSxDQUFDLENBQUMsQ0FBQywrREFBK0QsRUFBRSxDQUFDLENBQ3ZFO1lBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUNIO1FBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUNIO0lBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBajFDVyxRQUFBLGlCQUFpQixxQkFpMUM1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZDLCB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUNvbm5lY3Rpb24sIHVzZVdhbGxldCBhcyB1c2VTb2xhbmFXYWxsZXQgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLXJlYWN0JztcbmltcG9ydCB7IHVzZUFjY291bnQsIHVzZUNvbm5lY3QsIHVzZURpc2Nvbm5lY3QsIHVzZU5ldHdvcmssIHVzZVN3aXRjaE5ldHdvcmsgfSBmcm9tICd3YWdtaSc7XG5pbXBvcnQgeyBJbmplY3RlZENvbm5lY3RvciB9IGZyb20gJ3dhZ21pL2Nvbm5lY3RvcnMvaW5qZWN0ZWQnO1xuaW1wb3J0IHsgTWV0YU1hc2tDb25uZWN0b3IgfSBmcm9tICd3YWdtaS9jb25uZWN0b3JzL21ldGFNYXNrJztcbmltcG9ydCB7IFdhbGxldENvbm5lY3RDb25uZWN0b3IgfSBmcm9tICd3YWdtaS9jb25uZWN0b3JzL3dhbGxldENvbm5lY3QnO1xuaW1wb3J0IHsgdXNlUHVibGljQ2xpZW50LCB1c2VXYWxsZXRDbGllbnQgfSBmcm9tICd3YWdtaSc7XG5pbXBvcnQgeyBwYXJzZUV0aGVyIH0gZnJvbSAndmllbSc7XG5pbXBvcnQgeyBUb2FzdENvbnRhaW5lciwgdG9hc3QgfSBmcm9tICdyZWFjdC10b2FzdGlmeSc7XG5pbXBvcnQgJ3JlYWN0LXRvYXN0aWZ5L2Rpc3QvUmVhY3RUb2FzdGlmeS5jc3MnO1xuaW1wb3J0IHN0eWxlcyBmcm9tICcuLi9zdHlsZXMvTXVsdGlDaGFpblByZXNhbGUubW9kdWxlLmNzcyc7XG5pbXBvcnQgeyBCQVNFX0VUSF9DT05UUkFDVCB9IGZyb20gJy4uL2NvbnRyYWN0cy9iYXNlRXRoJztcbmltcG9ydCB7IEJTQ19DT05UUkFDVCB9IGZyb20gJy4uL2NvbnRyYWN0cy9ic2NDb250cmFjdCc7XG5pbXBvcnQgeyBEb2dlUHJlc2FsZUlETCB9IGZyb20gJy4uL2NvbnRyYWN0cy9vbGRfc29sYW5hSWRsJztcbmltcG9ydCB7IFB1YmxpY0tleSwgU3lzdGVtUHJvZ3JhbSwgS2V5cGFpciwgVHJhbnNhY3Rpb24gfSBmcm9tICdAc29sYW5hL3dlYjMuanMnO1xuaW1wb3J0IHsgUHJvZ3JhbSwgQW5jaG9yUHJvdmlkZXIsIEJOLCBzZXRQcm92aWRlciwgd2ViMyB9IGZyb20gXCJAY29yYWwteHl6L2FuY2hvclwiO1xuaW1wb3J0IHsgRG9nZVByZXNhbGUsIElETCB9IGZyb20gJy4uL2NvbnRyYWN0cy9zb2xhbmFJZGwnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxuLy8gQ2hhaW4gSURzXG5jb25zdCBDSEFJTl9JRFMgPSB7XG4gIEJBU0VfRVRIOiA4NDUzMiwgLy8gQmFzZSBTZXBvbGlhXG4gIFBPTFlHT05fVEVTVE5FVDogODAwMDEsIC8vIE11bWJhaVxuICBCU0NfVEVTVE5FVDogOTcsIC8vIEJTQyBUZXN0bmV0XG4gIFNPTEFOQTogJ3NvbGFuYScsIC8vIFNvbGFuYSBEZXZuZXRcbn07XG5cbi8vIFBheW1lbnQgb3B0aW9uc1xuY29uc3QgUEFZTUVOVF9PUFRJT05TID0gW1xuICB7XG4gICAgaWQ6ICdzb2xhbmEnLFxuICAgIG5hbWU6ICdTb2xhbmEgKERldm5ldCknLFxuICAgIGNoYWluSWQ6IENIQUlOX0lEUy5TT0xBTkEsXG4gICAgaWNvbjogJ2h0dHBzOi8vdXBsb2FkLndpa2ltZWRpYS5vcmcvd2lraXBlZGlhL2VuL2IvYjkvU29sYW5hX2xvZ28ucG5nJyxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZVxuICB9LFxuICB7XG4gICAgaWQ6ICdiYXNlJyxcbiAgICBuYW1lOiAnQmFzZSBFVEggKFNlcG9saWEpJyxcbiAgICBjaGFpbklkOiBDSEFJTl9JRFMuQkFTRV9FVEgsXG4gICAgaWNvbjogJ2h0dHBzOi8vY2RuLnBpeGFiYXkuY29tL3Bob3RvLzIwMjEvMDUvMjQvMDkvMTUvZXRoZXJldW0tNjI3ODMyNl8xMjgwLnBuZycsXG4gICAgaXNEaXNhYmxlZDogZmFsc2VcbiAgfSxcbiAge1xuICAgIGlkOiAncG9seWdvbicsXG4gICAgbmFtZTogJ1BvbHlnb24gKE11bWJhaSknLFxuICAgIGNoYWluSWQ6IENIQUlOX0lEUy5QT0xZR09OX1RFU1RORVQsXG4gICAgaWNvbjogJ2h0dHBzOi8vZW5jcnlwdGVkLXRibjAuZ3N0YXRpYy5jb20vaW1hZ2VzP3E9dGJuOkFOZDlHY1FGSTRheENySmJ4eThmanFKaFpFdV9EWENIWUFxWGpTSUNYZyZzJyxcbiAgICBpc0Rpc2FibGVkOiB0cnVlXG4gIH0sXG4gIHtcbiAgICBpZDogJ2JzYycsXG4gICAgbmFtZTogJ0JTQyAoVGVzdG5ldCknLFxuICAgIGNoYWluSWQ6IENIQUlOX0lEUy5CU0NfVEVTVE5FVCxcbiAgICBpY29uOiAnaHR0cHM6Ly9lbmNyeXB0ZWQtdGJuMC5nc3RhdGljLmNvbS9pbWFnZXM/cT10Ym46QU5kOUdjUVA5Y1V2b0N2bUNYTzRwTkh2blJFSEJDS1czMFUtQlZ4S2ZnJnMnLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlXG4gIH0sXG5dO1xuXG4vLyBDdXN0b20gdG9hc3Qgc3R5bGVzXG5jb25zdCB0b2FzdFN0eWxlcyA9IHtcbiAgc3R5bGU6IHtcbiAgICBiYWNrZ3JvdW5kOiAnIzFhMWExYScsXG4gICAgY29sb3I6ICcjZmZmJyxcbiAgICBib3JkZXJSYWRpdXM6ICc4cHgnLFxuICAgIHBhZGRpbmc6ICcxNnB4JyxcbiAgICBib3hTaGFkb3c6ICcwIDRweCAxMnB4IHJnYmEoMCwgMCwgMCwgMC4xNSknLFxuICB9LFxuICBwcm9ncmVzc1N0eWxlOiB7XG4gICAgYmFja2dyb3VuZDogJ2xpbmVhci1ncmFkaWVudCh0byByaWdodCwgIzRhOTBlMiwgIzUwZTNjMiknLFxuICB9LFxufTtcblxuLy8gUHJlc2FsZSBzdGFnZXMgZGF0YVxuY29uc3QgcHJlc2FsZVN0YWdlcyA9IFtcbiAgeyBzdGFnZTogMSwgYXZhaWxhYmxlVG9rZW5zOiA3NTBfMDAwXzAwMCwgcHJpY2VQZXJUb2tlbjogMC4wMDAxIH0sXG4gIHsgc3RhZ2U6IDIsIGF2YWlsYWJsZVRva2VuczogNjAwXzAwMF8wMDAsIHByaWNlUGVyVG9rZW46IDAuMDAwMzMgfSxcbiAgeyBzdGFnZTogMywgYXZhaWxhYmxlVG9rZW5zOiA0NTBfMDAwXzAwMCwgcHJpY2VQZXJUb2tlbjogMC4wMDA5NTcgfSxcbiAgeyBzdGFnZTogNCwgYXZhaWxhYmxlVG9rZW5zOiA2MDBfMDAwXzAwMCwgcHJpY2VQZXJUb2tlbjogMC4wMDIwMiB9LFxuICB7IHN0YWdlOiA1LCBhdmFpbGFibGVUb2tlbnM6IDYwMF8wMDBfMDAwLCBwcmljZVBlclRva2VuOiAwLjAwMzEzIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgTXVsdGlDaGFpblByZXNhbGU6IEZDID0gKCkgPT4ge1xuICAvLyBTb2xhbmEgd2FsbGV0IHN0YXRlXG4gIGNvbnN0IHtcbiAgICBjb25uZWN0ZWQ6IHNvbGFuYUNvbm5lY3RlZCxcbiAgICBwdWJsaWNLZXk6IHNvbGFuYVB1YmxpY0tleSxcbiAgICBjb25uZWN0aW5nOiBzb2xhbmFDb25uZWN0aW5nLFxuICAgIGRpc2Nvbm5lY3Q6IGRpc2Nvbm5lY3RTb2xhbmFcbiAgfSA9IHVzZVNvbGFuYVdhbGxldCgpO1xuXG4gIC8vIEVWTSB3YWxsZXQgc3RhdGUgLSB1c2luZyBleGlzdGluZyB3M20gY29ubmVjdGlvbnNcbiAgY29uc3QgeyBhZGRyZXNzOiBldm1BZGRyZXNzLCBpc0Nvbm5lY3RlZDogZXZtQ29ubmVjdGVkIH0gPSB1c2VBY2NvdW50KCk7XG4gIGNvbnN0IHsgY2hhaW4gfSA9IHVzZU5ldHdvcmsoKTtcbiAgY29uc3QgeyBzd2l0Y2hOZXR3b3JrIH0gPSB1c2VTd2l0Y2hOZXR3b3JrKCk7XG5cbiAgLy8gUHJlc2FsZSBzdGF0ZVxuICBjb25zdCBbc2VsZWN0ZWRQYXltZW50Q2hhaW4sIHNldFNlbGVjdGVkUGF5bWVudENoYWluXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbYW1vdW50LCBzZXRBbW91bnRdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG4gIGNvbnN0IFt0b2tlbnNUb1JlY2VpdmUsIHNldFRva2Vuc1RvUmVjZWl2ZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcwJyk7XG4gIGNvbnN0IFtpc1Byb2Nlc3NpbmcsIHNldElzUHJvY2Vzc2luZ10gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG4gIGNvbnN0IFtjdXJyZW50U3RhZ2UsIHNldEN1cnJlbnRTdGFnZV0gPSB1c2VTdGF0ZTxudW1iZXI+KDApOyAvLyBEZWZhdWx0IHRvIHN0YWdlIDFcbiAgY29uc3Qgc3RhZ2VEYXRhID0gcHJlc2FsZVN0YWdlcy5maW5kKHMgPT4gcy5zdGFnZSA9PT0gY3VycmVudFN0YWdlKTtcbiAgXG5cbiAgLy8gQWRkIHRoZXNlIHN0YXRlIHZhcmlhYmxlcyBuZWFyIHlvdXIgb3RoZXIgc3RhdGUgZGVjbGFyYXRpb25zXG4gIGNvbnN0IFt0b3RhbFVzZFNvbGQsIHNldFRvdGFsVXNkU29sZF0gPSB1c2VTdGF0ZTxudW1iZXI+KDApO1xuICBjb25zdCBbdG90YWxUb2tlbnNTb2xkLCBzZXRUb3RhbFRva2Vuc1NvbGRdID0gdXNlU3RhdGU8bnVtYmVyPigwKTtcbiAgY29uc3QgW3RyYW5zYWN0aW9ucywgc2V0VHJhbnNhY3Rpb25zXSA9IHVzZVN0YXRlPGFueVtdPihbXSk7XG5cbiAgLy8gTW92ZSBob29rcyB0byBjb21wb25lbnQgbGV2ZWxcbiAgY29uc3QgcHVibGljQ2xpZW50ID0gdXNlUHVibGljQ2xpZW50KCk7XG4gIGNvbnN0IHsgZGF0YTogd2FsbGV0Q2xpZW50IH0gPSB1c2VXYWxsZXRDbGllbnQoKTtcbiAgY29uc3QgW3Byb3ZpZGVyLCBzZXRQcm92aWRlcl0gPSB1c2VTdGF0ZTxBbmNob3JQcm92aWRlciB8IG51bGw+KG51bGwpO1xuXG4gIC8vIEFkZCB1dGlsaXR5IGZ1bmN0aW9uIHRvIGZvcm1hdCB0b2tlbiBhbW91bnRzXG4gIGNvbnN0IGZvcm1hdFRva2VuQW1vdW50ID0gKGFtb3VudDogbnVtYmVyKSA9PiB7XG4gICAgLy8gQ29udmVydCBmcm9tIDkgZGVjaW1hbHMgdG8gYSByZWFkYWJsZSBudW1iZXJcbiAgICBjb25zdCBmb3JtYXR0ZWRBbW91bnQgPSBhbW91bnQgLyAxZTk7XG4gICAgcmV0dXJuIGZvcm1hdHRlZEFtb3VudC50b0xvY2FsZVN0cmluZyh1bmRlZmluZWQsIHtcbiAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMixcbiAgICAgIG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMFxuICAgIH0pO1xuICB9O1xuXG4gIC8vIEFkZCB1dGlsaXR5IGZ1bmN0aW9uIHRvIGZvcm1hdCBTT0wgYW1vdW50c1xuICBjb25zdCBmb3JtYXRTb2xBbW91bnQgPSAoYW1vdW50OiBudW1iZXIpID0+IHtcbiAgICAvLyBDb252ZXJ0IGZyb20gbGFtcG9ydHMgKDkgZGVjaW1hbHMpIHRvIFNPTFxuICAgIGNvbnN0IGZvcm1hdHRlZEFtb3VudCA9IGFtb3VudCAvIDFlOTtcbiAgICByZXR1cm4gZm9ybWF0dGVkQW1vdW50LnRvTG9jYWxlU3RyaW5nKHVuZGVmaW5lZCwge1xuICAgICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiA0LFxuICAgICAgbWluaW11bUZyYWN0aW9uRGlnaXRzOiAyXG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ2FsY3VsYXRlIHRva2VucyB0byByZWNlaXZlIGJhc2VkIG9uIGFtb3VudCBhbmQgY3VycmVudCBzdGFnZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChhbW91bnQgJiYgIWlzTmFOKE51bWJlcihhbW91bnQpKSAmJiBjdXJyZW50U3RhZ2UgPiAwKSB7XG4gICAgICBjb25zdCBjdXJyZW50U3RhZ2VEYXRhID0gcHJlc2FsZVN0YWdlcy5maW5kKHMgPT4gcy5zdGFnZSA9PT0gY3VycmVudFN0YWdlKTtcbiAgICAgIGlmIChjdXJyZW50U3RhZ2VEYXRhKSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB0b2tlbnMgYmFzZWQgb24gVVNEIGFtb3VudCBhbmQgY3VycmVudCBzdGFnZSBwcmljZVxuICAgICAgICBjb25zdCB0b2tlbnMgPSBOdW1iZXIoYW1vdW50KSAvIGN1cnJlbnRTdGFnZURhdGEucHJpY2VQZXJUb2tlbjtcbiAgICAgICAgc2V0VG9rZW5zVG9SZWNlaXZlKHRva2Vucy50b0xvY2FsZVN0cmluZyh1bmRlZmluZWQsIHsgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAyIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRva2Vuc1RvUmVjZWl2ZSgnMCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUb2tlbnNUb1JlY2VpdmUoJzAnKTtcbiAgICB9XG4gIH0sIFthbW91bnQsIGN1cnJlbnRTdGFnZV0pO1xuXG4gIC8vIEFkZCBmdW5jdGlvbiB0byBnZXQgY3VycmVudCBzdGFnZSBpbmZvXG4gIGNvbnN0IGdldEN1cnJlbnRTdGFnZUluZm8gPSAoKSA9PiB7XG4gICAgcmV0dXJuIHByZXNhbGVTdGFnZXMuZmluZChzID0+IHMuc3RhZ2UgPT09IGN1cnJlbnRTdGFnZSkgfHwgcHJlc2FsZVN0YWdlc1swXTtcbiAgfTtcblxuICAvLyBBZGQgZnVuY3Rpb24gdG8gZm9ybWF0IHByaWNlXG4gIGNvbnN0IGZvcm1hdFByaWNlID0gKHByaWNlOiBudW1iZXIpID0+IHtcbiAgICByZXR1cm4gcHJpY2UudG9Mb2NhbGVTdHJpbmcodW5kZWZpbmVkLCB7XG4gICAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDQsXG4gICAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDRcbiAgICB9KTtcbiAgfTtcblxuICAvLyBIYW5kbGUgcGF5bWVudCBjaGFpbiBzZWxlY3Rpb25cbiAgY29uc3QgaGFuZGxlUGF5bWVudENoYWluU2VsZWN0ID0gKGNoYWluSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHNlbGVjdGVkT3B0aW9uID0gUEFZTUVOVF9PUFRJT05TLmZpbmQob3B0aW9uID0+IG9wdGlvbi5pZCA9PT0gY2hhaW5JZCk7XG4gICAgaWYgKHNlbGVjdGVkT3B0aW9uPy5pc0Rpc2FibGVkKSB7XG4gICAgICB0b2FzdC5lcnJvcignVGhpcyBwYXltZW50IG9wdGlvbiBpcyBjdXJyZW50bHkgZGlzYWJsZWQnLCB7XG4gICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2VsZWN0ZWRQYXltZW50Q2hhaW4oY2hhaW5JZCk7XG5cbiAgICAvLyBTd2l0Y2ggdG8gdGhlIHNlbGVjdGVkIG5ldHdvcmsgaWYgbmVlZGVkIChvbmx5IGZvciBFVk0gY2hhaW5zKVxuICAgIGlmIChjaGFpbklkICE9PSAnc29sYW5hJykge1xuICAgICAgY29uc3QgY2hhaW5JZE51bTogYW55ID0gUEFZTUVOVF9PUFRJT05TLmZpbmQob3B0aW9uID0+IG9wdGlvbi5pZCA9PT0gY2hhaW5JZCk/LmNoYWluSWQ7XG4gICAgICBpZiAoY2hhaW5JZE51bSAmJiBjaGFpbj8uaWQgIT09IGNoYWluSWROdW0gJiYgc3dpdGNoTmV0d29yaykge1xuICAgICAgICBzd2l0Y2hOZXR3b3JrKGNoYWluSWROdW0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb25zdCB7IGNvbm5lY3Rpb24gfSA9IHVzZUNvbm5lY3Rpb24oKTtcbiAgLy8gR2V0IEFuY2hvciBwcm92aWRlclxuICBjb25zdCBnZXRQcm92aWRlciA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoIXNvbGFuYVB1YmxpY0tleSB8fCAhY29ubmVjdGlvbikgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCB3YWxsZXQgPSB7XG4gICAgICBwdWJsaWNLZXk6IHNvbGFuYVB1YmxpY0tleSxcbiAgICAgIHNpZ25UcmFuc2FjdGlvbjogd2luZG93LnNvbGFuYT8uc2lnblRyYW5zYWN0aW9uISxcbiAgICAgIHNpZ25BbGxUcmFuc2FjdGlvbnM6IHdpbmRvdy5zb2xhbmE/LnNpZ25BbGxUcmFuc2FjdGlvbnMhLFxuICAgIH07XG5cbiAgICBjb25zdCBwcm92aWRlciA9IG5ldyBBbmNob3JQcm92aWRlcihcbiAgICAgIGNvbm5lY3Rpb24sXG4gICAgICB3YWxsZXQsXG4gICAgICB7IGNvbW1pdG1lbnQ6ICdwcm9jZXNzZWQnIH1cbiAgICApO1xuXG4gICAgLy8gU2V0IHRoZSBwcm92aWRlciBnbG9iYWxseVxuICAgIHNldFByb3ZpZGVyKHByb3ZpZGVyKTtcblxuICAgIHJldHVybiBwcm92aWRlcjtcbiAgfSwgW2Nvbm5lY3Rpb24sIHNvbGFuYVB1YmxpY0tleV0pO1xuXG4gIC8vIEdldCBwcm9ncmFtIGluc3RhbmNlXG4gIGNvbnN0IGdldFByb2dyYW0gPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSBnZXRQcm92aWRlcigpO1xuICAgIGlmICghcHJvdmlkZXIpIHJldHVybiBudWxsO1xuXG4gICAgLy8gQ3JlYXRlIGEgcHJvcGVyIFB1YmxpY0tleSBvYmplY3QgZm9yIHRoZSBwcm9ncmFtIElEXG4gICAgY29uc3QgcHJvZ3JhbUlkID0gbmV3IFB1YmxpY0tleShcIjNXMlBIMlhnR29rNHdlU1JwWEVqaFo1ZDhjcGNTejZnOTQxeVU5YmtnWnZGXCIpO1xuXG4gICAgLy8gUGFzcyB0aGUgcHJvZ3JhbUlkIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4gICAgcmV0dXJuIG5ldyBQcm9ncmFtPERvZ2VQcmVzYWxlPihJREwsIHByb2dyYW1JZCwgcHJvdmlkZXIpO1xuICB9LCBbZ2V0UHJvdmlkZXJdKTtcblxuICAvLyBQcmVzYWxlIHN0YXRlXG4gIGNvbnN0IFtpc0luaXRpYWxpemVkLCBzZXRJc0luaXRpYWxpemVkXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcbiAgY29uc3QgW2lzQWRtaW4sIHNldElzQWRtaW5dID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xuXG4gIC8vIENoZWNrIGlmIHRoZSBjb250cmFjdCBpcyBpbml0aWFsaXplZFxuICBjb25zdCBjaGVja0luaXRpYWxpemF0aW9uID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIGlmICghc29sYW5hQ29ubmVjdGVkIHx8ICFzb2xhbmFQdWJsaWNLZXkpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm9ncmFtID0gZ2V0UHJvZ3JhbSgpO1xuICAgICAgaWYgKCFwcm9ncmFtKSByZXR1cm47XG5cbiAgICAgIC8vIEdldCB0aGUgdHJhbnNhY3Rpb24gcmVjb3JkIFBEQVxuICAgICAgY29uc3QgW3RyYW5zYWN0aW9uUmVjb3JkXSA9IFB1YmxpY0tleS5maW5kUHJvZ3JhbUFkZHJlc3NTeW5jKFxuICAgICAgICBbQnVmZmVyLmZyb20oXCJ0cmFuc2FjdGlvbl9yZWNvcmRcIildLFxuICAgICAgICBwcm9ncmFtLnByb2dyYW1JZFxuICAgICAgKTtcblxuICAgICAgLy8gVHJ5IHRvIGZldGNoIHRoZSBhY2NvdW50IHVzaW5nIGEgbW9yZSBnZW5lcmljIGFwcHJvYWNoXG4gICAgICB0cnkge1xuICAgICAgICAvLyBVc2UgdGhlIGNvbm5lY3Rpb24gZGlyZWN0bHkgdG8gY2hlY2sgaWYgdGhlIGFjY291bnQgZXhpc3RzXG4gICAgICAgIGNvbnN0IGFjY291bnRJbmZvID0gYXdhaXQgY29ubmVjdGlvbi5nZXRBY2NvdW50SW5mbyh0cmFuc2FjdGlvblJlY29yZCk7XG4gICAgICAgIGNvbnN0IGlzSW5pdGlhbGl6ZWQgPSAhIWFjY291bnRJbmZvO1xuICAgICAgICBzZXRJc0luaXRpYWxpemVkKGlzSW5pdGlhbGl6ZWQpO1xuXG4gICAgICAgIGlmIChpc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIGFjY291bnQgZXhpc3RzLCB3ZSdsbCBhc3N1bWUgdGhlIGN1cnJlbnQgdXNlciBpcyB0aGUgYWRtaW4gZm9yIG5vd1xuICAgICAgICAgIC8vIEluIGEgcHJvZHVjdGlvbiBhcHAsIHlvdSB3b3VsZCB3YW50IHRvIHByb3Blcmx5IGRlY29kZSB0aGUgYWNjb3VudCBkYXRhXG4gICAgICAgICAgc2V0SXNBZG1pbih0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgYWNjb3VudDonLCBlcnJvcik7XG4gICAgICAgIHNldElzSW5pdGlhbGl6ZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjaGVja2luZyBpbml0aWFsaXphdGlvbjonLCBlcnJvcik7XG4gICAgICBzZXRJc0luaXRpYWxpemVkKGZhbHNlKTtcbiAgICB9XG4gIH0sIFtzb2xhbmFDb25uZWN0ZWQsIHNvbGFuYVB1YmxpY0tleSwgZ2V0UHJvZ3JhbSwgY29ubmVjdGlvbl0pO1xuXG4gIC8vIEluaXRpYWxpemUgdGhlIGNvbnRyYWN0XG4gIGNvbnN0IGhhbmRsZUluaXRpYWxpemUgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFzb2xhbmFDb25uZWN0ZWQgfHwgIXNvbGFuYVB1YmxpY0tleSkge1xuICAgICAgdG9hc3QuZXJyb3IoJ1BsZWFzZSBjb25uZWN0IHlvdXIgU29sYW5hIHdhbGxldCBmaXJzdCcsIHtcbiAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIGF1dG9DbG9zZTogNTAwMCxcbiAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRJc1Byb2Nlc3NpbmcodHJ1ZSk7XG4gICAgdG9hc3QuaW5mbygnSW5pdGlhbGl6aW5nIGNvbnRyYWN0Li4uJywge1xuICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICBoaWRlUHJvZ3Jlc3NCYXI6IGZhbHNlLFxuICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgfSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSBnZXRQcm92aWRlcigpO1xuICAgICAgaWYgKCFwcm92aWRlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9ncmFtID0gZ2V0UHJvZ3JhbSgpO1xuICAgICAgaWYgKCFwcm9ncmFtIHx8ICFzb2xhbmFQdWJsaWNLZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9ncmFtIG9yIHdhbGxldCBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgW3RyYW5zYWN0aW9uUmVjb3JkXSA9IFB1YmxpY0tleS5maW5kUHJvZ3JhbUFkZHJlc3NTeW5jKFxuICAgICAgICBbQnVmZmVyLmZyb20oXCJ0cmFuc2FjdGlvbl9yZWNvcmRcIildLFxuICAgICAgICBwcm9ncmFtLnByb2dyYW1JZFxuICAgICAgKTtcblxuICAgICAgY29uc3QgYWNjb3VudEluZm8gPSBhd2FpdCBjb25uZWN0aW9uLmdldEFjY291bnRJbmZvKHRyYW5zYWN0aW9uUmVjb3JkKTtcbiAgICAgIGlmIChhY2NvdW50SW5mbykge1xuICAgICAgICB0b2FzdC5pbmZvKCdDb250cmFjdCBhbHJlYWR5IGluaXRpYWxpemVkJywge1xuICAgICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICAgIGF1dG9DbG9zZTogNTAwMCxcbiAgICAgICAgICBoaWRlUHJvZ3Jlc3NCYXI6IGZhbHNlLFxuICAgICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0SXNJbml0aWFsaXplZCh0cnVlKTtcbiAgICAgICAgc2V0SXNBZG1pbih0cnVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBTdGVwIDE6IEluaXRpYWxpemUgd2l0aCBtaW5pbWFsIHNwYWNlXG4gICAgICBjb25zdCBpbml0VHggPSBhd2FpdCBwcm9ncmFtLm1ldGhvZHNcbiAgICAgICAgLmluaXRpYWxpemUoKVxuICAgICAgICAuYWNjb3VudHMoe1xuICAgICAgICAgIGF1dGhvcml0eTogc29sYW5hUHVibGljS2V5LFxuICAgICAgICAgIHRyYW5zYWN0aW9uUmVjb3JkOiB0cmFuc2FjdGlvblJlY29yZCxcbiAgICAgICAgICBzeXN0ZW1Qcm9ncmFtOiBTeXN0ZW1Qcm9ncmFtLnByb2dyYW1JZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnJwYygpO1xuXG4gICAgICB0b2FzdC5pbmZvKCdDb250cmFjdCBpbml0aWFsaXplZCwgcmVzaXppbmcgYWNjb3VudC4uLicsIHtcbiAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIGF1dG9DbG9zZTogNTAwMCxcbiAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICB9KTtcblxuICAgICAgLy8gU3RlcCAyOiBSZXNpemUgdG8gcmVxdWlyZWQgc3BhY2VcbiAgICAgIGNvbnN0IHJlc2l6ZVR4ID0gYXdhaXQgcHJvZ3JhbS5tZXRob2RzXG4gICAgICAgIC5yZXNpemUoKVxuICAgICAgICAuYWNjb3VudHMoe1xuICAgICAgICAgIGF1dGhvcml0eTogc29sYW5hUHVibGljS2V5LFxuICAgICAgICAgIHRyYW5zYWN0aW9uUmVjb3JkOiB0cmFuc2FjdGlvblJlY29yZCxcbiAgICAgICAgICBzeXN0ZW1Qcm9ncmFtOiBTeXN0ZW1Qcm9ncmFtLnByb2dyYW1JZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnJwYygpO1xuXG4gICAgICB0b2FzdC5zdWNjZXNzKGBDb250cmFjdCBpbml0aWFsaXplZCBhbmQgcmVzaXplZCEgSW5pdCBIYXNoOiAke2luaXRUeH0sIFJlc2l6ZSBIYXNoOiAke3Jlc2l6ZVR4fWAsIHtcbiAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIGF1dG9DbG9zZTogNTAwMCxcbiAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICB9KTtcblxuICAgICAgc2V0SXNJbml0aWFsaXplZCh0cnVlKTtcbiAgICAgIHNldElzQWRtaW4odHJ1ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0luaXRpYWxpemF0aW9uIGVycm9yOicsIGVycm9yKTtcbiAgICAgIHRvYXN0LmVycm9yKCdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBjb250cmFjdC4gUGxlYXNlIHRyeSBhZ2Fpbi4nLCB7XG4gICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgfSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzUHJvY2Vzc2luZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGUgdHJlYXN1cnkgYWNjb3VudFxuICBjb25zdCBjcmVhdGVUcmVhc3VyeUFjY291bnQgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFzb2xhbmFDb25uZWN0ZWQgfHwgIXNvbGFuYVB1YmxpY0tleSkge1xuICAgICAgdG9hc3QuZXJyb3IoJ1BsZWFzZSBjb25uZWN0IHlvdXIgU29sYW5hIHdhbGxldCBmaXJzdCcsIHtcbiAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIGF1dG9DbG9zZTogNTAwMCxcbiAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRJc1Byb2Nlc3NpbmcodHJ1ZSk7XG4gICAgdG9hc3QuaW5mbygnQ3JlYXRpbmcgdHJlYXN1cnkgYWNjb3VudC4uLicsIHtcbiAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENyZWF0ZSBhIG5ldyBhY2NvdW50IGZvciB0aGUgdHJlYXN1cnlcbiAgICAgIGNvbnN0IHRyZWFzdXJ5S2V5cGFpciA9IEtleXBhaXIuZ2VuZXJhdGUoKTtcblxuICAgICAgLy8gR2V0IHRoZSBtaW5pbXVtIHJlbnQgZm9yIHRoZSBhY2NvdW50XG4gICAgICBjb25zdCByZW50RXhlbXB0aW9uID0gYXdhaXQgY29ubmVjdGlvbi5nZXRNaW5pbXVtQmFsYW5jZUZvclJlbnRFeGVtcHRpb24oMCk7XG5cbiAgICAgIC8vIENyZWF0ZSB0aGUgYWNjb3VudFxuICAgICAgY29uc3QgY3JlYXRlQWNjb3VudEl4ID0gU3lzdGVtUHJvZ3JhbS5jcmVhdGVBY2NvdW50KHtcbiAgICAgICAgZnJvbVB1YmtleTogc29sYW5hUHVibGljS2V5LFxuICAgICAgICBuZXdBY2NvdW50UHVia2V5OiB0cmVhc3VyeUtleXBhaXIucHVibGljS2V5LFxuICAgICAgICBsYW1wb3J0czogcmVudEV4ZW1wdGlvbixcbiAgICAgICAgc3BhY2U6IDAsXG4gICAgICAgIHByb2dyYW1JZDogU3lzdGVtUHJvZ3JhbS5wcm9ncmFtSWQsXG4gICAgICB9KTtcblxuICAgICAgLy8gQ3JlYXRlIGEgdHJhbnNhY3Rpb25cbiAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKCkuYWRkKGNyZWF0ZUFjY291bnRJeCk7XG5cbiAgICAgIC8vIFNlbmQgdGhlIHRyYW5zYWN0aW9uXG4gICAgICBjb25zdCB0eCA9IGF3YWl0IGNvbm5lY3Rpb24uc2VuZFRyYW5zYWN0aW9uKFxuICAgICAgICB0cmFuc2FjdGlvbixcbiAgICAgICAgW3RyZWFzdXJ5S2V5cGFpcl1cbiAgICAgICk7XG5cbiAgICAgIHRvYXN0LnN1Y2Nlc3MoYFRyZWFzdXJ5IGFjY291bnQgY3JlYXRlZCEgSGFzaDogJHt0eH1gLCB7XG4gICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFNhdmUgdGhlIHRyZWFzdXJ5IHB1YmxpYyBrZXkgZm9yIGZ1dHVyZSB1c2VcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0cmVhc3VyeVB1YmxpY0tleScsIHRyZWFzdXJ5S2V5cGFpci5wdWJsaWNLZXkudG9TdHJpbmcoKSk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignQ3JlYXRlIHRyZWFzdXJ5IGVycm9yOicsIGVycm9yKTtcbiAgICAgIHRvYXN0LmVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHRyZWFzdXJ5IGFjY291bnQuIFBsZWFzZSB0cnkgYWdhaW4uJywge1xuICAgICAgICBwb3NpdGlvbjogXCJib3R0b20tcmlnaHRcIixcbiAgICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgICBoaWRlUHJvZ3Jlc3NCYXI6IGZhbHNlLFxuICAgICAgICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gICAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgICAuLi50b2FzdFN0eWxlcyxcbiAgICAgIH0pO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRJc1Byb2Nlc3NpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBBZGQgaGFuZGxlTmV4dFN0YWdlIGZ1bmN0aW9uXG4gIGNvbnN0IGhhbmRsZU5leHRTdGFnZSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIXNvbGFuYUNvbm5lY3RlZCB8fCAhc29sYW5hUHVibGljS2V5IHx8ICFpc0FkbWluKSB7XG4gICAgICBjb25zb2xlLmxvZygnQ2Fubm90IGFkdmFuY2Ugc3RhZ2U6JywgeyBcbiAgICAgICAgc29sYW5hQ29ubmVjdGVkLCBcbiAgICAgICAgc29sYW5hUHVibGljS2V5OiBzb2xhbmFQdWJsaWNLZXk/LnRvU3RyaW5nKCksIFxuICAgICAgICBpc0FkbWluIFxuICAgICAgfSk7XG4gICAgICB0b2FzdC5lcnJvcignWW91IG11c3QgYmUgdGhlIGFkbWluIHRvIGFkdmFuY2UgdG8gdGhlIG5leHQgc3RhZ2UnLCB7XG4gICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0SXNQcm9jZXNzaW5nKHRydWUpO1xuICAgIGNvbnNvbGUubG9nKCdBZHZhbmNpbmcgdG8gbmV4dCBzdGFnZS4uLicpO1xuICAgIHRvYXN0LmluZm8oJ0FkdmFuY2luZyB0byBuZXh0IHN0YWdlLi4uJywge1xuICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICBoaWRlUHJvZ3Jlc3NCYXI6IGZhbHNlLFxuICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgfSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSBnZXRQcm92aWRlcigpO1xuICAgICAgaWYgKCFwcm92aWRlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9ncmFtID0gZ2V0UHJvZ3JhbSgpO1xuICAgICAgaWYgKCFwcm9ncmFtIHx8ICFzb2xhbmFQdWJsaWNLZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9ncmFtIG9yIHdhbGxldCBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSB0cmFuc2FjdGlvbiByZWNvcmQgUERBXG4gICAgICBjb25zdCBbdHJhbnNhY3Rpb25SZWNvcmRdID0gUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzc1N5bmMoXG4gICAgICAgIFtCdWZmZXIuZnJvbShcInRyYW5zYWN0aW9uX3JlY29yZFwiKV0sXG4gICAgICAgIHByb2dyYW0ucHJvZ3JhbUlkXG4gICAgICApO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZygnVHJhbnNhY3Rpb24gcmVjb3JkIFBEQTonLCB0cmFuc2FjdGlvblJlY29yZC50b1N0cmluZygpKTtcbiAgICAgIGNvbnNvbGUubG9nKCdDdXJyZW50IHN0YWdlIGJlZm9yZSBhZHZhbmNlbWVudDonLCBjdXJyZW50U3RhZ2UpO1xuXG4gICAgICAvLyBDYWxsIHRoZSBuZXh0U3RhZ2UgaW5zdHJ1Y3Rpb25cbiAgICAgIGNvbnN0IHR4ID0gYXdhaXQgcHJvZ3JhbS5tZXRob2RzXG4gICAgICAgIC5uZXh0U3RhZ2UoKVxuICAgICAgICAuYWNjb3VudHMoe1xuICAgICAgICAgIGF1dGhvcml0eTogc29sYW5hUHVibGljS2V5LFxuICAgICAgICAgIHRyYW5zYWN0aW9uUmVjb3JkOiB0cmFuc2FjdGlvblJlY29yZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnJwYygpO1xuXG4gICAgICBjb25zb2xlLmxvZygnTmV4dCBzdGFnZSB0cmFuc2FjdGlvbjonLCB0eCk7XG4gICAgICBjb25zb2xlLmxvZygnQWR2YW5jZWQgdG8gbmV4dCBzdGFnZSBzdWNjZXNzZnVsbHknKTtcblxuICAgICAgdG9hc3Quc3VjY2VzcyhgQWR2YW5jZWQgdG8gbmV4dCBzdGFnZSEgSGFzaDogJHt0eH1gLCB7XG4gICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlZnJlc2ggdGhlIHByZXNhbGUgZGF0YVxuICAgICAgZmV0Y2hQcmVzYWxlRGF0YSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdOZXh0IHN0YWdlIGVycm9yOicsIGVycm9yKTtcbiAgICAgIHRvYXN0LmVycm9yKCdGYWlsZWQgdG8gYWR2YW5jZSB0byBuZXh0IHN0YWdlLiBQbGVhc2UgdHJ5IGFnYWluLicsIHtcbiAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIGF1dG9DbG9zZTogNTAwMCxcbiAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICB9KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNQcm9jZXNzaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmVzdG9yZSB0aGUgaGFuZGxlU29sYW5hQnV5IGZ1bmN0aW9uXG4gIGNvbnN0IGhhbmRsZVNvbGFuYUJ1eSA9IGFzeW5jIChhbW91bnQ6IG51bWJlcikgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm92aWRlciA9IGdldFByb3ZpZGVyKCk7XG4gICAgICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUHJvdmlkZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb2dyYW0gPSBnZXRQcm9ncmFtKCk7XG4gICAgICBpZiAoIXByb2dyYW0gfHwgIXNvbGFuYVB1YmxpY0tleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2dyYW0gb3Igd2FsbGV0IG5vdCBpbml0aWFsaXplZCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBHZXQgdGhlIHRyYW5zYWN0aW9uIHJlY29yZCBQREFcbiAgICAgIGNvbnN0IFt0cmFuc2FjdGlvblJlY29yZF0gPSBQdWJsaWNLZXkuZmluZFByb2dyYW1BZGRyZXNzU3luYyhcbiAgICAgICAgW0J1ZmZlci5mcm9tKFwidHJhbnNhY3Rpb25fcmVjb3JkXCIpXSxcbiAgICAgICAgcHJvZ3JhbS5wcm9ncmFtSWRcbiAgICAgICk7XG5cbiAgICAgIC8vIFVzZSB0aGUgYXV0aG9yaXR5IHdhbGxldCBhZGRyZXNzIGFzIHRoZSB0cmVhc3VyeVxuICAgICAgY29uc3QgdHJlYXN1cnlXYWxsZXQgPSBuZXcgUHVibGljS2V5KFwiQXlXQ25FYnBEZFZkc3dlSzZNZm5NTDVGcFRMUXBYQXpTaW43YjdESm53cTNcIik7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSB0cmFuc2FjdGlvbiByZWNvcmQgYWNjb3VudCBleGlzdHNcbiAgICAgIGNvbnN0IHRyYW5zYWN0aW9uUmVjb3JkSW5mbyA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0QWNjb3VudEluZm8odHJhbnNhY3Rpb25SZWNvcmQpO1xuICAgICAgaWYgKCF0cmFuc2FjdGlvblJlY29yZEluZm8pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUcmFuc2FjdGlvbiByZWNvcmQgYWNjb3VudCBub3QgZm91bmQuIENvbnRyYWN0IG1heSBub3QgYmUgaW5pdGlhbGl6ZWQuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbGwgdGhlIGJ1eSBpbnN0cnVjdGlvbiB3aXRoIHRoZSBuZXcgcGFyYW1ldGVyIHR5cGUgKGY2NCBpbnN0ZWFkIG9mIHU2NClcbiAgICAgIGNvbnN0IHR4ID0gYXdhaXQgcHJvZ3JhbS5tZXRob2RzXG4gICAgICAgIC5idXkoYW1vdW50KSAvLyBOb3cgcGFzc2luZyBhIGY2NCB2YWx1ZSBkaXJlY3RseVxuICAgICAgICAuYWNjb3VudHMoe1xuICAgICAgICAgIGJ1eWVyOiBzb2xhbmFQdWJsaWNLZXksXG4gICAgICAgICAgdHJlYXN1cnk6IHRyZWFzdXJ5V2FsbGV0LFxuICAgICAgICAgIHRyYW5zYWN0aW9uUmVjb3JkOiB0cmFuc2FjdGlvblJlY29yZCxcbiAgICAgICAgICBzeXN0ZW1Qcm9ncmFtOiBTeXN0ZW1Qcm9ncmFtLnByb2dyYW1JZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnJwYygpO1xuXG4gICAgICByZXR1cm4gdHg7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1NvbGFuYSBidXkgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9O1xuXG4gIC8vIEFkZCBmZXRjaFByZXNhbGVEYXRhIGZ1bmN0aW9uIHRvIHJlZnJlc2ggZGF0YSBhZnRlciBzdGFnZSBjaGFuZ2VcbiAgY29uc3QgZmV0Y2hQcmVzYWxlRGF0YSA9IHVzZUNhbGxiYWNrKGFzeW5jICgpID0+IHtcbiAgICBpZiAoIXNvbGFuYUNvbm5lY3RlZCB8fCAhc29sYW5hUHVibGljS2V5KSB7XG4gICAgICBjb25zb2xlLmxvZygnQ2Fubm90IGZldGNoIHByZXNhbGUgZGF0YTogd2FsbGV0IG5vdCBjb25uZWN0ZWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIHByZXNhbGUgZGF0YS4uLicpO1xuICAgICAgY29uc3QgcHJvZ3JhbSA9IGdldFByb2dyYW0oKTtcbiAgICAgIGlmICghcHJvZ3JhbSkge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvZ3JhbSBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBHZXQgdGhlIHRyYW5zYWN0aW9uIHJlY29yZCBQREFcbiAgICAgIGNvbnN0IFt0cmFuc2FjdGlvblJlY29yZF0gPSBQdWJsaWNLZXkuZmluZFByb2dyYW1BZGRyZXNzU3luYyhcbiAgICAgICAgW0J1ZmZlci5mcm9tKFwidHJhbnNhY3Rpb25fcmVjb3JkXCIpXSxcbiAgICAgICAgcHJvZ3JhbS5wcm9ncmFtSWRcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCdUcmFuc2FjdGlvbiByZWNvcmQgUERBOicsIHRyYW5zYWN0aW9uUmVjb3JkLnRvU3RyaW5nKCkpO1xuXG4gICAgICAvLyBGZXRjaCB0aGUgdHJhbnNhY3Rpb24gcmVjb3JkIGFjY291bnRcbiAgICAgIGNvbnN0IGFjY291bnQgPSBhd2FpdCBwcm9ncmFtLmFjY291bnQudHJhbnNhY3Rpb25SZWNvcmQuZmV0Y2godHJhbnNhY3Rpb25SZWNvcmQpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZygnRmV0Y2hlZCBhY2NvdW50IGRhdGE6Jywge1xuICAgICAgICBjdXJyZW50U3RhZ2U6IGFjY291bnQuY3VycmVudFN0YWdlLFxuICAgICAgICB0b3RhbFVzZFNvbGQ6IGFjY291bnQudG90YWxVc2RTb2xkLFxuICAgICAgICB0b3RhbFRva2Vuc1NvbGQ6IGFjY291bnQudG90YWxUb2tlbnNTb2xkLFxuICAgICAgICB0cmFuc2FjdGlvbkNvdW50OiBhY2NvdW50LnRyYW5zYWN0aW9uQ291bnQsXG4gICAgICAgIGF1dGhvcml0eTogYWNjb3VudC5hdXRob3JpdHkudG9TdHJpbmcoKSxcbiAgICAgICAgY3VycmVudFVzZXI6IHNvbGFuYVB1YmxpY0tleS50b1N0cmluZygpLFxuICAgICAgICBpc0FkbWluOiBhY2NvdW50LmF1dGhvcml0eS5lcXVhbHMoc29sYW5hUHVibGljS2V5KVxuICAgICAgICBcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBVcGRhdGUgc3RhdGUgd2l0aCBmZXRjaGVkIGRhdGFcbiAgICAgIHNldEN1cnJlbnRTdGFnZShhY2NvdW50LmN1cnJlbnRTdGFnZSArIDEpO1xuICAgICAgc2V0VG90YWxVc2RTb2xkKGFjY291bnQudG90YWxVc2RTb2xkKTtcbiAgICAgIHNldFRvdGFsVG9rZW5zU29sZChhY2NvdW50LnRvdGFsVG9rZW5zU29sZCk7XG4gICAgICBzZXRUcmFuc2FjdGlvbnMoYWNjb3VudC50cmFuc2FjdGlvbnMpO1xuICAgICAgXG4gICAgICAvLyBDaGVjayBpZiB0aGUgY3VycmVudCB1c2VyIGlzIHRoZSBhZG1pblxuICAgICAgY29uc3QgaXNVc2VyQWRtaW4gPSBhY2NvdW50LmF1dGhvcml0eS5lcXVhbHMoc29sYW5hUHVibGljS2V5KTtcbiAgICAgIGNvbnNvbGUubG9nKCdJcyB1c2VyIGFkbWluPycsIGlzVXNlckFkbWluKTtcbiAgICAgIHNldElzQWRtaW4oaXNVc2VyQWRtaW4pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBwcmVzYWxlIGRhdGE6JywgZXJyb3IpO1xuICAgIH1cbiAgfSwgW3NvbGFuYUNvbm5lY3RlZCwgc29sYW5hUHVibGljS2V5LCBnZXRQcm9ncmFtXSk7XG5cbiAgLy8gSGFuZGxlIGJ1eSB0b2tlbnNcbiAgY29uc3QgaGFuZGxlQnV5VG9rZW5zID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghc29sYW5hQ29ubmVjdGVkKSB7XG4gICAgICB0b2FzdC5lcnJvcignUGxlYXNlIGNvbm5lY3QgeW91ciBTb2xhbmEgd2FsbGV0IGZpcnN0Jywge1xuICAgICAgICBwb3NpdGlvbjogXCJib3R0b20tcmlnaHRcIixcbiAgICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgICBoaWRlUHJvZ3Jlc3NCYXI6IGZhbHNlLFxuICAgICAgICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gICAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgICAuLi50b2FzdFN0eWxlcyxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChOdW1iZXIoYW1vdW50KSA8IDEpIHtcbiAgICAgIHRvYXN0LmVycm9yKCdNaW5pbXVtIHB1cmNoYXNlIGFtb3VudCBpcyAkMScsIHtcbiAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIGF1dG9DbG9zZTogNTAwMCxcbiAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc2VsZWN0ZWRQYXltZW50Q2hhaW4gPT09ICdzb2xhbmEnKSB7XG4gICAgICBpZiAoIWlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgdG9hc3QuZXJyb3IoJ0NvbnRyYWN0IG5vdCBpbml0aWFsaXplZC4gUGxlYXNlIGNvbnRhY3QgdGhlIGFkbWluLicsIHtcbiAgICAgICAgICBwb3NpdGlvbjogXCJib3R0b20tcmlnaHRcIixcbiAgICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gICAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgICAuLi50b2FzdFN0eWxlcyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRm9yIEVWTSBjaGFpbnMsIHdlIG5lZWQgRVZNIGNvbm5lY3Rpb25cbiAgICAgIGlmICghZXZtQ29ubmVjdGVkIHx8ICFzZWxlY3RlZFBheW1lbnRDaGFpbikge1xuICAgICAgICB0b2FzdC5lcnJvcignUGxlYXNlIGNvbm5lY3QgeW91ciBwYXltZW50IHdhbGxldCBhbmQgc2VsZWN0IGEgcGF5bWVudCBjaGFpbicsIHtcbiAgICAgICAgICBwb3NpdGlvbjogXCJib3R0b20tcmlnaHRcIixcbiAgICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gICAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgICAuLi50b2FzdFN0eWxlcyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFhbW91bnQgfHwgaXNOYU4oTnVtYmVyKGFtb3VudCkpIHx8IE51bWJlcihhbW91bnQpIDw9IDApIHtcbiAgICAgICAgdG9hc3QuZXJyb3IoJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGFtb3VudCcsIHtcbiAgICAgICAgICBwb3NpdGlvbjogXCJib3R0b20tcmlnaHRcIixcbiAgICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gICAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgICAuLi50b2FzdFN0eWxlcyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRJc1Byb2Nlc3NpbmcodHJ1ZSk7XG4gICAgdG9hc3QuaW5mbygnUHJvY2Vzc2luZyB0cmFuc2FjdGlvbi4uLicsIHtcbiAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmIChzZWxlY3RlZFBheW1lbnRDaGFpbiA9PT0gJ3NvbGFuYScpIHtcbiAgICAgICAgLy8gQ29udmVydCBhbW91bnQgdG8gYSBudW1iZXIgYW5kIGVuc3VyZSBpdCdzIHZhbGlkXG4gICAgICAgIGNvbnN0IGFtb3VudE51bSA9IE51bWJlcihhbW91bnQpO1xuICAgICAgICBpZiAoaXNOYU4oYW1vdW50TnVtKSB8fCBhbW91bnROdW0gPD0gMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhbW91bnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHR4ID0gYXdhaXQgaGFuZGxlU29sYW5hQnV5KGFtb3VudE51bSk7XG5cbiAgICAgICAgdG9hc3Quc3VjY2VzcyhgVHJhbnNhY3Rpb24gc3VibWl0dGVkISBIYXNoOiAke3R4fWAsIHtcbiAgICAgICAgICBwb3NpdGlvbjogXCJib3R0b20tcmlnaHRcIixcbiAgICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gICAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgICAuLi50b2FzdFN0eWxlcyxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHNlbGVjdGVkUGF5bWVudENoYWluID09PSAnYmFzZScpIHtcbiAgICAgICAgaWYgKCF3YWxsZXRDbGllbnQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dhbGxldCBjbGllbnQgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29udmVydCBhbW91bnQgdG8gY2VudHMgKG11bHRpcGx5IGJ5IDEwMClcbiAgICAgICAgY29uc3QgYW1vdW50SW5DZW50cyA9IEJpZ0ludChNYXRoLmZsb29yKHBhcnNlRmxvYXQoYW1vdW50KSkpO1xuXG4gICAgICAgIC8vIEdldCBxdW90ZSBmb3IgRVRIIGFtb3VudFxuICAgICAgICBjb25zdCBxdW90ZSA9IGF3YWl0IHB1YmxpY0NsaWVudC5yZWFkQ29udHJhY3Qoe1xuICAgICAgICAgIC4uLkJBU0VfRVRIX0NPTlRSQUNULFxuICAgICAgICAgIGZ1bmN0aW9uTmFtZTogJ2dldFF1b3RlJyxcbiAgICAgICAgICBhcmdzOiBbYW1vdW50SW5DZW50c10sXG4gICAgICAgIH0pIGFzIGJpZ2ludDtcblxuICAgICAgICAvLyBNYWtlIHRoZSBwdXJjaGFzZVxuICAgICAgICBjb25zdCBoYXNoID0gYXdhaXQgd2FsbGV0Q2xpZW50LndyaXRlQ29udHJhY3Qoe1xuICAgICAgICAgIC4uLkJBU0VfRVRIX0NPTlRSQUNULFxuICAgICAgICAgIGZ1bmN0aW9uTmFtZTogJ3B1cmNoYXNlV2l0aFVTREFtb3VudCcsXG4gICAgICAgICAgYXJnczogW2Ftb3VudEluQ2VudHMsIHNvbGFuYVB1YmxpY0tleT8udG9TdHJpbmcoKSB8fCAnJ10sXG4gICAgICAgICAgdmFsdWU6IHF1b3RlLFxuICAgICAgICB9KTtcblxuICAgICAgICB0b2FzdC5zdWNjZXNzKGBUcmFuc2FjdGlvbiBzdWJtaXR0ZWQhIEhhc2g6ICR7aGFzaH1gLCB7XG4gICAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdhaXQgZm9yIHRyYW5zYWN0aW9uIGNvbmZpcm1hdGlvblxuICAgICAgICBjb25zdCByZWNlaXB0ID0gYXdhaXQgcHVibGljQ2xpZW50LndhaXRGb3JUcmFuc2FjdGlvblJlY2VpcHQoeyBoYXNoIH0pO1xuICAgICAgICBpZiAocmVjZWlwdC5zdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgIHRvYXN0LnN1Y2Nlc3MoJ1RyYW5zYWN0aW9uIGNvbmZpcm1lZCEgRG9nZS1IZWFkIHRva2VucyB3aWxsIGJlIHNlbnQgdG8geW91ciBTb2xhbmEgd2FsbGV0LicsIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVHJhbnNhY3Rpb24gZmFpbGVkJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoc2VsZWN0ZWRQYXltZW50Q2hhaW4gPT09ICdic2MnKSB7XG4gICAgICAgIGlmICghd2FsbGV0Q2xpZW50KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYWxsZXQgY2xpZW50IG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnZlcnQgYW1vdW50IHRvIGNlbnRzIChtdWx0aXBseSBieSAxMDApXG4gICAgICAgIGNvbnN0IGFtb3VudEluQ2VudHMgPSBCaWdJbnQoTWF0aC5mbG9vcihwYXJzZUZsb2F0KGFtb3VudCkpKTtcblxuICAgICAgICAvLyBHZXQgcXVvdGUgZm9yIEJOQiBhbW91bnRcbiAgICAgICAgY29uc3QgcXVvdGUgPSBhd2FpdCBwdWJsaWNDbGllbnQucmVhZENvbnRyYWN0KHtcbiAgICAgICAgICAuLi5CU0NfQ09OVFJBQ1QsXG4gICAgICAgICAgZnVuY3Rpb25OYW1lOiAnZ2V0UXVvdGUnLFxuICAgICAgICAgIGFyZ3M6IFthbW91bnRJbkNlbnRzXSxcbiAgICAgICAgfSkgYXMgYmlnaW50O1xuXG4gICAgICAgIC8vIE1ha2UgdGhlIHB1cmNoYXNlXG4gICAgICAgIGNvbnN0IGhhc2ggPSBhd2FpdCB3YWxsZXRDbGllbnQud3JpdGVDb250cmFjdCh7XG4gICAgICAgICAgLi4uQlNDX0NPTlRSQUNULFxuICAgICAgICAgIGZ1bmN0aW9uTmFtZTogJ3B1cmNoYXNlV2l0aFVTREFtb3VudCcsXG4gICAgICAgICAgYXJnczogW2Ftb3VudEluQ2VudHMsIHNvbGFuYVB1YmxpY0tleT8udG9TdHJpbmcoKSB8fCAnJ10sXG4gICAgICAgICAgdmFsdWU6IHF1b3RlLFxuICAgICAgICB9KTtcblxuICAgICAgICB0b2FzdC5zdWNjZXNzKGBUcmFuc2FjdGlvbiBzdWJtaXR0ZWQhIEhhc2g6ICR7aGFzaH1gLCB7XG4gICAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdhaXQgZm9yIHRyYW5zYWN0aW9uIGNvbmZpcm1hdGlvblxuICAgICAgICBjb25zdCByZWNlaXB0ID0gYXdhaXQgcHVibGljQ2xpZW50LndhaXRGb3JUcmFuc2FjdGlvblJlY2VpcHQoeyBoYXNoIH0pO1xuICAgICAgICBpZiAocmVjZWlwdC5zdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgIHRvYXN0LnN1Y2Nlc3MoJ1RyYW5zYWN0aW9uIGNvbmZpcm1lZCEgRG9nZS1IZWFkIHRva2VucyB3aWxsIGJlIHNlbnQgdG8geW91ciBTb2xhbmEgd2FsbGV0LicsIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgICAgICAgaGlkZVByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVHJhbnNhY3Rpb24gZmFpbGVkJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNpbXVsYXRlIHRyYW5zYWN0aW9uIGZvciBvdGhlciBjaGFpbnMgKHJlcGxhY2Ugd2l0aCBhY3R1YWwgaW1wbGVtZW50YXRpb24pXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAyMDAwKSk7XG4gICAgICAgIHRvYXN0LnN1Y2Nlc3MoJ1RyYW5zYWN0aW9uIHN1Y2Nlc3NmdWwhIERvZ2UtSGVhZCB0b2tlbnMgd2lsbCBiZSBzZW50IHRvIHlvdXIgU29sYW5hIHdhbGxldC4nLCB7XG4gICAgICAgICAgcG9zaXRpb246IFwiYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgICAgYXV0b0Nsb3NlOiA1MDAwLFxuICAgICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgICAgLi4udG9hc3RTdHlsZXMsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBBZnRlciBzdWNjZXNzZnVsIHRyYW5zYWN0aW9uXG4gICAgICBhd2FpdCBmZXRjaFRyYW5zYWN0aW9uUmVjb3JkKCk7IC8vIFJlZnJlc2ggdGhlIGRhdGFcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignVHJhbnNhY3Rpb24gZXJyb3I6JywgZXJyb3IpO1xuICAgICAgdG9hc3QuZXJyb3IoJ1RyYW5zYWN0aW9uIGZhaWxlZC4gUGxlYXNlIHRyeSBhZ2Fpbi4nLCB7XG4gICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgfSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzUHJvY2Vzc2luZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIENoZWNrIGluaXRpYWxpemF0aW9uIHN0YXR1cyB3aGVuIHdhbGxldCBjb25uZWN0c1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChzb2xhbmFDb25uZWN0ZWQgJiYgc29sYW5hUHVibGljS2V5KSB7XG4gICAgICBjaGVja0luaXRpYWxpemF0aW9uKCk7XG4gICAgfVxuICB9LCBbc29sYW5hQ29ubmVjdGVkLCBzb2xhbmFQdWJsaWNLZXksIGNoZWNrSW5pdGlhbGl6YXRpb25dKTtcblxuICAvLyBBZGQgdGhpcyBmdW5jdGlvbiB0byBmZXRjaCB0cmFuc2FjdGlvbiByZWNvcmQgZGF0YVxuICBjb25zdCBmZXRjaFRyYW5zYWN0aW9uUmVjb3JkID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIGlmICghc29sYW5hQ29ubmVjdGVkIHx8ICFzb2xhbmFQdWJsaWNLZXkpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm9ncmFtID0gZ2V0UHJvZ3JhbSgpO1xuICAgICAgaWYgKCFwcm9ncmFtKSByZXR1cm47XG5cbiAgICAgIC8vIEdldCB0aGUgdHJhbnNhY3Rpb24gcmVjb3JkIFBEQVxuICAgICAgY29uc3QgW3RyYW5zYWN0aW9uUmVjb3JkXSA9IFB1YmxpY0tleS5maW5kUHJvZ3JhbUFkZHJlc3NTeW5jKFxuICAgICAgICBbQnVmZmVyLmZyb20oXCJ0cmFuc2FjdGlvbl9yZWNvcmRcIildLFxuICAgICAgICBwcm9ncmFtLnByb2dyYW1JZFxuICAgICAgKTtcblxuICAgICAgLy8gRmV0Y2ggdGhlIGFjY291bnQgZGF0YVxuICAgICAgY29uc3QgYWNjb3VudEluZm8gPSBhd2FpdCBjb25uZWN0aW9uLmdldEFjY291bnRJbmZvKHRyYW5zYWN0aW9uUmVjb3JkKTtcbiAgICAgIGlmICghYWNjb3VudEluZm8pIHJldHVybjtcblxuICAgICAgLy8gRGVjb2RlIHRoZSBhY2NvdW50IGRhdGFcbiAgICAgIGNvbnN0IGRlY29kZWREYXRhID0gYXdhaXQgcHJvZ3JhbS5jb2Rlci5hY2NvdW50cy5kZWNvZGUoJ3RyYW5zYWN0aW9uUmVjb3JkJywgYWNjb3VudEluZm8uZGF0YSk7XG5cbiAgICAgIC8vIFVwZGF0ZSBzdGF0ZSB3aXRoIHRoZSBmZXRjaGVkIGRhdGFcbiAgICAgIHNldFRvdGFsVXNkU29sZChkZWNvZGVkRGF0YS50b3RhbFVzZFNvbGQpO1xuICAgICAgc2V0VG90YWxUb2tlbnNTb2xkKGRlY29kZWREYXRhLnRvdGFsVG9rZW5zU29sZCk7XG4gICAgICBzZXRUcmFuc2FjdGlvbnMoZGVjb2RlZERhdGEudHJhbnNhY3Rpb25zKTtcbiAgICAgIHNldEN1cnJlbnRTdGFnZShkZWNvZGVkRGF0YS5jdXJyZW50U3RhZ2UgKyAxKTtcblxuICAgICAgY29uc29sZS5sb2coXCJUcmFuc2FjdGlvbiByZWNvcmQgZGF0YTpcIiwgZGVjb2RlZERhdGEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB0cmFuc2FjdGlvbiByZWNvcmQ6JywgZXJyb3IpO1xuICAgIH1cbiAgfSwgW3NvbGFuYUNvbm5lY3RlZCwgc29sYW5hUHVibGljS2V5LCBnZXRQcm9ncmFtLCBjb25uZWN0aW9uXSk7XG5cbiAgLy8gQWRkIHRoaXMgdXNlRWZmZWN0IHRvIGZldGNoIGRhdGEgd2hlbiB3YWxsZXQgY29ubmVjdHNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoc29sYW5hQ29ubmVjdGVkICYmIHNvbGFuYVB1YmxpY0tleSkge1xuICAgICAgZmV0Y2hUcmFuc2FjdGlvblJlY29yZCgpO1xuICAgIH1cbiAgfSwgW3NvbGFuYUNvbm5lY3RlZCwgc29sYW5hUHVibGljS2V5LCBmZXRjaFRyYW5zYWN0aW9uUmVjb3JkXSk7XG5cbiAgLy8gQWRkIHVzZUVmZmVjdCB0byBmZXRjaCBwcmVzYWxlIGRhdGEgb24gY29tcG9uZW50IG1vdW50IGFuZCB3aGVuIHdhbGxldCBjaGFuZ2VzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHNvbGFuYUNvbm5lY3RlZCAmJiBzb2xhbmFQdWJsaWNLZXkpIHtcbiAgICAgIGZldGNoUHJlc2FsZURhdGEoKTtcbiAgICB9XG4gIH0sIFtzb2xhbmFDb25uZWN0ZWQsIHNvbGFuYVB1YmxpY0tleSwgZmV0Y2hQcmVzYWxlRGF0YV0pO1xuXG4gIGNvbnN0IFt1c2VyUHJvZmlsZSwgc2V0VXNlclByb2ZpbGVdID0gdXNlU3RhdGU8e1xuICAgIHRvdGFsUGFpZFVzZDogbnVtYmVyO1xuICAgIHRvdGFsUGFpZFNvbDogbnVtYmVyO1xuICAgIHRvdGFsVG9rZW5zQm91Z2h0OiBudW1iZXI7XG4gICAgdG90YWxUb2tlbnNDbGFpbWVkOiBudW1iZXI7XG4gICAgbGFzdENsYWltVGltZXN0YW1wOiBudW1iZXI7XG4gICAgdHJhbnNhY3Rpb25zOiBBcnJheTx7XG4gICAgICB1c2RBbW91bnQ6IG51bWJlcjtcbiAgICAgIHNvbEFtb3VudDogbnVtYmVyO1xuICAgICAgdG9rZW5BbW91bnQ6IG51bWJlcjtcbiAgICAgIHN0YWdlOiBudW1iZXI7XG4gICAgICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgICB9PjtcbiAgfSB8IG51bGw+KG51bGwpO1xuXG4gIC8vIEFkZCBsb2FkaW5nIHN0YXRlIGZvciB1c2VyIHByb2ZpbGVcbiAgY29uc3QgW2lzUHJvZmlsZUxvYWRpbmcsIHNldElzUHJvZmlsZUxvYWRpbmddID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xuXG4gIC8vIEFkZCBmdW5jdGlvbiB0byBmZXRjaCB1c2VyIHByb2ZpbGVcbiAgY29uc3QgZmV0Y2hVc2VyUHJvZmlsZSA9IHVzZUNhbGxiYWNrKGFzeW5jICgpID0+IHtcbiAgICBpZiAoIXNvbGFuYUNvbm5lY3RlZCB8fCAhc29sYW5hUHVibGljS2V5KSB7XG4gICAgICBzZXRVc2VyUHJvZmlsZShudWxsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRJc1Byb2ZpbGVMb2FkaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm9ncmFtID0gZ2V0UHJvZ3JhbSgpO1xuICAgICAgaWYgKCFwcm9ncmFtKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUHJvZ3JhbSBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSB0cmFuc2FjdGlvbiByZWNvcmQgUERBXG4gICAgICBjb25zdCBbdHJhbnNhY3Rpb25SZWNvcmRdID0gUHVibGljS2V5LmZpbmRQcm9ncmFtQWRkcmVzc1N5bmMoXG4gICAgICAgIFtCdWZmZXIuZnJvbShcInRyYW5zYWN0aW9uX3JlY29yZFwiKV0sXG4gICAgICAgIHByb2dyYW0ucHJvZ3JhbUlkXG4gICAgICApO1xuXG4gICAgICAvLyBGZXRjaCB0aGUgdHJhbnNhY3Rpb24gcmVjb3JkIGFjY291bnRcbiAgICAgIGNvbnN0IGFjY291bnQgPSBhd2FpdCBwcm9ncmFtLmFjY291bnQudHJhbnNhY3Rpb25SZWNvcmQuZmV0Y2godHJhbnNhY3Rpb25SZWNvcmQpO1xuICAgICAgXG4gICAgICAvLyBGaW5kIHRoZSB1c2VyJ3MgYnV5ZXIgaW5mb1xuICAgICAgY29uc3QgYnV5ZXJJbmZvID0gYWNjb3VudC5idXllcnMuZmluZChiID0+IGIuYnV5ZXJBZGRyZXNzLmVxdWFscyhzb2xhbmFQdWJsaWNLZXkpKTtcbiAgICAgIFxuICAgICAgaWYgKCFidXllckluZm8pIHtcbiAgICAgICAgc2V0VXNlclByb2ZpbGUobnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHVzZXIncyB0cmFuc2FjdGlvbnNcbiAgICAgIGNvbnN0IHVzZXJUcmFuc2FjdGlvbnMgPSBhY2NvdW50LnRyYW5zYWN0aW9uc1xuICAgICAgICAuZmlsdGVyKHR4ID0+IHR4LmJ1eWVyLmVxdWFscyhzb2xhbmFQdWJsaWNLZXkpKVxuICAgICAgICAubWFwKHR4ID0+ICh7XG4gICAgICAgICAgdXNkQW1vdW50OiB0eC51c2RBbW91bnQsXG4gICAgICAgICAgc29sQW1vdW50OiB0eC5zb2xBbW91bnQsXG4gICAgICAgICAgdG9rZW5BbW91bnQ6IHR4LnRva2VuQW1vdW50LFxuICAgICAgICAgIHN0YWdlOiB0eC5zdGFnZSxcbiAgICAgICAgICB0aW1lc3RhbXA6IHR4LnRpbWVzdGFtcCxcbiAgICAgICAgfSkpO1xuXG4gICAgICBzZXRVc2VyUHJvZmlsZSh7XG4gICAgICAgIHRvdGFsUGFpZFVzZDogYnV5ZXJJbmZvLnRvdGFsUGFpZFVzZCxcbiAgICAgICAgdG90YWxQYWlkU29sOiBidXllckluZm8udG90YWxQYWlkU29sLFxuICAgICAgICB0b3RhbFRva2Vuc0JvdWdodDogYnV5ZXJJbmZvLnRvdGFsVG9rZW5zQm91Z2h0LFxuICAgICAgICB0b3RhbFRva2Vuc0NsYWltZWQ6IGJ1eWVySW5mby50b3RhbFRva2Vuc0NsYWltZWQsXG4gICAgICAgIGxhc3RDbGFpbVRpbWVzdGFtcDogYnV5ZXJJbmZvLmxhc3RDbGFpbVRpbWVzdGFtcCxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiB1c2VyVHJhbnNhY3Rpb25zLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHVzZXIgcHJvZmlsZTonLCBlcnJvcik7XG4gICAgICB0b2FzdC5lcnJvcignRmFpbGVkIHRvIGZldGNoIHVzZXIgcHJvZmlsZS4gUGxlYXNlIHRyeSBhZ2Fpbi4nLCB7XG4gICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgICBhdXRvQ2xvc2U6IDUwMDAsXG4gICAgICAgIGhpZGVQcm9ncmVzc0JhcjogZmFsc2UsXG4gICAgICAgIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIC4uLnRvYXN0U3R5bGVzLFxuICAgICAgfSk7XG4gICAgICBzZXRVc2VyUHJvZmlsZShudWxsKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNQcm9maWxlTG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9LCBbc29sYW5hQ29ubmVjdGVkLCBzb2xhbmFQdWJsaWNLZXksIGdldFByb2dyYW1dKTtcblxuICAvLyBBZGQgdXNlRWZmZWN0IHRvIGZldGNoIHVzZXIgcHJvZmlsZSB3aGVuIHdhbGxldCBjb25uZWN0cyBvciBhZnRlciBzdWNjZXNzZnVsIHRyYW5zYWN0aW9uXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHNvbGFuYUNvbm5lY3RlZCAmJiBzb2xhbmFQdWJsaWNLZXkpIHtcbiAgICAgIGZldGNoVXNlclByb2ZpbGUoKTtcbiAgICB9XG4gIH0sIFtzb2xhbmFDb25uZWN0ZWQsIHNvbGFuYVB1YmxpY0tleSwgZmV0Y2hVc2VyUHJvZmlsZV0pO1xuXG4gIC8vIEFkZCBmb3JtYXQgZnVuY3Rpb25zIGZvciBkaXNwbGF5XG4gIGNvbnN0IGZvcm1hdERhdGUgPSAodGltZXN0YW1wOiBudW1iZXIpID0+IHtcbiAgICByZXR1cm4gbmV3IERhdGUodGltZXN0YW1wICogMTAwMCkudG9Mb2NhbGVTdHJpbmcoKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHJlc2FsZUNvbnRhaW5lcn0+XG4gICAgICA8VG9hc3RDb250YWluZXJcbiAgICAgICAgcG9zaXRpb249XCJib3R0b20tcmlnaHRcIlxuICAgICAgICBhdXRvQ2xvc2U9ezUwMDB9XG4gICAgICAgIGhpZGVQcm9ncmVzc0Jhcj17ZmFsc2V9XG4gICAgICAgIG5ld2VzdE9uVG9wXG4gICAgICAgIGNsb3NlT25DbGlja1xuICAgICAgICBydGw9e2ZhbHNlfVxuICAgICAgICBwYXVzZU9uRm9jdXNMb3NzXG4gICAgICAgIGRyYWdnYWJsZVxuICAgICAgICBwYXVzZU9uSG92ZXJcbiAgICAgICAgdGhlbWU9XCJkYXJrXCJcbiAgICAgIC8+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzTmFtZT17c3R5bGVzLnByZXNhbGVDYXJkfVxuICAgICAgPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnRva2VuSW5mb30+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50b2tlbkhlYWRlcn0+XG4gICAgICAgICAgICA8aDI+RG9nZS1IZWFkIFRva2VuIFByZXNhbGU8L2gyPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMudG9rZW5TeW1ib2x9PiRET0dFLUhFQUQ8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnByZXNhbGVTdGF0c30+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnN0YXRJdGVtfT5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuc3RhdExhYmVsfT5TdGFnZSB7Y3VycmVudFN0YWdlfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuc3RhdFZhbHVlfT57c3RhZ2VEYXRhPy5hdmFpbGFibGVUb2tlbnMudG9Mb2NhbGVTdHJpbmcoKX0gdG9rZW5zPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlcy5zdGF0U3ViVmFsdWV9PiR7c3RhZ2VEYXRhPy5wcmljZVBlclRva2VufSBwZXIgdG9rZW48L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuc3RhdEl0ZW19PlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlcy5zdGF0TGFiZWx9PlRvdGFsIFVTRCBTb2xkPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlcy5zdGF0VmFsdWV9PiR7dG90YWxVc2RTb2xkLnRvTG9jYWxlU3RyaW5nKHVuZGVmaW5lZCwgeyBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDIgfSl9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnN0YXRJdGVtfT5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuc3RhdExhYmVsfT5Ub3RhbCBUb2tlbnMgU29sZDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuc3RhdFZhbHVlfT57Zm9ybWF0VG9rZW5BbW91bnQodG90YWxUb2tlbnNTb2xkKX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHJvZ3Jlc3NCYXJ9PlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5wcm9ncmVzc31cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICB3aWR0aDogYCR7TWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAoKHRvdGFsVG9rZW5zU29sZCAvIDFlOSkgLyAoc3RhZ2VEYXRhPy5hdmFpbGFibGVUb2tlbnMgfHwgMSkpICogMTAwLFxuICAgICAgICAgICAgICAgICAgMTAwXG4gICAgICAgICAgICAgICAgKX0lYFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5wcm9ncmVzc1RleHR9PlxuICAgICAgICAgICAgICB7TWF0aC5mbG9vcih0b3RhbFRva2Vuc1NvbGQgLyAxZTkpLnRvTG9jYWxlU3RyaW5nKCl9L3tzdGFnZURhdGE/LmF2YWlsYWJsZVRva2Vucy50b0xvY2FsZVN0cmluZygpIHx8ICcwJ31cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLndhbGxldFNlY3Rpb259PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMud2FsbGV0U3RhdHVzfT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMud2FsbGV0U3RhdHVzSXRlbX0+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLndhbGxldExhYmVsfT5Tb2xhbmEgV2FsbGV0IChEZXZuZXQpOjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgJHtzdHlsZXMud2FsbGV0VmFsdWV9ICR7c29sYW5hQ29ubmVjdGVkID8gc3R5bGVzLmNvbm5lY3RlZCA6ICcnfWB9PlxuICAgICAgICAgICAgICAgIHtzb2xhbmFDb25uZWN0ZWRcbiAgICAgICAgICAgICAgICAgID8gYCR7c29sYW5hUHVibGljS2V5Py50b1N0cmluZygpLnNsaWNlKDAsIDQpfS4uLiR7c29sYW5hUHVibGljS2V5Py50b1N0cmluZygpLnNsaWNlKC00KX1gXG4gICAgICAgICAgICAgICAgICA6ICdOb3QgQ29ubmVjdGVkJ31cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICB7c29sYW5hQ29ubmVjdGVkID8gKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17c3R5bGVzLmRpc2Nvbm5lY3RCdXR0b259XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtkaXNjb25uZWN0U29sYW5hfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIERpc2Nvbm5lY3RcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5jb25uZWN0QnV0dG9ufVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3NvbGFuYUNvbm5lY3Rpbmd9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3NvbGFuYUNvbm5lY3RpbmcgPyAnQ29ubmVjdGluZy4uLicgOiAnQ29ubmVjdCBTb2xhbmEnfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHtzZWxlY3RlZFBheW1lbnRDaGFpbiAhPT0gJ3NvbGFuYScgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLndhbGxldFN0YXR1c0l0ZW19PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLndhbGxldExhYmVsfT5QYXltZW50IFdhbGxldCAoVGVzdG5ldCk6PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YCR7c3R5bGVzLndhbGxldFZhbHVlfSAke2V2bUNvbm5lY3RlZCA/IHN0eWxlcy5jb25uZWN0ZWQgOiAnJ31gfT5cbiAgICAgICAgICAgICAgICAgIHtldm1Db25uZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgPyBgJHtldm1BZGRyZXNzPy5zbGljZSgwLCA0KX0uLi4ke2V2bUFkZHJlc3M/LnNsaWNlKC00KX1gXG4gICAgICAgICAgICAgICAgICAgIDogJ05vdCBDb25uZWN0ZWQnfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7ZXZtQ29ubmVjdGVkICYmIChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuY2hhaW5JbmZvfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuY2hhaW5OYW1lfT5cbiAgICAgICAgICAgICAgICAgICAgICB7Y2hhaW4/Lm5hbWUgfHwgJ0Nvbm5lY3RlZCd9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBBZG1pbiBjb250cm9scyAqL31cbiAgICAgICAgICB7c29sYW5hQ29ubmVjdGVkICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuYWRtaW5Db250cm9sc30+XG4gICAgICAgICAgICAgIDxoMz5BZG1pbiBDb250cm9sczwvaDM+XG4gICAgICAgICAgICAgIHshaXNJbml0aWFsaXplZCA/IChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5hZG1pbkJ1dHRvbn1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUluaXRpYWxpemV9XG4gICAgICAgICAgICAgICAgICBkaXNhYmxlZD17aXNQcm9jZXNzaW5nfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc1Byb2Nlc3NpbmcgPyAnUHJvY2Vzc2luZy4uLicgOiAnSW5pdGlhbGl6ZSBDb250cmFjdCd9XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICkgOiBpc0FkbWluID8gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaW5pdGlhbGl6ZWRTdGF0dXN9PlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuaW5pdGlhbGl6ZWRUZXh0fT5Db250cmFjdCBJbml0aWFsaXplZDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLmFkbWluQmFkZ2V9PllvdSBhcmUgdGhlIGFkbWluPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5hZG1pbkJ1dHRvbn1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlTmV4dFN0YWdlfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17aXNQcm9jZXNzaW5nIHx8IGN1cnJlbnRTdGFnZSA+PSBwcmVzYWxlU3RhZ2VzLmxlbmd0aCAtIDF9XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtpc1Byb2Nlc3NpbmcgPyAnUHJvY2Vzc2luZy4uLicgOiAnTmV4dCBTdGFnZSd9XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmluaXRpYWxpemVkU3RhdHVzfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLmluaXRpYWxpemVkVGV4dH0+Q29udHJhY3QgSW5pdGlhbGl6ZWQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlcy5hZG1pbkJhZGdlfT5XYWl0aW5nIGZvciBhZG1pbi4uLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnBheW1lbnRPcHRpb25zfT5cbiAgICAgICAgICAgIDxoMz5TZWxlY3QgUGF5bWVudCBDaGFpbjwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnBheW1lbnRPcHRpb25zR3JpZH0+XG4gICAgICAgICAgICAgIHtQQVlNRU5UX09QVElPTlMubWFwKChvcHRpb24pID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBrZXk9e29wdGlvbi5pZH1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YCR7c3R5bGVzLnBheW1lbnRPcHRpb259ICR7c2VsZWN0ZWRQYXltZW50Q2hhaW4gPT09IG9wdGlvbi5pZCA/IHN0eWxlcy5zZWxlY3RlZCA6ICcnfSAke29wdGlvbi5pc0Rpc2FibGVkID8gc3R5bGVzLmRpc2FibGVkIDogJyd9YH1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+ICFvcHRpb24uaXNEaXNhYmxlZCAmJiBoYW5kbGVQYXltZW50Q2hhaW5TZWxlY3Qob3B0aW9uLmlkKX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8aW1nIHNyYz17b3B0aW9uLmljb259IGFsdD17b3B0aW9uLm5hbWV9IGNsYXNzTmFtZT17c3R5bGVzLmNoYWluSWNvbn0gLz5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPntvcHRpb24ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7b3B0aW9uLmlzRGlzYWJsZWQgJiYgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuZGlzYWJsZWRMYWJlbH0+Q29taW5nIFNvb248L3NwYW4+fVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5idXlTZWN0aW9ufT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaW5wdXRHcm91cH0+XG4gICAgICAgICAgICAgIDxsYWJlbD5BbW91bnQgKCQpPC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgdmFsdWU9e2Ftb3VudH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEFtb3VudChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCIwLjBcIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17c3R5bGVzLmlucHV0fVxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtcbiAgICAgICAgICAgICAgICAgICFzb2xhbmFDb25uZWN0ZWQgfHxcbiAgICAgICAgICAgICAgICAgIChzZWxlY3RlZFBheW1lbnRDaGFpbiAhPT0gJ3NvbGFuYScgJiYgIWV2bUNvbm5lY3RlZCkgfHxcbiAgICAgICAgICAgICAgICAgICFzZWxlY3RlZFBheW1lbnRDaGFpbiB8fFxuICAgICAgICAgICAgICAgICAgaXNQcm9jZXNzaW5nIHx8XG4gICAgICAgICAgICAgICAgICAoc2VsZWN0ZWRQYXltZW50Q2hhaW4gPT09ICdzb2xhbmEnICYmICFpc0luaXRpYWxpemVkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnRva2VuQ2FsY3VsYXRpb259PlxuICAgICAgICAgICAgICA8c3Bhbj5Zb3Ugd2lsbCByZWNlaXZlOjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMudG9rZW5BbW91bnR9PlxuICAgICAgICAgICAgICAgIHt0b2tlbnNUb1JlY2VpdmV9IERPR0UtSEVBRFxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5idXlCdXR0b259XG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUJ1eVRva2Vuc31cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e1xuICAgICAgICAgICAgICAgICFzb2xhbmFDb25uZWN0ZWQgfHxcbiAgICAgICAgICAgICAgICAoc2VsZWN0ZWRQYXltZW50Q2hhaW4gIT09ICdzb2xhbmEnICYmICFldm1Db25uZWN0ZWQpIHx8XG4gICAgICAgICAgICAgICAgIXNlbGVjdGVkUGF5bWVudENoYWluIHx8XG4gICAgICAgICAgICAgICAgIWFtb3VudCB8fFxuICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZyB8fFxuICAgICAgICAgICAgICAgIChzZWxlY3RlZFBheW1lbnRDaGFpbiA9PT0gJ3NvbGFuYScgJiYgIWlzSW5pdGlhbGl6ZWQpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge2lzUHJvY2Vzc2luZyA/ICdQcm9jZXNzaW5nLi4uJyA6ICdCdXkgRG9nZS1IZWFkIFRva2Vucyd9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIHtzZWxlY3RlZFBheW1lbnRDaGFpbiA9PT0gJ3NvbGFuYScgJiYgIWlzSW5pdGlhbGl6ZWQgJiYgKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e3N0eWxlcy53YXJuaW5nVGV4dH0+Q29udHJhY3Qgbm90IGluaXRpYWxpemVkLiBQbGVhc2UgY29udGFjdCB0aGUgYWRtaW4uPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcFNlY3Rpb259PlxuICAgICAgICA8aDI+Um9hZG1hcDwvaDI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcFRpbWVsaW5lfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnJvYWRtYXBJdGVtfT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcFBoYXNlfT4xPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnJvYWRtYXBDb250ZW50fT5cbiAgICAgICAgICAgICAgPGgzPkdhbWluZyBGb2N1czwvaDM+XG4gICAgICAgICAgICAgIDxwPkNvbnRpbnVlIGZvY3VzaW5nIG9uIHZpZGVvIGdhbWVzIGFuZCBhbGwgbWluaS1wcm9qZWN0cyB0aGF0IHdpbGwgc3VzdGFpbiAkREhDPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5yb2FkbWFwSXRlbX0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnJvYWRtYXBQaGFzZX0+MjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5yb2FkbWFwQ29udGVudH0+XG4gICAgICAgICAgICAgIDxoMz5QcmVzYWxlIENvbXBsZXRpb248L2gzPlxuICAgICAgICAgICAgICA8cD5Db21wbGV0ZSB0aGUgcHJlc2FsZSBhbmQgZGlzdHJpYnV0ZSB0b2tlbnMgdG8gZWFybHkgc3VwcG9ydGVyczwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcEl0ZW19PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5yb2FkbWFwUGhhc2V9PjM8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcENvbnRlbnR9PlxuICAgICAgICAgICAgICA8aDM+REVYIExpc3Rpbmc8L2gzPlxuICAgICAgICAgICAgICA8cD5MaXN0IG9uIGRlY2VudHJhbGl6ZWQgZXhjaGFuZ2VzIHRvIHByb3ZpZGUgbGlxdWlkaXR5IGFuZCB0cmFkaW5nIG9wdGlvbnM8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnJvYWRtYXBJdGVtfT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcFBoYXNlfT40PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnJvYWRtYXBDb250ZW50fT5cbiAgICAgICAgICAgICAgPGgzPkFydGlzdCBQbGF0Zm9ybTwvaDM+XG4gICAgICAgICAgICAgIDxwPkxhdW5jaCBhIHBsYXRmb3JtIHdoZXJlIGFydGlzdHMgb2YgYWxsIGtpbmRzIGNhbiByZWNlaXZlIHRpcHMgaW4gJERIQzwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcEl0ZW19PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5yb2FkbWFwUGhhc2V9PjU8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucm9hZG1hcENvbnRlbnR9PlxuICAgICAgICAgICAgICA8aDM+Q0VYIExpc3Rpbmc8L2gzPlxuICAgICAgICAgICAgICA8cD5MaXN0IG9uIGNlbnRyYWxpemVkIGV4Y2hhbmdlcyB0byByZWFjaCBhIHdpZGVyIGF1ZGllbmNlIGFuZCBpbmNyZWFzZSB0cmFkaW5nIHZvbHVtZTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgey8qIEFkZCBhIHRyYW5zYWN0aW9ucyBzZWN0aW9uIGlmIHlvdSB3YW50IHRvIGRpc3BsYXkgdGhlbSAqL31cbiAgICAgIHt0cmFuc2FjdGlvbnMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25zU2VjdGlvbn0+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvbnNIZWFkZXJ9PlxuICAgICAgICAgICAgPGgzPlJlY2VudCBUcmFuc2FjdGlvbnM8L2gzPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvbnNGaWx0ZXJ9PlxuICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT17c3R5bGVzLmZpbHRlckJ1dHRvbn0+QWxsPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPXtzdHlsZXMuZmlsdGVyQnV0dG9ufT5Ub2RheTwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT17c3R5bGVzLmZpbHRlckJ1dHRvbn0+VGhpcyBXZWVrPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25zTGlzdH0+XG4gICAgICAgICAgICB7dHJhbnNhY3Rpb25zLnNsaWNlKC01KS5yZXZlcnNlKCkubWFwKCh0eCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17aW5kZXh9IGNsYXNzTmFtZT17c3R5bGVzLnRyYW5zYWN0aW9uSXRlbX0+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnRyYW5zYWN0aW9uQ2FyZH0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25DYXJkRnJvbnR9PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25JY29ufT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTEyIDJMMiA3TDEyIDEyTDIyIDdMMTIgMlpcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjJcIiBzdHJva2VMaW5lY2FwPVwicm91bmRcIiBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0yIDE3TDEyIDIyTDIyIDE3XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIyXCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMiAxMkwxMiAxN0wyMiAxMlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMlwiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnRyYW5zYWN0aW9uTWFpbkluZm99PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvblR5cGV9PlRva2VuIFB1cmNoYXNlPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnRyYW5zYWN0aW9uQW1vdW50fT4ke3R4LnVzZEFtb3VudC50b0xvY2FsZVN0cmluZyh1bmRlZmluZWQsIHsgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAyIH0pfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvblRpbWV9PntuZXcgRGF0ZSh0eC50aW1lc3RhbXAgKiAxMDAwKS50b0xvY2FsZVN0cmluZygpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvblN0YWdlfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLnN0YWdlQmFkZ2V9PlN0YWdlIHt0eC5zdGFnZSArIDF9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnRyYW5zYWN0aW9uQ2FyZEJhY2t9PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25EZXRhaWxzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZGV0YWlsR3JvdXB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmRldGFpbExhYmVsfT5CdXllcjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmRldGFpbFZhbHVlfT57dHguYnV5ZXIudG9TdHJpbmcoKS5zbGljZSgwLCA0KX0uLi57dHguYnV5ZXIudG9TdHJpbmcoKS5zbGljZSgtNCl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5kZXRhaWxHcm91cH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZGV0YWlsTGFiZWx9PlNPTCBQYWlkPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZGV0YWlsVmFsdWV9Pntmb3JtYXRTb2xBbW91bnQodHguc29sQW1vdW50KX0gU09MPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5kZXRhaWxHcm91cH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZGV0YWlsTGFiZWx9PlRva2VucyBSZWNlaXZlZDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmRldGFpbFZhbHVlfT57Zm9ybWF0VG9rZW5BbW91bnQodHgudG9rZW5BbW91bnQpfSBET0dFLUhFQUQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvbkFjdGlvbnN9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9e3N0eWxlcy5hY3Rpb25CdXR0b259PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUM3LjAyOTQ0IDIxIDMgMTYuOTcwNiAzIDEyQzMgNy4wMjk0NCA3LjAyOTQ0IDMgMTIgM0MxNi45NzA2IDMgMjEgNy4wMjk0NCAyMSAxMlpcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTIgN1YxMkwxNSAxNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMlwiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgVmlldyBEZXRhaWxzXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPXtzdHlsZXMuYWN0aW9uQnV0dG9ufT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk04IDEySDE2XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIyXCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMiA4VjE2XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlV2lkdGg9XCIyXCIgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICBTaGFyZVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAge3RyYW5zYWN0aW9ucy5sZW5ndGggPiA1ICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudmlld01vcmVDb250YWluZXJ9PlxuICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT17c3R5bGVzLnZpZXdNb3JlQnV0dG9ufT5cbiAgICAgICAgICAgICAgICA8c3Bhbj5WaWV3IEFsbCBUcmFuc2FjdGlvbnM8L3NwYW4+XG4gICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTUgMTJIMTlcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2VXaWR0aD1cIjJcIiBzdHJva2VMaW5lY2FwPVwicm91bmRcIiBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgLz5cbiAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTIgNUwxOSAxMkwxMiAxOVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMlwiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIiAvPlxuICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIFVzZXIgUHJvZmlsZSBTZWN0aW9uICovfVxuICAgICAge3NvbGFuYUNvbm5lY3RlZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudXNlclByb2ZpbGVTZWN0aW9ufT5cbiAgICAgICAgICA8aDI+WW91ciBQcm9maWxlPC9oMj5cbiAgICAgICAgICBcbiAgICAgICAgICB7aXNQcm9maWxlTG9hZGluZyA/IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMubG9hZGluZ0NvbnRhaW5lcn0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMubG9hZGluZ1NwaW5uZXJ9IC8+XG4gICAgICAgICAgICAgIDxzcGFuPkxvYWRpbmcgcHJvZmlsZS4uLjwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICkgOiB1c2VyUHJvZmlsZSA/IChcbiAgICAgICAgICAgIDxSZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5wcm9maWxlU3RhdHN9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuc3RhdENhcmR9PlxuICAgICAgICAgICAgICAgICAgPGgzPlRvdGFsIEludmVzdG1lbnQ8L2gzPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5zdGF0VmFsdWV9PlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke3VzZXJQcm9maWxlLnRvdGFsUGFpZFVzZC50b0ZpeGVkKDIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2Zvcm1hdFNvbEFtb3VudCh1c2VyUHJvZmlsZS50b3RhbFBhaWRTb2wpfSBTT0w8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnN0YXRDYXJkfT5cbiAgICAgICAgICAgICAgICAgIDxoMz5Ub2tlbnM8L2gzPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5zdGF0VmFsdWV9PlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5Cb3VnaHQ6IHtmb3JtYXRUb2tlbkFtb3VudCh1c2VyUHJvZmlsZS50b3RhbFRva2Vuc0JvdWdodCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5DbGFpbWVkOiB7Zm9ybWF0VG9rZW5BbW91bnQodXNlclByb2ZpbGUudG90YWxUb2tlbnNDbGFpbWVkKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPlBlbmRpbmc6IHtmb3JtYXRUb2tlbkFtb3VudCh1c2VyUHJvZmlsZS50b3RhbFRva2Vuc0JvdWdodCAtIHVzZXJQcm9maWxlLnRvdGFsVG9rZW5zQ2xhaW1lZCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5zdGF0Q2FyZH0+XG4gICAgICAgICAgICAgICAgICA8aDM+TGFzdCBDbGFpbTwvaDM+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnN0YXRWYWx1ZX0+XG4gICAgICAgICAgICAgICAgICAgIHt1c2VyUHJvZmlsZS5sYXN0Q2xhaW1UaW1lc3RhbXAgPiAwID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntmb3JtYXREYXRlKHVzZXJQcm9maWxlLmxhc3RDbGFpbVRpbWVzdGFtcCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPk5vIGNsYWltcyB5ZXQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvbkhpc3Rvcnl9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25IaXN0b3J5SGVhZGVyfT5cbiAgICAgICAgICAgICAgICAgIDxoMz5UcmFuc2FjdGlvbiBIaXN0b3J5PC9oMz5cbiAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17c3R5bGVzLnJlZnJlc2hCdXR0b259XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2ZldGNoVXNlclByb2ZpbGV9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtpc1Byb2ZpbGVMb2FkaW5nfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7aXNQcm9maWxlTG9hZGluZyA/ICdSZWZyZXNoaW5nLi4uJyA6ICdSZWZyZXNoJ31cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25MaXN0fT5cbiAgICAgICAgICAgICAgICAgIHt1c2VyUHJvZmlsZS50cmFuc2FjdGlvbnMubWFwKCh0eCwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2luZGV4fSBjbGFzc05hbWU9e3N0eWxlcy50cmFuc2FjdGlvbkNhcmR9PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25IZWFkZXJ9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuc3RhZ2VCYWRnZX0+U3RhZ2Uge3R4LnN0YWdlICsgMX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlcy50aW1lc3RhbXB9Pntmb3JtYXREYXRlKHR4LnRpbWVzdGFtcCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudHJhbnNhY3Rpb25EZXRhaWxzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZGV0YWlsUm93fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+QW1vdW50IFBhaWQ6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke3R4LnVzZEFtb3VudC50b0ZpeGVkKDIpfSAoe2Zvcm1hdFNvbEFtb3VudCh0eC5zb2xBbW91bnQpfSBTT0wpPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmRldGFpbFJvd30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlRva2VucyBSZWNlaXZlZDo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntmb3JtYXRUb2tlbkFtb3VudCh0eC50b2tlbkFtb3VudCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9SZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5ub1Byb2ZpbGVDb250YWluZXJ9PlxuICAgICAgICAgICAgICA8cD5ObyBwdXJjaGFzZSBoaXN0b3J5IGZvdW5kLiBCdXkgc29tZSB0b2tlbnMgdG8gc2VlIHlvdXIgcHJvZmlsZSE8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59OyAiXX0=