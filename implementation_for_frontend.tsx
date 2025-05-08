import { FC, useState, useEffect, useCallback, ChangeEvent } from "react";
import {
  useConnection,
  useWallet as useSolanaWallet,
} from "@solana/wallet-adapter-react";
import {
  useAccount,
  // useConnect,
  // useDisconnect,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
// import { InjectedConnector } from "wagmi/connectors/injected";
// import { MetaMaskConnector } from "wagmi/connectors/metaMask";
// import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { usePublicClient, useWalletClient } from "wagmi";
// import { parseEther } from "viem";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BASE_ETH_CONTRACT } from "../contracts/baseEth";
import { BSC_CONTRACT } from "../contracts/bscContract";
// import { DogePresaleIDL } from "../contracts/old_solanaIdl";
import {
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  Transaction as SolanaTransaction,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  BN,
  // setProvider,
  // web3,
} from "@coral-xyz/anchor";
import { DogePresale, IDL } from "../contracts/solanaIdl";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
// import React from "react";
// import { motion } from "framer-motion";

// Types
interface PaymentOption {
  id: string;
  name: string;
  chainId: number | string;
  icon: string;
  isDisabled: boolean;
}

interface PresaleStage {
  stage: number;
  availableTokens: number;
  pricePerToken: number;
}

interface Transaction {
  usdAmount: number;
  solAmount: number;
  tokenAmount: number;
  stage: number;
  timestamp: number;
  buyer: PublicKey;
}

interface UserProfile {
  totalPaidUsd: number;
  totalPaidSol: number;
  totalTokensBought: number;
  totalTokensClaimed: number;
  lastClaimTimestamp: number;
  referrer: string | PublicKey | null;
  transactions: Transaction[];
}

interface Window {
  solana?: {
    signTransaction: (transaction: SolanaTransaction) => Promise<SolanaTransaction>;
    signAllTransactions: (transactions: SolanaTransaction[]) => Promise<SolanaTransaction[]>;
  };
}

declare global {
  interface Window {
    solana?: {
      signTransaction: (transaction: SolanaTransaction) => Promise<SolanaTransaction>;
      signAllTransactions: (transactions: SolanaTransaction[]) => Promise<SolanaTransaction[]>;
    };
  }
}

// Constants
const TOKEN_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

// Chain IDs
const CHAIN_IDS = {
  BASE_ETH: 84532, // Base Sepolia
  POLYGON_TESTNET: 80001, // Mumbai
  BSC_TESTNET: 97, // BSC Testnet
  SOLANA: "solana", // Solana Mainnet
} as const;

// Payment options
const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "solana",
    name: "Solana (Mainnet)",
    chainId: CHAIN_IDS.SOLANA,
    icon: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
    isDisabled: false,
  },
  {
    id: "base",
    name: "Base ETH (Sepolia)",
    chainId: CHAIN_IDS.BASE_ETH,
    icon: "https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-6278326_1280.png",
    isDisabled: false,
  },
  {
    id: "polygon",
    name: "Polygon (Mumbai)",
    chainId: CHAIN_IDS.POLYGON_TESTNET,
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFI4axCrJbxy8fjqJhZEu_DXCHYAqXjSICXg&s",
    isDisabled: true,
  },
  {
    id: "bsc",
    name: "BSC (Testnet)",
    chainId: CHAIN_IDS.BSC_TESTNET,
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP9cUvoCvmCXO4pNHvnREHBCKW30U-BVxKfg&s",
    isDisabled: false,
  },
];

// Custom toast styles
const toastStyles = {
  style: {
    background: "#1a1a1a",
    color: "#fff",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  progressStyle: {
    background: "linear-gradient(to right, #4a90e2, #50e3c2)",
  },
};

// Presale stages data
const presaleStages: PresaleStage[] = [
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
    // connecting: solanaConnecting,
    // disconnect: disconnectSolana,
  } = useSolanaWallet();

  // EVM wallet state - using existing w3m connections
  const {
    //  address: evmAddress,
    isConnected: evmConnected,
  } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  // Presale state
  const [selectedPaymentChain, setSelectedPaymentChain] = useState<
    string | null
  >(null);
  const [amount, setAmount] = useState<string>("");
  const [tokensToReceive, setTokensToReceive] = useState<string>("0");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [referrerAddress, setReferrerAddress] = useState<string>("");
  // const stageData = presaleStages.find((s) => s.stage === currentStage);

  // Add these state variables near your other state declarations
  const [
    ,
    // totalUsdSold
    setTotalUsdSold,
  ] = useState<number>(0);
  const [
    ,
    // totalTokensSold
    setTotalTokensSold,
  ] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Move hooks to component level
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [
    ,
    // provider
    setProvider,
  ] = useState<AnchorProvider | null>(null);

  // Add utility function to format token amounts
  const formatTokenAmount = (amount: number) => {
    // Convert from 9 decimals to a readable number
    const formattedAmount = amount / 1e9;
    return formattedAmount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  };

  // Add utility function to format SOL amounts
  const formatSolAmount = (amount: number) => {
    // Convert from lamports (9 decimals) to SOL
    const formattedAmount = amount / 1e9;
    return formattedAmount.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 2,
    });
  };

  // Calculate tokens to receive based on amount and current stage
  useEffect(() => {
    if (amount && !isNaN(Number(amount)) && currentStage > 0) {
      const currentStageData = presaleStages.find(
        (s) => s.stage === currentStage
      );
      if (currentStageData) {
        // Calculate tokens based on USD amount and current stage price
        const tokens = Number(amount) / currentStageData.pricePerToken;
        setTokensToReceive(
          tokens.toLocaleString(undefined, { maximumFractionDigits: 2 })
        );
      } else {
        setTokensToReceive("0");
      }
    } else {
      setTokensToReceive("0");
    }
  }, [amount, currentStage]);

  // Add function to get current stage info
  // const getCurrentStageInfo = () => {
  //   return (
  //     presaleStages.find((s) => s.stage === currentStage) || presaleStages[0]
  //   );
  // };

  // Add function to format price
  // const formatPrice = (price: number) => {
  //   return price.toLocaleString(undefined, {
  //     minimumFractionDigits: 4,
  //     maximumFractionDigits: 4,
  //   });
  // };

  // Handle payment chain selection
  const handlePaymentChainSelect = (chainId: string) => {
    const selectedOption = PAYMENT_OPTIONS.find(
      (option) => option.id === chainId
    );
    if (selectedOption?.isDisabled) {
      toast.error("This payment option is currently disabled", {
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
    if (chainId !== "solana") {
      const chainIdNum: any = PAYMENT_OPTIONS.find(
        (option) => option.id === chainId
      )?.chainId;
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

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "processed",
    });

    // Set the provider globally
    setProvider(provider);

    return provider;
  }, [connection, solanaPublicKey]);

  // Get program instance
  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;

    // Create a proper PublicKey object for the program ID.
    const programId = new PublicKey(
      "7pFUVAWGA8KzhZvDz5GRYi8JVkshrcHYbVYCBwZnBkJG"
    );

    // Pass the programId as the second parameter.
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
        console.error("Error fetching account:", error);
        setIsInitialized(false);
      }
    } catch (error) {
      console.error("Error checking initialization:", error);
      setIsInitialized(false);
    }
  }, [solanaConnected, solanaPublicKey, getProgram, connection]);

  // Initialize the contract
  const handleInitialize = async () => {
    if (!solanaConnected || !solanaPublicKey) {
      toast.error("Please connect your Solana wallet first", {
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
    toast.info("Initializing contract...", {
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
        throw new Error("Provider not initialized");
      }

      const program = getProgram();
      if (!program || !solanaPublicKey) {
        throw new Error("Program or wallet not initialized");
      }

      // Debug logging
      console.log("Program ID:", program.programId.toString());
      console.log("Connection endpoint:", connection.rpcEndpoint);
      console.log("Wallet public key:", solanaPublicKey.toString());

      // Check if program exists
      const programInfo = await connection.getAccountInfo(program.programId);
      console.log("Program exists:", !!programInfo);

      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );

      console.log("Transaction record PDA:", transactionRecord.toString());

      const accountInfo = await connection.getAccountInfo(transactionRecord);
      if (accountInfo) {
        toast.info("Contract already initialized", {
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

      // Create a new token mint for the presale
      const tokenMint = new PublicKey(
        "mntPPX7vem9xnqVAwpyt1VmdqEDTmmzhZeCDxSUHgBV"
      );

      console.log("Token mint:", tokenMint.toString());

      // Step 1: Initialize with minimal space
      const initTx = await program.methods
        .initialize(tokenMint)
        .accounts({
          authority: solanaPublicKey,
          transactionRecord: transactionRecord,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Init transaction:", initTx);

      toast.info("Contract initialized, resizing account...", {
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

      console.log("Resize transaction:", resizeTx);

      toast.success(
        `Contract initialized and resized! Init Hash: ${initTx}, Resize Hash: ${resizeTx}`,
        {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          ...toastStyles,
        }
      );

      setIsInitialized(true);
      setIsAdmin(true);
    } catch (error) {
      console.error("Initialization error:", error);
      // Log more detailed error information
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      toast.error("Failed to initialize contract. Please try again.", {
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
  const handleSolanaBuy = async (amount: number, referrer?: string) => {
    try {
      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error("Invalid amount");
      }

      const provider = getProvider();
      if (!provider) {
        throw new Error("Provider not initialized");
      }

      const program = getProgram();
      if (!program || !solanaPublicKey) {
        throw new Error("Program or wallet not initialized");
      }

      // Get the transaction record PDA
      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );

      // Use the authority wallet address as the treasury
      const treasuryWallet = new PublicKey(
        "HdXaRhYhTxbRYq3AJppZQqZumewgRe1LkCHEQnEnGFy4"
      );

      // Check if the transaction record account exists
      const transactionRecordInfo = await connection.getAccountInfo(
        transactionRecord
      );
      if (!transactionRecordInfo) {
        throw new Error(
          "Transaction record account not found. Contract may not be initialized."
        );
      }

      // Parse and validate referrer if provided
      let referrerPubkey: PublicKey | null = null;
      if (referrer) {
        try {
          referrerPubkey = new PublicKey(referrer);
          // Validate that referrer is not the buyer
          if (referrerPubkey.equals(solanaPublicKey)) {
            throw new Error("Referrer cannot be the same as buyer");
          }
        } catch (error) {
          throw new Error("Invalid referrer address");
        }
      } else {
        // Use default referrer if none provided
        try {
          referrerPubkey = new PublicKey(
            "FKYFEsTodpGigfLowvTk4gSt2yK8fDjJfEWtkKYZcnsz"
          );
        } catch (error) {
          console.error("Error setting default referrer:", error);
          // Continue without referrer if default fails
          referrerPubkey = null;
        }
      }

      // Convert amount to f64 for the contract
      const usdAmount = Number(amount.toFixed(2));

      // Check if this is a subsequent purchase with a referrer
      const transactionRecordData =
        await program.account.transactionRecord.fetch(transactionRecord);
      const existingBuyer = transactionRecordData.buyers.find((buyer: any) =>
        buyer.buyerAddress.equals(solanaPublicKey)
      );

      // Prepare accounts object with proper typing
      const accounts: {
        buyer: PublicKey;
        treasury: PublicKey;
        transactionRecord: PublicKey;
        systemProgram: PublicKey;
        referrer?: PublicKey;
      } = {
        buyer: solanaPublicKey,
        treasury: treasuryWallet,
        transactionRecord: transactionRecord,
        systemProgram: SystemProgram.programId,
      };

      // If this is a subsequent purchase with a referrer, include the referrer account
      if (existingBuyer && existingBuyer.referrer) {
        accounts.referrer = existingBuyer.referrer;
      } else if (referrerPubkey) {
        // For first purchase with referrer
        accounts.referrer = referrerPubkey;
      }

      // Prepare the transaction
      const tx = await program.methods
        .buy(usdAmount, referrerPubkey)
        .accounts(accounts)
        .rpc({
          commitment: "confirmed",
        });

      console.log("Transaction successful:", tx);
      if (referrerPubkey) {
        console.log("Referrer used:", referrerPubkey.toBase58());
      }

      return tx;
    } catch (error) {
      console.error("Solana buy error:", error);
      if (error instanceof Error) {
        throw new Error(`Transaction failed: ${error.message}`);
      }
      throw new Error("Transaction failed with unknown error");
    }
  };

  // Add fetchPresaleData function to refresh data after stage change
  const fetchPresaleData = useCallback(async () => {
    if (!solanaConnected || !solanaPublicKey) {
      console.log("Cannot fetch presale data: wallet not connected");
      return;
    }

    try {
      console.log("Fetching presale data...");
      const program = getProgram();
      if (!program) {
        console.log("Program not initialized");
        return;
      }

      // Get the transaction record PDA
      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );

      console.log("Transaction record PDA:", transactionRecord.toString());

      // Fetch the transaction record account
      const account = await program.account.transactionRecord.fetch(
        transactionRecord
      );

      console.log("Fetched account data:", {
        currentStage: account.currentStage,
        totalUsdSold: account.totalUsdSold,
        totalTokensSold: account.totalTokensSold,
        transactionCount: account.transactionCount,
        authority: account.authority.toString(),
        currentUser: solanaPublicKey.toString(),
        isAdmin: account.authority.equals(solanaPublicKey),
      });

      // // Example client-side code
      // const buyerInfo = await program.methods
      //   .getBuyerInfo()
      //   .accounts({
      //     buyerAddress: solanaPublicKey,
      //     transactionRecord: transactionRecord,
      //   })
      //   .view();

      // Update state with fetched data
      setCurrentStage(account.currentStage + 1);
      setTotalUsdSold(account.totalUsdSold);
      setTotalTokensSold(account.totalTokensSold);
      setTransactions(account.transactions);

      // Check if the current user is the admin
      const isUserAdmin = account.authority.equals(solanaPublicKey);
      console.log("Is user admin?", isUserAdmin);
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error("Error fetching presale data:", error);
    }
  }, [solanaConnected, solanaPublicKey, getProgram]);

  // Handle buy tokens
  const handleBuyTokens = async (referrerAddress: string) => {
    if (!solanaConnected) {
      toast.error("Please connect your Solana wallet first", {
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
      toast.error("Minimum purchase amount is $1", {
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

    if (selectedPaymentChain === "solana") {
      if (!isInitialized) {
        toast.error("Contract not initialized. Please contact the admin.", {
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
        toast.error(
          "Please connect your payment wallet and select a payment chain",
          {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
          }
        );
        return;
      }

      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        toast.error("Please enter a valid amount", {
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
    toast.info("Processing transaction...", {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...toastStyles,
    });

    try {
      if (selectedPaymentChain === "solana") {
        // Convert amount to a number and ensure it's valid
        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          throw new Error("Invalid amount");
        }

        const tx = await handleSolanaBuy(amountNum, referrerAddress);

        toast.success(`Transaction submitted! Hash: ${tx}`, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          ...toastStyles,
        });
      } else if (selectedPaymentChain === "base") {
        if (!walletClient) {
          throw new Error("Wallet client not available");
        }

        // Convert amount to cents (multiply by 100)
        const amountInCents = BigInt(Math.floor(parseFloat(amount)));

        // Get quote for ETH amount
        const quote = (await publicClient.readContract({
          ...BASE_ETH_CONTRACT,
          functionName: "getQuote",
          args: [amountInCents],
        })) as bigint;

        // Make the purchase
        const hash = await walletClient.writeContract({
          ...BASE_ETH_CONTRACT,
          functionName: "purchaseWithUSDAmount",
          args: [amountInCents, solanaPublicKey?.toString() || ""],
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
        if (receipt.status === "success") {
          toast.success(
            "Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.",
            {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              ...toastStyles,
            }
          );
        } else {
          throw new Error("Transaction failed");
        }
      } else if (selectedPaymentChain === "bsc") {
        if (!walletClient) {
          throw new Error("Wallet client not available");
        }

        // Convert amount to cents (multiply by 100)
        const amountInCents = BigInt(Math.floor(parseFloat(amount)));

        // Get quote for BNB amount
        const quote = (await publicClient.readContract({
          ...BSC_CONTRACT,
          functionName: "getQuote",
          args: [amountInCents],
        })) as bigint;

        // Make the purchase
        const hash = await walletClient.writeContract({
          ...BSC_CONTRACT,
          functionName: "purchaseWithUSDAmount",
          args: [amountInCents, solanaPublicKey?.toString() || ""],
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
        if (receipt.status === "success") {
          toast.success(
            "Transaction confirmed! Doge-Head tokens will be sent to your Solana wallet.",
            {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              ...toastStyles,
            }
          );
        } else {
          throw new Error("Transaction failed");
        }
      } else {
        // Simulate transaction for other chains (replace with actual implementation)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success(
          "Transaction successful! Doge-Head tokens will be sent to your Solana wallet.",
          {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastStyles,
          }
        );
      }

      // After successful transaction
      await fetchTransactionRecord(); // Refresh the data
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed. Please try again.", {
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
      const accountInfo: any = await program.account.transactionRecord.fetch(
        transactionRecord
      );

      if (!accountInfo) return;

      // Decode the account data
      const decodedData = await program.coder.accounts.decode(
        "transactionRecord",
        accountInfo.data
      );

      // Update state with the fetched data
      setTotalUsdSold(decodedData.totalUsdSold);
      setTotalTokensSold(decodedData.totalTokensSold);
      setTransactions(decodedData.transactions);
      setCurrentStage(decodedData.currentStage + 1);

      console.log("Transaction record data:", decodedData);
    } catch (error) {
      console.error("Error fetching transaction record:", error);
    }
  }, [solanaConnected, solanaPublicKey, getProgram]);

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

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Add loading state for user profile
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);

  // Add function to fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!solanaConnected || !solanaPublicKey) {
      setUserProfile(null);
      return;
    }

    setIsProfileLoading(true);
    try {
      const program = getProgram();
      if (!program) {
        throw new Error("Program not initialized");
      }

      // Get the transaction record PDA
      const [transactionRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from("transaction_record")],
        program.programId
      );

      // Fetch the transaction record account
      const account = await program.account.transactionRecord.fetch(
        transactionRecord
      );

      // Find the user's buyer info
      const buyerInfo = account.buyers.find((b) =>
        b.buyerAddress.equals(solanaPublicKey)
      );

      if (!buyerInfo) {
        setUserProfile(null);
        return;
      }

      // Get user's transactions
      const userTransactions = account.transactions
        .filter((tx) => tx.buyer.equals(solanaPublicKey))
        .map((tx) => ({
          usdAmount: tx.usdAmount,
          solAmount: tx.solAmount,
          tokenAmount: tx.tokenAmount,
          stage: tx.stage,
          timestamp: tx.timestamp,
        }));

      console.log("--------- buyerInfo", buyerInfo);
      //buyerInfo.referrer

      setUserProfile({
        totalPaidUsd: buyerInfo.totalPaidUsd,
        totalPaidSol: buyerInfo.totalPaidSol,
        totalTokensBought: buyerInfo.totalTokensBought,
        totalTokensClaimed: buyerInfo.totalTokensClaimed,
        lastClaimTimestamp: buyerInfo.lastClaimTimestamp,
        referrer: buyerInfo?.referrer || "",
        transactions: userTransactions,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.info("Failed to fetch user profile. Please try again.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
      setUserProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, [solanaConnected, solanaPublicKey, getProgram]);

  // Add useEffect to fetch user profile when wallet connects or after successful transaction
  useEffect(() => {
    if (solanaConnected && solanaPublicKey) {
      fetchUserProfile();
    }
  }, [solanaConnected, solanaPublicKey, fetchUserProfile]);

  // Add format functions for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Add showReferrer state
  const [showReferrer, setShowReferrer] = useState<boolean>(false);

  // --- Hero Banner Slider ---
  const bannerImages = [
    "https://img.freepik.com/free-photo/3d-render-black-hands-with-golden-coins-abundance_107791-17776.jpg?t=st=1746378536~exp=1746382136~hmac=7c58febbcb1e08174d802eebb8e1cf54f8a71d1b0919dfebded26775186da578&w=1800",
    "https://img.freepik.com/premium-photo/golden-coin-3d-render_1007678-362.jpg?w=1380",
  ];
  // const bannerTexts = [
  //   "Join the Solana Token Presale Today!",
  //   "Be Early. Be Rewarded. Own the Future of $DOGE-HEAD.",
  // ];
  const [
    ,
    // currentBanner
    setCurrentBanner,
  ] = useState(0);
  const [
    ,
    // nextBanner
    setNextBanner,
  ] = useState(1);
  const [
    ,
    // fade
    setFade,
  ] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
        setNextBanner((prev) => (prev + 1) % bannerImages.length);
        setFade(false);
      }, 900); // fade duration
    }, 4000); // show each image for 4s
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // Add new state for deposit
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState<boolean>(false);

  // Add utility functions
  async function getDepositTokenAccounts(
    program: Program,
    mintAccount: PublicKey,
    wallet: PublicKey
  ) {
    // Get transaction record PDA
    const [transactionRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction_record")],
      program.programId
    );

    // Get presale token account using the custom token program
    const [presaleTokenAccountPda] = PublicKey.findProgramAddressSync(
      [
        transactionRecordPda.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintAccount.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get user's token account using the custom token program
    const [fromTokenAccount] = PublicKey.findProgramAddressSync(
      [
        wallet.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintAccount.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return {
      transactionRecordPda,
      presaleTokenAccountPda,
      fromTokenAccount,
    };
  }

  async function checkDepositPrerequisites(
    amount: number,
    mintAccount: PublicKey,
    wallet: PublicKey,
    program: Program,
    connection: Connection
  ): Promise<void> {
    // Get user's token account using the custom token program
    const customTokenProgramId = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
    
    // Derive the associated token account PDA
    const [fromTokenAccount] = PublicKey.findProgramAddressSync(
      [
        wallet.toBuffer(),
        customTokenProgramId.toBuffer(),
        mintAccount.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Check if token account exists
    let tokenAccountInfo;
    try {
      tokenAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    } catch (error) {
      console.error("Error checking token account:", error);
    }

    // If token account doesn't exist, create it
    if (!tokenAccountInfo) {
      const provider = getProvider();
      if (!provider) throw new Error("Provider not initialized");

      const createAtaInstruction = createAssociatedTokenAccountInstruction(
        wallet, // payer
        fromTokenAccount, // ata
        wallet, // owner
        mintAccount, // mint
        customTokenProgramId // token program ID
      );

      const createAtaTx = new SolanaTransaction().add(createAtaInstruction);
      const createAtaSignature = await provider.sendAndConfirm(createAtaTx);
      console.log("Created token account:", createAtaSignature);

      // Wait for confirmation
      await connection.confirmTransaction(createAtaSignature);
    }

    // Now check the balance
    try {
      const balance = await connection.getTokenAccountBalance(fromTokenAccount);
      if (!balance.value.uiAmount || balance.value.uiAmount < amount) {
        throw new Error("Insufficient token balance");
      }
    } catch (error: any) {
      if (error.message?.includes("Token account not found")) {
        throw new Error("Token account does not exist. Please create it first.");
      }
      throw error;
    }

    // Check if user is authority
    const [transactionRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction_record")],
      program.programId
    );

    const record = await program.account.transactionRecord.fetch(
      transactionRecordPda
    );

    if (!record.authority || record.authority.toString() !== wallet.toString()) {
      throw new Error("Not authorized to deposit tokens");
    }
  }

  // Update the main deposit function
  const handleDepositTokens = async (amount: number) => {
    try {
      if (!solanaPublicKey) throw new Error("Wallet not connected");
      
      const provider = getProvider();
      if (!provider) throw new Error("Provider not initialized");

      const program = getProgram();
      if (!program) throw new Error("Program not initialized");

      const tokenMint = new PublicKey(
        "mntPPX7vem9xnqVAwpyt1VmdqEDTmmzhZeCDxSUHgBV"
      );

      // Check prerequisites
      await checkDepositPrerequisites(
        amount,
        tokenMint,
        solanaPublicKey,
        program as unknown as Program,
        connection
      );

      // Get all necessary accounts
      const {
        transactionRecordPda,
        presaleTokenAccountPda,
        fromTokenAccount,
      } = await getDepositTokenAccounts(program as unknown as Program, tokenMint, solanaPublicKey);

      // Check if presale token account exists
      let createAtaIx: TransactionInstruction | null = null;
      try {
        await connection.getAccountInfo(presaleTokenAccountPda);
      } catch {
        // Create the associated token account if it doesn't exist
        createAtaIx = createAssociatedTokenAccountInstruction(
          solanaPublicKey,
          presaleTokenAccountPda,
          transactionRecordPda,
          tokenMint,
          TOKEN_PROGRAM_ID // Use the custom token program ID
        );
      }

      // Prepare the transaction
      const tx = await (program as unknown as Program).methods
        .depositToken(new BN(amount * 1e9))
        .accounts({
          authority: solanaPublicKey,
          transactionRecord: transactionRecordPda,
          mintAccount: tokenMint,
          fromTokenAccount: fromTokenAccount,
          presaleTokenAccount: presaleTokenAccountPda,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID, // Use the custom token program ID
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Add the create ATA instruction if needed
      if (createAtaIx) {
        tx.add(createAtaIx);
      }

      // Sign and send the transaction
      const signature = await provider.sendAndConfirm(tx);
      console.log("Transaction successful:", signature);
      return signature;
    } catch (error) {
      console.error("Token deposit error:", error);
      throw error;
    }
  };

  // Add wrapper function for click handler
  const handleDepositClick = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      toast.error("Please enter a valid amount", {
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

    setIsDepositing(true);
    try {
      const tx = await handleDepositTokens(Number(depositAmount));
      toast.success(`Tokens deposited successfully! Hash: ${tx}`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
      await fetchPresaleData();
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to deposit tokens. Please try again.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...toastStyles,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
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

      {/* Hero Section */}
      <div className="w-full py-8 md:py-16">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
          {/* Large faint background text */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
            <span className="text-[16vw] md:text-[10vw] font-extrabold text-white/5 tracking-tight leading-none uppercase">
              DOGE-HEAD
            </span>
          </div>
          {/* Main content */}
          <div className="relative z-10 flex flex-col md:flex-row items-center w-full gap-8 md:gap-16">
            {/* Headline and subheadline */}
            <div className="flex-1 w-full md:w-1/2 flex flex-col items-start justify-center mb-8 md:mb-0">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
                Join the Solana Token Presale Today!
              </h1>
              <p className="text-lg md:text-2xl font-medium text-white/80 mb-6">
                Be Early. Be Rewarded. Own the Future of{" "}
                <span className="text-yellow-400 font-bold">$DOGE-HEAD</span>.
              </p>
            </div>
            {/* Glassmorphic Calculator Card */}
            <div className="flex-1 w-full md:w-auto flex justify-center">
              <div className="rounded-2xl shadow-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 p-6 md:p-8 flex flex-col items-center min-w-[90vw] max-w-xs md:min-w-[340px] md:max-w-xs">
                {/* Compact Calculator Card */}
                <div className="w-full space-y-4">
                  <div>
                    <label className="block text-xs text-yellow-400 mb-1">
                      Payment Chain
                    </label>
                    <div className="flex flex-col gap-2">
                      {PAYMENT_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            selectedPaymentChain === option.id
                              ? "bg-yellow-400/90 border-yellow-400 text-black"
                              : "bg-black/80 border-white/10 text-white hover:bg-yellow-400/10"
                          } ${
                            option.isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() =>
                            !option.isDisabled &&
                            handlePaymentChainSelect(option.id)
                          }
                          disabled={option.isDisabled}
                        >
                          <img
                            src={option.icon}
                            alt={option.name}
                            className="w-5 h-5"
                          />
                          {option.name}
                          {option.isDisabled && (
                            <span className="ml-auto text-[10px] bg-black text-yellow-400 px-2 py-0.5 rounded">
                              Soon
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-400 mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 rounded bg-black/80 border border-yellow-400/20 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-200 disabled:opacity-50 text-white"
                      disabled={
                        !solanaConnected ||
                        (selectedPaymentChain !== "solana" && !evmConnected) ||
                        !selectedPaymentChain ||
                        isProcessing ||
                        (selectedPaymentChain === "solana" && !isInitialized)
                      }
                    />
                  </div>
                  {/* Referrer field is hidden by default, shown on demand */}
                  <div>
                    <button
                      type="button"
                      className="text-[11px] text-yellow-400 underline mb-1"
                      onClick={() => setShowReferrer((v) => !v)}
                    >
                      {showReferrer ? "Hide Referrer" : "Add Referrer"}
                    </button>
                    {showReferrer && (
                      <input
                        type="text"
                        value={referrerAddress}
                        onChange={(e) => setReferrerAddress(e.target.value)}
                        placeholder="Referrer wallet address"
                        className="w-full px-3 py-2 rounded bg-black/80 border border-yellow-400/20 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-200 disabled:opacity-50 mt-1 text-white"
                        disabled={isProcessing}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between px-2 py-2 bg-black/80 border border-yellow-400/20 rounded">
                    <span className="text-xs font-medium text-white">
                      You get
                    </span>
                    <span className="text-xs font-bold text-yellow-400">
                      {tokensToReceive} DOGE-HEAD
                    </span>
                  </div>
                  <button
                    className="w-full py-2 mt-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded font-bold text-xs shadow-lg hover:from-yellow-500 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
                    onClick={() => handleBuyTokens(referrerAddress)}
                    disabled={
                      !solanaConnected ||
                      (selectedPaymentChain !== "solana" && !evmConnected) ||
                      !selectedPaymentChain ||
                      !amount ||
                      isProcessing ||
                      (selectedPaymentChain === "solana" && !isInitialized)
                    }
                  >
                    {isProcessing ? "Processing..." : "Buy"}
                  </button>
                  {selectedPaymentChain === "solana" && !isInitialized && (
                    <div className="mt-4">
                      <button
                        className="w-full py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded font-bold text-xs shadow-lg hover:from-yellow-500 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
                        onClick={handleInitialize}
                        disabled={isProcessing || !solanaConnected}
                      >
                        {isProcessing
                          ? "Initializing..."
                          : "Initialize Contract"}
                      </button>
                      <p className="text-xs text-yellow-400 text-center mt-1">
                        Contract needs to be initialized before purchases can be
                        made.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      {transactions.length > 0 && (
        <div className="w-full py-8 md:py-16">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Recent Transactions
              </h2>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-black/60 backdrop-blur-md border border-yellow-400/30 rounded-lg text-yellow-400 font-semibold hover:bg-yellow-400/10 transition">
                  All
                </button>
                <button className="px-4 py-2 bg-black/60 backdrop-blur-md border border-yellow-400/30 rounded-lg text-yellow-400 font-semibold hover:bg-yellow-400/10 transition">
                  Today
                </button>
                <button className="px-4 py-2 bg-black/60 backdrop-blur-md border border-yellow-400/30 rounded-lg text-yellow-400 font-semibold hover:bg-yellow-400/10 transition">
                  This Week
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transactions
                .slice(-6)
                .reverse()
                .map((tx, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 shadow-2xl p-6 hover:scale-[1.02] transition-transform"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-400/20 border-2 border-yellow-400/30 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-yellow-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">
                            $
                            {tx.usdAmount.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-sm text-yellow-400">
                            Stage {tx.stage + 1}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-yellow-400 font-medium">
                          {new Date(tx.timestamp * 1000).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-400 text-xs font-semibold">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* User Profile Section */}
      {solanaConnected && userProfile && (
        <div className="w-full py-8 md:py-16">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Your Profile
            </h2>
            {isProfileLoading ? (
              <div className="flex items-center justify-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-yellow-500"></div>
                <span>Loading profile...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 shadow-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">
                      Total Investment
                    </h3>
                    <div className="text-2xl font-extrabold text-white mb-1">
                      ${userProfile.totalPaidUsd.toFixed(2)}
                    </div>
                    <div className="text-sm text-yellow-300">
                      ({formatSolAmount(userProfile.totalPaidSol)} SOL)
                    </div>
                  </div>
                  <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 shadow-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">
                      Tokens
                    </h3>
                    <div className="text-base text-white font-semibold mb-1">
                      Bought:{" "}
                      <span className="text-yellow-300">
                        {formatTokenAmount(userProfile.totalTokensBought)}
                      </span>
                    </div>
                    <div className="text-base text-white font-semibold mb-1">
                      Claimed:{" "}
                      <span className="text-yellow-300">
                        {formatTokenAmount(userProfile.totalTokensClaimed)}
                      </span>
                    </div>
                    <div className="text-base text-white font-semibold">
                      Pending:{" "}
                      <span className="text-yellow-300">
                        {formatTokenAmount(
                          userProfile.totalTokensBought -
                            userProfile.totalTokensClaimed
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 shadow-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">
                      Last Claim
                    </h3>
                    <div className="text-base text-white font-semibold">
                      {userProfile.lastClaimTimestamp > 0 ? (
                        <span>
                          {formatDate(userProfile.lastClaimTimestamp)}
                        </span>
                      ) : (
                        <span>No claims yet</span>
                      )}
                    </div>
                  </div>
                  {userProfile.referrer && (
                    <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 shadow-2xl p-6 flex flex-col">
                      <h3 className="text-lg font-bold text-yellow-400 mb-2">
                        Referred By
                      </h3>
                      <div className="text-base text-yellow-300 font-semibold">
                        {typeof userProfile.referrer === "string"
                          ? `${userProfile.referrer.slice(
                              0,
                              4
                            )}...${userProfile.referrer.slice(-4)}`
                          : `${userProfile.referrer
                              .toString()
                              .slice(0, 4)}...${userProfile.referrer
                              .toString()
                              .slice(-4)}`}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    Transaction History
                  </h3>
                  <button
                    className="px-4 py-2 bg-black/60 border border-yellow-400/30 rounded-lg text-yellow-400 font-semibold shadow hover:bg-yellow-400/10 transition disabled:opacity-50"
                    onClick={fetchUserProfile}
                    disabled={isProfileLoading}
                  >
                    {isProfileLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {userProfile.transactions.map((tx, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 shadow p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {tx.usdAmount.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(tx.timestamp * 1000).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-yellow-300 font-semibold">
                        Stage {tx.stage + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roadmap Section */}
      <div className="w-full py-8 md:py-16">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
            Roadmap
          </h2>
          <div className="flex flex-col gap-8">
            {presaleStages.map((stage, index) => (
              <div
                key={index}
                className="rounded-2xl bg-black/60 backdrop-blur-md border border-yellow-400/30 shadow-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-center gap-4 mb-2 md:mb-0">
                  <span className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-400/20 border-2 border-yellow-400 text-yellow-400 font-extrabold text-xl shadow-lg">
                    {stage.stage}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-1">
                      Stage {stage.stage}
                    </h3>
                    <p className="text-base text-white font-medium">
                      {stage.availableTokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end md:items-center">
                  <span className="text-lg font-bold text-yellow-300">
                    ${stage.pricePerToken} per token
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deposit Tokens Section */}
      {isAdmin && (
        <div className="mt-4">
          <div className="flex flex-col gap-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount of tokens to deposit"
              className="w-full px-3 py-2 rounded bg-black/80 border border-yellow-400/20 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-200 disabled:opacity-50 text-white"
              disabled={isDepositing}
            />
            <button
              className="w-full py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded font-bold text-xs shadow-lg hover:from-yellow-500 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
              onClick={handleDepositClick}
              disabled={isDepositing || !depositAmount}
            >
              {isDepositing ? "Depositing..." : "Deposit Tokens"}
            </button>
          </div>
          <p className="text-xs text-yellow-400 text-center mt-1">
            Deposit tokens to the presale contract.
          </p>
        </div>
      )}
    </div>
  );
};
