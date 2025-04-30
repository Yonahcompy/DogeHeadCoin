import { FC, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../styles/MultiChainPresale.module.css';
import { BASE_ETH_CONTRACT } from '../contracts/baseEth';
import { BSC_CONTRACT } from '../contracts/bscContract';
import { DogePresaleIDL } from '../contracts/old_solanaIdl';
import { PublicKey, SystemProgram, Keypair, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, setProvider, web3 } from "@coral-xyz/anchor";
import { DogePresale, IDL } from '../contracts/solanaIdl';

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
  { stage: 1, availableTokens: 750_000_000, pricePerToken: 0.0001 },
  { stage: 2, availableTokens: 600_000_000, pricePerToken: 0.00033 },
  { stage: 3, availableTokens: 450_000_000, pricePerToken: 0.000957 },
  { stage: 4, availableTokens: 600_000_000, pricePerToken: 0.00202 },
  { stage: 5, availableTokens: 600_000_000, pricePerToken: 0.00313 },
];

export const MultiChainPresale: FC = () => {
  // Solana wallet state
  const {
    connected: solanaConnected,
    publicKey: solanaPublicKey,
    connecting: solanaConnecting,
    disconnect: disconnectSolana
  } = useSolanaWallet();

  // EVM wallet state - using existing w3m connections
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  // Presale state
  const [selectedPaymentChain, setSelectedPaymentChain] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [tokensToReceive, setTokensToReceive] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(1); // Default to stage 1
  const stageData = presaleStages.find(s => s.stage === currentStage);
  

  // Add these state variables near your other state declarations
  const [totalUsdSold, setTotalUsdSold] = useState<number>(0);
  const [totalTokensSold, setTotalTokensSold] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Move hooks to component level
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [provider, setProvider] = useState<AnchorProvider | null>(null);

  // Add utility function to format token amounts
  const formatTokenAmount = (amount: number) => {
    // Convert from 9 decimals to a readable number
    const formattedAmount = amount / 1e9;
    return formattedAmount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  };

  // Add utility function to format SOL amounts
  const formatSolAmount = (amount: number) => {
    // Convert from lamports (9 decimals) to SOL
    const formattedAmount = amount / 1e9;
    return formattedAmount.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 2
    });
  };

  // Calculate tokens to receive based on amount and current stage
  useEffect(() => {
    if (amount && !isNaN(Number(amount)) && currentStage > 0) {
      const currentStageData = presaleStages.find(s => s.stage === currentStage);
      if (currentStageData) {
        // Calculate tokens based on USD amount and current stage price
        const tokens = Number(amount) / currentStageData.pricePerToken;
        setTokensToReceive(tokens.toLocaleString(undefined, { maximumFractionDigits: 2 }));
      } else {
        setTokensToReceive('0');
      }
    } else {
      setTokensToReceive('0');
    }
  }, [amount, currentStage]);

  // Add function to get current stage info
  const getCurrentStageInfo = () => {
    return presaleStages.find(s => s.stage === currentStage) || presaleStages[0];
  };

  // Add function to format price
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  };

  // Handle payment chain selection
  const handlePaymentChainSelect = (chainId: string) => {
    const selectedOption = PAYMENT_OPTIONS.find(option => option.id === chainId);
    if (selectedOption?.isDisabled) {
      toast.error('This payment option is currently disabled', {
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
      const chainIdNum: any = PAYMENT_OPTIONS.find(option => option.id === chainId)?.chainId;
      if (chainIdNum && chain?.id !== chainIdNum && switchNetwork) {
        switchNetwork(chainIdNum);
      }
    }
  };

  const { connection } = useConnection();
  // Get Anchor provider
  const getProvider = useCallback(() => {
    if (!solanaPublicKey || !connection) return null;

    const wallet = {
      publicKey: solanaPublicKey,
      signTransaction: window.solana?.signTransaction!,
      signAllTransactions: window.solana?.signAllTransactions!,
    };

    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' }
    );

    // Set the provider globally
    setProvider(provider);

    return provider;
  }, [connection, solanaPublicKey]);

  // Get program instance
  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;

    // Create a proper PublicKey object for the program ID
    const programId = new PublicKey("2c86DsQz3BZo7b5ceB85VBxfYgavGQ7cXzBnDoTJhZ21");

    // Pass the programId as the second parameter
    return new Program<DogePresale>(IDL, programId, provider);
  }, [getProvider]);

  // Presale state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Check if the contract is initialized
  const checkInitialization = useCallback(async () => {
    if (!solanaConnected || !solanaPublicKey) return;

    try {
      const program = getProgram();
      if (!program) return;

      // Get the transaction record PDA
      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );

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
      } catch (error) {
        console.error('Error fetching account:', error);
        setIsInitialized(false);
      }
    } catch (error) {
      console.error('Error checking initialization:', error);
      setIsInitialized(false);
    }
  }, [solanaConnected, solanaPublicKey, getProgram, connection]);

  // Initialize the contract
  const handleInitialize = async () => {
    if (!solanaConnected || !solanaPublicKey) {
      toast.error('Please connect your Solana wallet first', {
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
    toast.info('Initializing contract...', {
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

      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );

      const accountInfo = await connection.getAccountInfo(transactionRecord);
      if (accountInfo) {
        toast.info('Contract already initialized', {
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
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.info('Contract initialized, resizing account...', {
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
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(`Contract initialized and resized! Init Hash: ${initTx}, Resize Hash: ${resizeTx}`, {
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
    } catch (error) {
      console.error('Initialization error:', error);
      toast.error('Failed to initialize contract. Please try again.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to create the treasury account
  const createTreasuryAccount = async () => {
    if (!solanaConnected || !solanaPublicKey) {
      toast.error('Please connect your Solana wallet first', {
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
    toast.info('Creating treasury account...', {
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
      const treasuryKeypair = Keypair.generate();

      // Get the minimum rent for the account
      const rentExemption = await connection.getMinimumBalanceForRentExemption(0);

      // Create the account
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: solanaPublicKey,
        newAccountPubkey: treasuryKeypair.publicKey,
        lamports: rentExemption,
        space: 0,
        programId: SystemProgram.programId,
      });

      // Create a transaction
      const transaction = new Transaction().add(createAccountIx);

      // Send the transaction
      const tx = await connection.sendTransaction(
        transaction,
        [treasuryKeypair]
      );

      toast.success(`Treasury account created! Hash: ${tx}`, {
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

    } catch (error) {
      console.error('Create treasury error:', error);
      toast.error('Failed to create treasury account. Please try again.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
    } finally {
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
      toast.error('You must be the admin to advance to the next stage', {
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
    toast.info('Advancing to next stage...', {
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
      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );
      
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

      toast.success(`Advanced to next stage! Hash: ${tx}`, {
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
    } catch (error) {
      console.error('Next stage error:', error);
      toast.error('Failed to advance to next stage. Please try again.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore the handleSolanaBuy function
  const handleSolanaBuy = async (amount: number) => {
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

      // Call the buy instruction with the new parameter type (f64 instead of u64)
      const tx = await program.methods
        .buy(amount) // Now passing a f64 value directly
        .accounts({
          buyer: solanaPublicKey,
          treasury: treasuryWallet,
          transactionRecord: transactionRecord,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Solana buy error:', error);
      throw error;
    }
  };

  // Add fetchPresaleData function to refresh data after stage change
  const fetchPresaleData = useCallback(async () => {
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
      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );
      
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
    } catch (error) {
      console.error('Error fetching presale data:', error);
    }
  }, [solanaConnected, solanaPublicKey, getProgram]);

  // Handle buy tokens
  const handleBuyTokens = async () => {
    if (!solanaConnected) {
      toast.error('Please connect your Solana wallet first', {
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
      toast.error('Minimum purchase amount is $1', {
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
        toast.error('Contract not initialized. Please contact the admin.', {
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
    } else {
      // For EVM chains, we need EVM connection
      if (!evmConnected || !selectedPaymentChain) {
        toast.error('Please connect your payment wallet and select a payment chain', {
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
        toast.error('Please enter a valid amount', {
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
    toast.info('Processing transaction...', {
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

        toast.success(`Transaction submitted! Hash: ${tx}`, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          ...toastStyles,
        });
      } else if (selectedPaymentChain === 'base') {
        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        // Convert amount to cents (multiply by 100)
        const amountInCents = BigInt(Math.floor(parseFloat(amount)));

        // Get quote for ETH amount
        const quote = await publicClient.readContract({
          ...BASE_ETH_CONTRACT,
          functionName: 'getQuote',
          args: [amountInCents],
        }) as bigint;

        // Make the purchase
        const hash = await walletClient.writeContract({
          ...BASE_ETH_CONTRACT,
          functionName: 'purchaseWithUSDAmount',
          args: [amountInCents, solanaPublicKey?.toString() || ''],
          value: quote,
        });

        toast.success(`Transaction submitted! Hash: ${hash}`, {
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
          toast.success('Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
          });
        } else {
          throw new Error('Transaction failed');
        }
      } else if (selectedPaymentChain === 'bsc') {
        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        // Convert amount to cents (multiply by 100)
        const amountInCents = BigInt(Math.floor(parseFloat(amount)));

        // Get quote for BNB amount
        const quote = await publicClient.readContract({
          ...BSC_CONTRACT,
          functionName: 'getQuote',
          args: [amountInCents],
        }) as bigint;

        // Make the purchase
        const hash = await walletClient.writeContract({
          ...BSC_CONTRACT,
          functionName: 'purchaseWithUSDAmount',
          args: [amountInCents, solanaPublicKey?.toString() || ''],
          value: quote,
        });

        toast.success(`Transaction submitted! Hash: ${hash}`, {
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
          toast.success('Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
          });
        } else {
          throw new Error('Transaction failed');
        }
      } else {
        // Simulate transaction for other chains (replace with actual implementation)
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success('Transaction successful! Doge-Head tokens will be sent to your Solana wallet.', {
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
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed. Please try again.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Check initialization status when wallet connects
  useEffect(() => {
    if (solanaConnected && solanaPublicKey) {
      checkInitialization();
    }
  }, [solanaConnected, solanaPublicKey, checkInitialization]);

  // Add this function to fetch transaction record data
  const fetchTransactionRecord = useCallback(async () => {
    if (!solanaConnected || !solanaPublicKey) return;

    try {
      const program = getProgram();
      if (!program) return;

      // Get the transaction record PDA
      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );

      // Fetch the account data
      const accountInfo = await connection.getAccountInfo(transactionRecord);
      if (!accountInfo) return;

      // Decode the account data
      const decodedData = await program.coder.accounts.decode('transactionRecord', accountInfo.data);

      // Update state with the fetched data
      setTotalUsdSold(decodedData.totalUsdSold);
      setTotalTokensSold(decodedData.totalTokensSold);
      setTransactions(decodedData.transactions);
      setCurrentStage(decodedData.currentStage + 1);

      console.log("Transaction record data:", decodedData);
    } catch (error) {
      console.error('Error fetching transaction record:', error);
    }
  }, [solanaConnected, solanaPublicKey, getProgram, connection]);

  // Add this useEffect to fetch data when wallet connects
  useEffect(() => {
    if (solanaConnected && solanaPublicKey) {
      fetchTransactionRecord();
    }
  }, [solanaConnected, solanaPublicKey, fetchTransactionRecord]);

  // Add useEffect to fetch presale data on component mount and when wallet changes
  useEffect(() => {
    if (solanaConnected && solanaPublicKey) {
      fetchPresaleData();
    }
  }, [solanaConnected, solanaPublicKey, fetchPresaleData]);

  return (
    <div className={styles.presaleContainer}>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div
        className={styles.presaleCard}
      >
        <div className={styles.tokenInfo}>
          <div className={styles.tokenHeader}>
            <h2>Doge-Head Token Presale</h2>
            <span className={styles.tokenSymbol}>$DOGE-HEAD</span>
          </div>

          <div className={styles.presaleStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Stage {currentStage}</span>
              <span className={styles.statValue}>{stageData?.availableTokens.toLocaleString()} tokens</span>
              <span className={styles.statSubValue}>${stageData?.pricePerToken} per token</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total USD Sold</span>
              <span className={styles.statValue}>${totalUsdSold.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Tokens Sold</span>
              <span className={styles.statValue}>{formatTokenAmount(totalTokensSold)}</span>
            </div>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${Math.min(
                  ((totalTokensSold / 1e9) / (stageData?.availableTokens || 1)) * 100,
                  100
                )}%`
              }}
            ></div>
            <div className={styles.progressText}>
              {Math.floor(totalTokensSold / 1e9).toLocaleString()}/{stageData?.availableTokens.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        <div className={styles.walletSection}>
          <div className={styles.walletStatus}>
            <div className={styles.walletStatusItem}>
              <span className={styles.walletLabel}>Solana Wallet (Devnet):</span>
              <span className={`${styles.walletValue} ${solanaConnected ? styles.connected : ''}`}>
                {solanaConnected
                  ? `${solanaPublicKey?.toString().slice(0, 4)}...${solanaPublicKey?.toString().slice(-4)}`
                  : 'Not Connected'}
              </span>
              {solanaConnected ? (
                <button
                  className={styles.disconnectButton}
                  onClick={disconnectSolana}
                >
                  Disconnect
                </button>
              ) : (
                <button
                  className={styles.connectButton}
                  disabled={solanaConnecting}
                >
                  {solanaConnecting ? 'Connecting...' : 'Connect Solana'}
                </button>
              )}
            </div>

            {selectedPaymentChain !== 'solana' && (
              <div className={styles.walletStatusItem}>
                <span className={styles.walletLabel}>Payment Wallet (Testnet):</span>
                <span className={`${styles.walletValue} ${evmConnected ? styles.connected : ''}`}>
                  {evmConnected
                    ? `${evmAddress?.slice(0, 4)}...${evmAddress?.slice(-4)}`
                    : 'Not Connected'}
                </span>
                {evmConnected && (
                  <div className={styles.chainInfo}>
                    <span className={styles.chainName}>
                      {chain?.name || 'Connected'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin controls */}
          {solanaConnected && isAdmin && (
            <div className={styles.adminControls}>
              <h3>Admin Controls</h3>
              {!isInitialized ? (
                <button
                  className={styles.adminButton}
                  onClick={handleInitialize}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Initialize Contract'}
                </button>
              ) : (
                <div className={styles.initializedStatus}>
                  <span className={styles.initializedText}>Contract Initialized</span>
                  <span className={styles.adminBadge}>You are the admin</span>
                  <button
                    className={styles.adminButton}
                    onClick={handleNextStage}
                    disabled={isProcessing || currentStage >= presaleStages.length - 1}
                  >
                    {isProcessing ? 'Processing...' : 'Next Stage'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={styles.paymentOptions}>
            <h3>Select Payment Chain</h3>
            <div className={styles.paymentOptionsGrid}>
              {PAYMENT_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.paymentOption} ${selectedPaymentChain === option.id ? styles.selected : ''} ${option.isDisabled ? styles.disabled : ''}`}
                  onClick={() => !option.isDisabled && handlePaymentChainSelect(option.id)}
                >
                  <img src={option.icon} alt={option.name} className={styles.chainIcon} />
                  <span>{option.name}</span>
                  {option.isDisabled && <span className={styles.disabledLabel}>Coming Soon</span>}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.buySection}>
            <div className={styles.inputGroup}>
              <label>Amount ($)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className={styles.input}
                disabled={
                  !solanaConnected ||
                  (selectedPaymentChain !== 'solana' && !evmConnected) ||
                  !selectedPaymentChain ||
                  isProcessing ||
                  (selectedPaymentChain === 'solana' && !isInitialized)
                }
              />
            </div>

            <div className={styles.tokenCalculation}>
              <span>You will receive:</span>
              <span className={styles.tokenAmount}>
                {tokensToReceive} DOGE-HEAD
              </span>
            </div>

            <button
              className={styles.buyButton}
              onClick={handleBuyTokens}
              disabled={
                !solanaConnected ||
                (selectedPaymentChain !== 'solana' && !evmConnected) ||
                !selectedPaymentChain ||
                !amount ||
                isProcessing ||
                (selectedPaymentChain === 'solana' && !isInitialized)
              }
            >
              {isProcessing ? 'Processing...' : 'Buy Doge-Head Tokens'}
            </button>
            {selectedPaymentChain === 'solana' && !isInitialized && (
              <p className={styles.warningText}>Contract not initialized. Please contact the admin.</p>
            )}
          </div>
        </div>
      </div>
      <div className={styles.roadmapSection}>
        <h2>Roadmap</h2>
        <div className={styles.roadmapTimeline}>
          <div className={styles.roadmapItem}>
            <div className={styles.roadmapPhase}>1</div>
            <div className={styles.roadmapContent}>
              <h3>Gaming Focus</h3>
              <p>Continue focusing on video games and all mini-projects that will sustain $DHC</p>
            </div>
          </div>
          <div className={styles.roadmapItem}>
            <div className={styles.roadmapPhase}>2</div>
            <div className={styles.roadmapContent}>
              <h3>Presale Completion</h3>
              <p>Complete the presale and distribute tokens to early supporters</p>
            </div>
          </div>
          <div className={styles.roadmapItem}>
            <div className={styles.roadmapPhase}>3</div>
            <div className={styles.roadmapContent}>
              <h3>DEX Listing</h3>
              <p>List on decentralized exchanges to provide liquidity and trading options</p>
            </div>
          </div>
          <div className={styles.roadmapItem}>
            <div className={styles.roadmapPhase}>4</div>
            <div className={styles.roadmapContent}>
              <h3>Artist Platform</h3>
              <p>Launch a platform where artists of all kinds can receive tips in $DHC</p>
            </div>
          </div>
          <div className={styles.roadmapItem}>
            <div className={styles.roadmapPhase}>5</div>
            <div className={styles.roadmapContent}>
              <h3>CEX Listing</h3>
              <p>List on centralized exchanges to reach a wider audience and increase trading volume</p>
            </div>
          </div>
        </div>
      </div>
      {/* Add a transactions section if you want to display them */}
      {transactions.length > 0 && (
        <div className={styles.transactionsSection}>
          <div className={styles.transactionsHeader}>
            <h3>Recent Transactions</h3>
            <div className={styles.transactionsFilter}>
              <button className={styles.filterButton}>All</button>
              <button className={styles.filterButton}>Today</button>
              <button className={styles.filterButton}>This Week</button>
            </div>
          </div>

          <div className={styles.transactionsList}>
            {transactions.slice(-5).reverse().map((tx, index) => {
              return (
                <div key={index} className={styles.transactionItem}>
                  <div className={styles.transactionCard}>
                    <div className={styles.transactionCardFront}>
                      <div className={styles.transactionIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className={styles.transactionMainInfo}>
                        <div className={styles.transactionType}>Token Purchase</div>
                        <div className={styles.transactionAmount}>${tx.usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className={styles.transactionTime}>{new Date(tx.timestamp * 1000).toLocaleString()}</div>
                      </div>

                      <div className={styles.transactionStage}>
                        <span className={styles.stageBadge}>Stage {tx.stage + 1}</span>
                      </div>
                    </div>

                    <div className={styles.transactionCardBack}>
                      <div className={styles.transactionDetails}>
                        <div className={styles.detailGroup}>
                          <div className={styles.detailLabel}>Buyer</div>
                          <div className={styles.detailValue}>{tx.buyer.toString().slice(0, 4)}...{tx.buyer.toString().slice(-4)}</div>
                        </div>

                        <div className={styles.detailGroup}>
                          <div className={styles.detailLabel}>SOL Paid</div>
                          <div className={styles.detailValue}>{formatSolAmount(tx.solAmount)} SOL</div>
                        </div>

                        <div className={styles.detailGroup}>
                          <div className={styles.detailLabel}>Tokens Received</div>
                          <div className={styles.detailValue}>{formatTokenAmount(tx.tokenAmount)} DOGE-HEAD</div>
                        </div>
                      </div>

                      <div className={styles.transactionActions}>
                        <button className={styles.actionButton}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          View Details
                        </button>
                        <button className={styles.actionButton}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {transactions.length > 5 && (
            <div className={styles.viewMoreContainer}>
              <button className={styles.viewMoreButton}>
                <span>View All Transactions</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 