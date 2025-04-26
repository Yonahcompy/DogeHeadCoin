"use client"

import { DialogFooter } from "../../component/ui/dialog"
import { useState, useCallback, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Program, AnchorProvider, BN, setProvider, web3 } from "@coral-xyz/anchor"
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Input } from "../../component/ui/input"
import { Label } from "../../component/ui/label"
import { Progress } from "../../component/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../component/ui/card"
import { Button } from "../../component/ui/button"
import { Alert, AlertDescription, AlertTitle } from "../../component/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../component/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../component/ui/dialog"
import { Badge } from "../../component/ui/badge"
import {
  Loader2,
  Check,
  AlertCircle,
  Info,
  ArrowRight,
  X,
  RefreshCw,
  Share2,
  Rocket,
  Users,
  TrendingUp,
  Gift,
  Sparkles,
  Coins,
} from "lucide-react"
import type { PalmPresale } from "../palm_presale"
import idl from "../palm_presale.json"
// import { getAssociatedTokenAddress } from "@solana/spl-token"
import { ethers } from "ethers"
import { useEffect as useEffectOriginal } from "react"
import BaseContractABI from '../base-contract-abi.json'

// Add Ethereum window type
declare global {
  interface Window {
    ethereum?: any
  }
}

// Constants
const programID = new PublicKey("4nyxJqG4nUetnAev9Zw7gbWkPpJAS1kedGReGpCRBnPG")
const PRESALE_SEED = Buffer.from("PRESALE_SEED")
const TOKEN_MINT_ADDRESS = new PublicKey("mntPPX7vem9xnqVAwpyt1VmdqEDTmmzhZeCDxSUHgBV")
const USER_SEED = Buffer.from("USER_SEED")
const PRESALE_VAULT = Buffer.from("PRESALE_VAULT")
const REFERRAL_SEED = Buffer.from("REFERRAL_SEED")
const PYTH_SOL_USD_PRICE_FEED = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"
// const PYTH_SOL_USD_PRICE_FEED = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"

// const STAGE_SEED = Buffer.from("STAGE_SEED")
// const TRANSACTION_SEED = Buffer.from("TRANSACTION")

// Base contract constants
const BASE_CONTRACT_ADDRESS = "0xb8407F5693a013e8377146cBDF356AD7B9A1458D"
const BASE_TESTNET_CHAIN_ID = "0x14a34" // Base Sepolia testnet chain ID (84532 in decimal)
const BASE_TESTNET_RPC_URL = "https://sepolia.base.org"
const BASE_TESTNET_EXPLORER = "https://sepolia.basescan.org"

// Add custom notification component
const Notification = ({
  message,
  type = "success",
  onClose,
}: { message: string; type?: "success" | "error" | "info"; onClose: () => void }) => {
  const bgColor =
    type === "success"
      ? "bg-emerald-900/20 border-emerald-500/50"
      : type === "error"
        ? "bg-rose-900/20 border-rose-500/50"
        : "bg-cyan-900/20 border-cyan-500/50"

  const iconColor = type === "success" ? "text-emerald-400" : type === "error" ? "text-rose-400" : "text-cyan-400"

  const Icon = type === "success" ? Check : type === "error" ? AlertCircle : Info

  return (
    <div
      className={`fixed top-4 right-4 z-[99999] max-w-md ${bgColor} border rounded-lg p-4 shadow-lg flex items-start gap-3 backdrop-blur-md`}
    >
      <Icon className={`h-5 w-5 ${iconColor} mt-0.5`} />
      <div className="flex-1">
        <p className="text-white">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const DogeHeadCoinSection = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [presaleInfo, setPresaleInfo] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")
  const [presaleStages, setPresaleStages] = useState<any[]>([])
  const [currentStage, setCurrentStage] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [buyAmount, setBuyAmount] = useState("")
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [showInitializeDialog, setShowInitializeDialog] = useState(false)
  const [tokenMintAddress, setTokenMintAddress] = useState(TOKEN_MINT_ADDRESS.toString())
  const [referralInfo, setReferralInfo] = useState<any>(null)
  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [showReferralStats, setShowReferralStats] = useState(false)
  const [referralStats, setReferralStats] = useState<any>(null)
  const [isCreatingReferral, setIsCreatingReferral] = useState(false)
  const [isClaimingRewards, setIsClaimingRewards] = useState(false)
  const [isLoadingReferralStats, setIsLoadingReferralStats] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [usdAmount, setUsdAmount] = useState("")
  const [showUsdBuyDialog, setShowUsdBuyDialog] = useState(false)
  const [isUsdLoading, setIsUsdLoading] = useState(false)
  const [usdError, setUsdError] = useState<string>("")
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false)
  const [metaMaskAddress, setMetaMaskAddress] = useState("")
  const [currentNetwork, setCurrentNetwork] = useState("")
  const [usdTransactions, setUsdTransactions] = useState<any[]>([])
  const [isLoadingUsdTransactions, setIsLoadingUsdTransactions] = useState(false)
  const [showUsdTransactionsDialog, setShowUsdTransactionsDialog] = useState(false)
  const [usdPrice, setUsdPrice] = useState<number | null>(null)
  const [localStorageSolanaWallet, setLocalStorageSolanaWallet] = useState<string | null>(null)
  const [isSolanaWalletPromptOpen, setIsSolanaWalletPromptOpen] = useState(false)

  // Add notification state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Add notification helper function
  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  const idl_string = JSON.stringify(idl)
  const idl_object = JSON.parse(idl_string)

  const [program, setProgram] = useState<Program<PalmPresale> | null>(null)

  // Initialize program
  useEffect(() => {
    const initProgram = async () => {
      if (publicKey && connection) {
        try {
          const provider = new AnchorProvider(connection, window.solana, {})
          setProvider(provider)
          const program = new Program<PalmPresale>(idl as any, programID, provider)
          setProgram(program)
        } catch (err) {
          console.error("Failed to initialize program:", err)
          setError("Failed to initialize program")
        }
      }
    }
    initProgram()
  }, [publicKey, connection])

  // Get Anchor provider
  const getProvider = useCallback(() => {
    if (!publicKey) return null
    const provider = new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction: signTransaction!,
        signAllTransactions: window.solana?.signAllTransactions!,
      },
      AnchorProvider.defaultOptions(),
    )
    setProvider(provider)
    return provider
  }, [connection, publicKey, signTransaction])

  // Get program instance
  const getProgram = useCallback(() => {
    const provider = getProvider()
    if (!provider) return null
    return new Program<PalmPresale>(idl_object, programID, provider)
  }, [getProvider])

  // Find PDA for presale info
  const findPresaleInfoPDA = useCallback(async () => {
    const [pda] = await PublicKey.findProgramAddressSync([PRESALE_SEED], programID)
    return pda
  }, [])

  // Find PDA for user info
  const findUserInfoPDA = useCallback(async () => {
    if (!publicKey) throw new Error("Wallet not connected")

    const [pda] = await PublicKey.findProgramAddressSync([USER_SEED], programID)
    return pda
  }, [publicKey])

  // Find PDA for referral info
  const findReferralInfoPDA = useCallback(async (userPubkey: PublicKey): Promise<web3.PublicKey> => {
    const [pda] = await web3.PublicKey.findProgramAddressSync([REFERRAL_SEED, userPubkey.toBuffer()], programID)
    return pda
  }, [])

  // Fetch user info
  const fetchUserInfo = useCallback(async () => {
    try {
      if (!publicKey) return

      const program = getProgram()
      if (!program) return

      const userInfoPDA = await findUserInfoPDA()
      if (!userInfoPDA) return

      try {
        const userInfoData: any = await program.account.userInfo.fetch(userInfoPDA)
        setUserInfo(userInfoData)
      } catch (err) {
        // console.log("User info not found:", err)
        setUserInfo(null)
      }
    } catch (err) {
      console.error("Error fetching user info:", err)
    }
  }, [findUserInfoPDA, getProgram, publicKey])

  // Fetch presale stages
  const findStagePDA = useCallback(async (stageNumber: number) => {
    const [pda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("STAGE_SEED"), Buffer.from([stageNumber])],
      programID,
    )
    return pda
  }, [])

  // Update the fetchPresaleStages function to use the findStagePDA helper
  const fetchPresaleStages = useCallback(async () => {
    try {
      if (!presaleInfo) return

      const program = getProgram()
      if (!program) return

      const stages = []
      const totalStages = presaleInfo.totalStages

      for (let i = 1; i <= totalStages; i++) {
        try {
          // Use the findStagePDA helper to get the correct PDA
          const stagePDA = await findStagePDA(i)

          const stageData = await program.account.presaleStage.fetch(stagePDA)
          stages.push({
            ...stageData,
            pda: stagePDA,
          })

          // Set current stage
          if (stageData.isActive) {
            setCurrentStage(stageData)
          }
        } catch (err) {
          // console.log(`Stage ${i} not found:`, err);
        }
      }

      setPresaleStages(stages)
    } catch (err) {
      console.error("Error fetching presale stages:", err)
    }
  }, [getProgram, presaleInfo, findStagePDA])

  // Check if presale is initialized
  const checkPresaleInitialized = useCallback(async () => {
    try {
      const program = getProgram()
      if (!program) return false

      const presaleInfoPDA = await findPresaleInfoPDA()
      const presaleData = await program.account.presaleInfo.fetch(presaleInfoPDA)
      setPresaleInfo(presaleData)
      setIsInitialized(true)
      return true
    } catch (err) {
      console.log("Presale not initialized yet:", err)
      setIsInitialized(false)
      return false
    }
  }, [findPresaleInfoPDA, getProgram])

  // Initialize presale
  const initializePresale = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      if (!publicKey) {
        throw new Error("Wallet not connected")
      }

      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      // Validate token mint address
      let tokenMintPubkey: PublicKey
      try {
        tokenMintPubkey = new PublicKey(tokenMintAddress)
      } catch (err) {
        throw new Error("Invalid token mint address")
      }

      const presaleInfoPDA = await findPresaleInfoPDA()
      console.log("Presale Info PDA:", presaleInfoPDA.toString())

      // Check if presale already exists
      const isAlreadyInitialized = await checkPresaleInitialized()
      if (isAlreadyInitialized) {
        console.log("Presale already initialized")
        showNotification("Presale already initialized", "info")
        setLoading(false)
        return
      }

      console.log("Initializing presale...")

      // Find the stage1 PDA instead of creating a keypair
      const [stage1PDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("STAGE_SEED"), Buffer.from([1])],
        programID,
      )

      console.log("Stage1 PDA:", stage1PDA.toString())
      console.log("Token Mint Address:", tokenMintPubkey.toString())

      // Initialize presale instruction
      // Get the current timestamp in seconds
      // const currentTime = Math.floor(Date.now() / 1000)

      // Set end time to 30 days from now (or whatever duration you want)
      // const endTime = currentTime + 30 * 24 * 60 * 60 // 30 days in seconds

      const tx = await program.methods
        .initialize(
          tokenMintPubkey, // token mint address
          new BN(750000000), // softcapAmount (in lamports)
          new BN(1000000000), // hardcapAmount (in lamports)
          new BN(1000000000), // maxTokenAmountPerAddress
          new BN(100000), // tokenPrice (in lamports, e.g., 0.0001 SOL)
        )
        .accounts({
          presaleInfo: presaleInfoPDA,
          stage1: stage1PDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc()

      console.log("Presale initialized successfully:", tx)
      showNotification(
        "Presale initialized successfully! Note: The presale is now live and tokens cannot be deposited.",
        "success",
      )
      setShowInitializeDialog(false)

      // Fetch the newly created presale info
      await checkPresaleInitialized()
    } catch (err: any) {
      console.error("Error initializing presale:", err)
      const errorMessage = err.message || "Failed to initialize presale"
      setError(errorMessage)
      showNotification(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }, [checkPresaleInitialized, findPresaleInfoPDA, getProgram, publicKey, tokenMintAddress])

  // Buy tokens
  const buyTokens = async () => {
    if (!program) {
      showNotification("Program not initialized", "error")
      return
    }

    try {
      if (!connected || !publicKey) {
        showNotification("Please connect your wallet first", "error")
        return
      }

      if (!currentStage) {
        showNotification("No active presale stage found", "error")
        return
      }

      setLoading(true)
      setError("")

      // Get required PDAs
      const [presaleInfoPDA] = PublicKey.findProgramAddressSync(
        [PRESALE_SEED],
        program.programId
      )

      const [userInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("USER_SEED"), publicKey.toBuffer()],
        program.programId
      )

      const [presaleVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_VAULT")],
        program.programId
      )

      // Fetch presale info to get tokenMint and authority
      const presaleInfo = await program.account.presaleInfo.fetch(presaleInfoPDA)
      if (!presaleInfo) {
        throw new Error("Presale not initialized")
      }

      // Get transaction history PDA with current timestamp
      const currentTimestamp = Math.floor(Date.now() / 1000)
      const [transactionHistoryPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("TRANSACTION"),
          publicKey.toBuffer(),
          Buffer.from([currentTimestamp & 0xff])
        ],
        program.programId
      )

      // Get referrer info PDA if referral code is provided
      let referrerInfoPDA = presaleInfo.authority // Default to presale authority
      if (referralCode) {
        try {
          const referrerPubkey = new PublicKey(referralCode)
          const [referrerInfo] = PublicKey.findProgramAddressSync(
            [Buffer.from("REFERRAL_SEED"), referrerPubkey.toBuffer()],
            program.programId
          )
          referrerInfoPDA = referrerInfo
        } catch (error) {
          showNotification("Invalid referral code", "error")
          setLoading(false)
          return
        }
      }

      // Prepare accounts object
      const accounts = {
        presaleInfo: presaleInfoPDA,
        presaleAuthority: presaleInfo.authority,
        userInfo: userInfoPDA,
        presaleVault: presaleVaultPDA,
        buyer: publicKey,
        priceFeed: new PublicKey(PYTH_SOL_USD_PRICE_FEED),
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        transactionHistory: transactionHistoryPDA,
        referrerInfo: referrerInfoPDA
      }

      // Calculate quote amount in lamports
      const quoteAmount = new BN(Number.parseFloat(buyAmount) * LAMPORTS_PER_SOL)

      // Send transaction
      const tx = await program.methods
        .buyToken(quoteAmount, referralCode ? new PublicKey(referralCode) : null)
        .accounts(accounts)
        .rpc()

      showNotification("Transaction successful!", "success")
      setShowBuyDialog(false)
      setBuyAmount("")
      setReferralCode("")
      await checkPresaleInitialized()
    } catch (error: any) {
      console.error("Error buying tokens:", error)
      setError(error.message || "Failed to buy tokens")
      showNotification(error.message || "Failed to buy tokens", "error")
    } finally {
      setLoading(false)
    }
  }

  // Buy tokens with USD
  const checkAndSaveSolanaWallet = useCallback(() => {
    if (publicKey) {
      // Save to localStorage
      localStorage.setItem("solanaWallet", publicKey.toString())
      setLocalStorageSolanaWallet(publicKey.toString())
      return true
    }

    // Check if we have a wallet in localStorage
    const storedWallet = localStorage.getItem("solanaWallet")
    if (storedWallet) {
      setLocalStorageSolanaWallet(storedWallet)
      return true
    }

    return false
  }, [publicKey])

  // Replace the buyTokensWithUSD function with this updated version
  const buyTokensWithUSD = async () => {
    try {
      setIsUsdLoading(true)
      setUsdError("")

      // First check if we have a Solana wallet (either connected or in localStorage)
      const hasSolanaWallet = checkAndSaveSolanaWallet()

      if (!hasSolanaWallet) {
        setIsSolanaWalletPromptOpen(true)
        throw new Error("Please connect your Solana wallet first")
      }

      const solanaWalletAddress = localStorageSolanaWallet || publicKey?.toString()

      if (!solanaWalletAddress) {
        throw new Error("No Solana wallet address available")
      }

      if (!usdAmount || isNaN(Number(usdAmount)) || Number(usdAmount) <= 0) {
        throw new Error("Please enter a valid USD amount")
      }

      // Check if window.ethereum is available
      if (!window.ethereum) {
        throw new Error("MetaMask or another Ethereum wallet is required")
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (!accounts || accounts.length === 0) {
        throw new Error("No Ethereum accounts found")
      }

      // Check if on Base Sepolia testnet
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      console.log("Current chain ID in buyTokensWithUSD:", chainId)
      console.log("Expected chain ID:", BASE_TESTNET_CHAIN_ID)
      console.log("Are they equal?", chainId === BASE_TESTNET_CHAIN_ID)

      if (chainId !== BASE_TESTNET_CHAIN_ID) {
        // Ask user to switch to Base Sepolia
        const shouldSwitch = confirm(
          `You need to be on the Base Sepolia testnet (${BASE_TESTNET_CHAIN_ID}). Current chain: ${chainId}. Would you like to switch now?`,
        )
        if (shouldSwitch) {
          await switchToBaseNetwork()
          // Check again after switching
          const newChainId = await window.ethereum.request({ method: "eth_chainId" })
          if (newChainId !== BASE_TESTNET_CHAIN_ID) {
            throw new Error(`Failed to switch to Base Sepolia testnet. Current chain: ${newChainId}`)
          }
        } else {
          throw new Error(
            `Please switch to the Base Sepolia testnet (${BASE_TESTNET_CHAIN_ID}) to continue. Current chain: ${chainId}`,
          )
        }
      }

      // Create a provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Create contract instance
      const contract = new ethers.Contract(BASE_CONTRACT_ADDRESS, BaseContractABI, signer)

      // Convert USD amount to wei (assuming 18 decimals)
      const dollarAmountInWei = ethers.parseUnits(usdAmount, 0) // Use 0 decimals for whole numbers

      // Get quote for the USD amount
      const requiredETH = await contract.getQuote(dollarAmountInWei)

      // Call the purchaseWithUSDAmount function
      // Include the Solana wallet address and referral code if provided
      const solanaWalletWithReferral = referralCode ? `${solanaWalletAddress}|${referralCode}` : solanaWalletAddress

      const tx = await contract.purchaseWithUSDAmount(dollarAmountInWei, solanaWalletWithReferral, {
        value: requiredETH,
      })

      // Wait for transaction to be mined
      await tx.wait()

      console.log("USD purchase successful:", tx.hash)
      showNotification("USD purchase successful! Transaction hash: " + tx.hash, "success")
      setShowUsdBuyDialog(false)
      setUsdAmount("")

      // Refresh data
      await handleManualRefresh()
      await fetchUsdTransactions()
    } catch (err: any) {
      console.error("Error buying tokens with USD:", err)
      const errorMessage = err.message || "Failed to buy tokens with USD"
      setUsdError(errorMessage)
      showNotification(errorMessage, "error")
    } finally {
      setIsUsdLoading(false)
    }
  }

  // Add this function to handle the Solana wallet prompt
  const handleSolanaWalletPrompt = () => {
    setIsSolanaWalletPromptOpen(false)
  }
  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (!presaleInfo) return 0
    const soldAmount = presaleInfo.soldTokenAmount?.toNumber() || 0
    const hardcapAmount = presaleInfo.hardcapAmount?.toNumber() || 1

    return (soldAmount / hardcapAmount) * 100
  }, [presaleInfo])

  // Add a new function to handle manual refresh
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError("")

      if (connected && publicKey) {
        await checkPresaleInitialized()
        await fetchUserInfo()
        await fetchPresaleStages()
      }

      showNotification("Data refreshed successfully!", "success")
    } catch (err: any) {
      console.error("Error refreshing data:", err)
      setError(`Failed to refresh data: ${err.message}`)
      showNotification(`Failed to refresh data: ${err.message}`, "error")
    } finally {
      setIsRefreshing(false)
    }
  }, [connected, publicKey, checkPresaleInitialized, fetchUserInfo, fetchPresaleStages])

  // Create referral account
  const createReferral = useCallback(async () => {
    if (!publicKey) {
      setError("Wallet not connected")
      return
    }

    try {
      setLoading(true)
      setError("")
      setIsCreatingReferral(true)

      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      // Find the referral info PDA
      const referralInfoPDA = await findReferralInfoPDA(publicKey)
      console.log("Referral Info PDA:", referralInfoPDA.toString())

      // Create the transaction
      const tx = await program.methods
        .createReferral()
        .accounts({
          referralInfo: referralInfoPDA,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log("Referral created successfully:", tx)
      showNotification("Referral account created successfully!", "success")
      setShowReferralDialog(false)

      // Fetch the referral info
      await fetchReferralInfo()
    } catch (err: any) {
      console.error("Error creating referral:", err)
      const errorMessage = err.message || "Failed to create referral"
      setError(errorMessage)
      showNotification(errorMessage, "error")
    } finally {
      setLoading(false)
      setIsCreatingReferral(false)
    }
  }, [findReferralInfoPDA, getProgram, publicKey])

  // Fetch referral info
  const fetchReferralInfo = useCallback(async () => {
    if (!publicKey) return

    try {
      const program = getProgram()
      if (!program) return

      const referralInfoPDA = await findReferralInfoPDA(publicKey)

      try {
        const referralData = await program.account.referralInfo.fetch(referralInfoPDA)
        console.log("---------------", referralData)
        setReferralInfo(referralData)
        console.log("Referral info:", referralData)
      } catch (err) {
        console.log("Referral info not found:", err)
        setReferralInfo(null)
      }
    } catch (err) {
      console.error("Error fetching referral info:", err)
    }
  }, [findReferralInfoPDA, getProgram, publicKey])

  // Get referral stats
  const getReferralStats = useCallback(async () => {
    if (!publicKey) {
      setError("Wallet not connected")
      return
    }

    try {
      setLoading(true)
      setError("")
      setIsLoadingReferralStats(true)

      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      // Find the referral info PDA
      const referralInfoPDA = await findReferralInfoPDA(publicKey)
      console.log("Referral Info PDA:", referralInfoPDA.toString())

      // Get referral stats
      const stats = await program.methods
        .getReferralStats()
        .accounts({
          referralInfo: referralInfoPDA,
          user: publicKey,
        })
        .view()

      console.log("Referral stats:", stats)
      setReferralStats(stats)
      setShowReferralStats(true)
    } catch (err: any) {
      console.error("Error getting referral stats:", err)
      const errorMessage = err.message || "Failed to get referral stats"
      setError(errorMessage)
      showNotification(errorMessage, "error")
    } finally {
      setLoading(false)
      setIsLoadingReferralStats(false)
    }
  }, [findReferralInfoPDA, getProgram, publicKey])

  // Claim referral rewards
  const claimReferralRewards = useCallback(async () => {
    if (!publicKey) {
      setError("Wallet not connected")
      return
    }

    try {
      setLoading(true)
      setError("")
      setIsClaimingRewards(true)

      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      // Find the referral info PDA
      const referralInfoPDA = await findReferralInfoPDA(publicKey)

      // Find the user info PDA
      const userInfoPDA = await findUserInfoPDA()

      // Create the transaction
      const tx = await program.methods
        .claimReferralRewards()
        .accounts({
          referralInfo: referralInfoPDA,
          userInfo: userInfoPDA,
          user: publicKey,
        })
        .rpc()

      console.log("Referral rewards claimed successfully:", tx)
      showNotification("Referral rewards claimed successfully!", "success")

      // Refresh referral info
      await fetchReferralInfo()
    } catch (err: any) {
      console.error("Error claiming referral rewards:", err)
      const errorMessage = err.message || "Failed to claim referral rewards"
      setError(errorMessage)
      showNotification(errorMessage, "error")
    } finally {
      setLoading(false)
      setIsClaimingRewards(false)
    }
  }, [findReferralInfoPDA, findUserInfoPDA, getProgram, publicKey])

  // Withdraw SOL function
  const withdrawSol = useCallback(async () => {
    if (!publicKey || !connection || !signTransaction) return

    try {
      setLoading(true)
      setError("")
      setIsWithdrawing(true)

      // Get program instance
      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      // Convert string amount to BN
      const withdrawAmountBN = new BN(Math.floor(Number.parseFloat(withdrawAmount) * LAMPORTS_PER_SOL))

      if (withdrawAmountBN.lte(new BN(0))) {
        throw new Error("Withdraw amount must be greater than 0")
      }

      // Get the presale info PDA
      const presaleInfoPDA = await findPresaleInfoPDA()

      // Get the presale vault PDA
      const [presaleVaultPDA, bump] = await PublicKey.findProgramAddressSync([PRESALE_VAULT], programID)

      console.log("Presale Info PDA:", presaleInfoPDA.toString())
      console.log("Presale Vault PDA:", presaleVaultPDA.toString())
      console.log("Withdraw Amount:", withdrawAmountBN.toString())

      // Create the transaction
      const transaction = new Transaction()

      // Add the withdraw SOL instruction
      transaction.add(
        await program.methods
          .withdrawSol(withdrawAmountBN, bump)
          .accounts({
            presaleInfo: presaleInfoPDA,
            presaleVault: presaleVaultPDA,
            admin: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction(),
      )

      // Sign and send the transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTx = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      console.log("SOL withdrawal successful:", signature)
      showNotification("SOL withdrawal successful!", "success")
      setShowWithdrawDialog(false)
      setWithdrawAmount("")

      // Refresh presale info
      await checkPresaleInitialized()
    } catch (err: any) {
      console.error("Error withdrawing SOL:", err)
      setError(`Failed to withdraw SOL: ${err.message}`)
      showNotification(`Failed to withdraw SOL: ${err.message}`, "error")
    } finally {
      setLoading(false)
      setIsWithdrawing(false)
    }
  }, [checkPresaleInitialized, findPresaleInfoPDA, getProgram, publicKey, connection, signTransaction, withdrawAmount])

  // Check MetaMask connection
  const checkMetaMaskConnection = useCallback(async () => {
    try {
      if (window.ethereum) {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts && accounts.length > 0) {
          setIsMetaMaskConnected(true)
          setMetaMaskAddress(accounts[0])

          // Get current network
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          setCurrentNetwork(getNetworkName(chainId))
        } else {
          setIsMetaMaskConnected(false)
          setMetaMaskAddress("")
        }

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length > 0) {
            setIsMetaMaskConnected(true)
            setMetaMaskAddress(accounts[0])
          } else {
            setIsMetaMaskConnected(false)
            setMetaMaskAddress("")
          }
        })

        // Listen for chain changes
        window.ethereum.on("chainChanged", (chainId: string) => {
          setCurrentNetwork(getNetworkName(chainId))
        })
      }
    } catch (err) {
      console.error("Error checking MetaMask connection:", err)
    }
  }, [])

  // Add this helper function after checkMetaMaskConnection
  const getNetworkName = (chainId: string): string => {
    switch (chainId) {
      case "0x8453":
        return "Base Mainnet"
      case BASE_TESTNET_CHAIN_ID:
        return "Base Sepolia"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  // Add this function to connect MetaMask
  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        showNotification("MetaMask is not installed. Please install MetaMask to continue.", "error")
        return
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (accounts && accounts.length > 0) {
        setIsMetaMaskConnected(true)
        setMetaMaskAddress(accounts[0])

        // Get current network
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        setCurrentNetwork(getNetworkName(chainId))

        // If not on Base network, automatically switch
        if (chainId !== BASE_TESTNET_CHAIN_ID) {
          console.log("Wrong network detected, switching to Base Sepolia...")
          await switchToBaseNetwork()
        }

        showNotification("MetaMask connected successfully!", "success")
      }
    } catch (err: any) {
      console.error("Error connecting to MetaMask:", err)
      showNotification(`Failed to connect MetaMask: ${err.message}`, "error")
    }
  }

  // Add this function to switch to Base network
  const switchToBaseNetwork = async () => {
    try {
      if (!window.ethereum) {
        showNotification("MetaMask is not installed. Please install MetaMask to continue.", "error")
        return
      }

      // Get current chain ID for debugging
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" })
      console.log("Current chain ID:", currentChainId)
      console.log("Expected chain ID:", BASE_TESTNET_CHAIN_ID)
      console.log("Are they equal?", currentChainId === BASE_TESTNET_CHAIN_ID)

      try {
        // Try to switch to Base Sepolia testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_TESTNET_CHAIN_ID }],
        })
      } catch (switchError: any) {
        console.log("Switch error:", switchError)
        // If the network is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_TESTNET_CHAIN_ID,
                chainName: "Base Sepolia",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [BASE_TESTNET_RPC_URL],
                blockExplorerUrls: [BASE_TESTNET_EXPLORER],
              },
            ],
          })
        } else {
          throw switchError
        }
      }

      // Verify the switch was successful
      const newChainId = await window.ethereum.request({ method: "eth_chainId" })
      console.log("New chain ID after switch:", newChainId)

      if (newChainId === BASE_TESTNET_CHAIN_ID) {
        showNotification("Switched to Base Sepolia testnet successfully!", "success")
      } else {
        showNotification(`Switched to chain ID: ${newChainId}, but expected: ${BASE_TESTNET_CHAIN_ID}`, "info")
      }
    } catch (err: any) {
      console.error("Error switching to Base network:", err)
      showNotification(`Failed to switch to Base network: ${err.message}`, "error")
    }
  }

  // Add this function to fetch USD transactions
  const fetchUsdTransactions = async () => {
    try {
      const solanaWalletAddress = localStorageSolanaWallet || publicKey?.toString()

      if (!solanaWalletAddress || !window.ethereum) return

      setIsLoadingUsdTransactions(true)

      // Create a provider
      const provider = new ethers.BrowserProvider(window.ethereum)

      // Create contract instance
      const contract = new ethers.Contract(BASE_CONTRACT_ADDRESS, BaseContractABI, provider)

      // Get transactions for the Solana wallet
      const transactions = await contract.getTransactionsBySolanaWallet(solanaWalletAddress)

      setUsdTransactions(transactions)
      setShowUsdTransactionsDialog(true)
    } catch (err: any) {
      console.error("Error fetching USD transactions:", err)
      showNotification(`Failed to fetch USD transactions: ${err.message}`, "error")
    } finally {
      setIsLoadingUsdTransactions(false)
    }
  }

  // Add this function to get USD price
  const fetchUsdPrice = useCallback(async () => {
    try {
      if (!currentStage) return

      // If we have a price feed, we can calculate the USD price
      // For simplicity, let's assume 1 SOL = $150 (you would normally get this from an oracle)
      const solPrice = 150
      const tokenPriceInSol = currentStage.pricePerToken?.toNumber() / LAMPORTS_PER_SOL || 0
      const tokenPriceInUsd = tokenPriceInSol * solPrice

      setUsdPrice(tokenPriceInUsd)
    } catch (err) {
      console.error("Error fetching USD price:", err)
    }
  }, [currentStage])

  // Initialize component
  useEffectOriginal(() => {
    // Check for Solana wallet in localStorage on mount
    const storedWallet = localStorage.getItem("solanaWallet")
    if (storedWallet) {
      setLocalStorageSolanaWallet(storedWallet)
    }

    if (connected && publicKey) {
      // Save the connected wallet to localStorage
      localStorage.setItem("solanaWallet", publicKey.toString())
      setLocalStorageSolanaWallet(publicKey.toString())

      // Initial load only, no automatic refreshing
      checkPresaleInitialized().then((initialized) => {
        if (initialized) {
          fetchPresaleStages()
        }
      })
      fetchUserInfo()
      fetchReferralInfo()

      // Add these new calls
      checkMetaMaskConnection()
      fetchUsdPrice()
    }
  }, [
    connected,
    publicKey,
    checkPresaleInitialized,
    fetchPresaleStages,
    fetchUserInfo,
    fetchReferralInfo,
    checkMetaMaskConnection,
    fetchUsdPrice,
  ])

  // Add this type definition near the top with other types
  type BaseTransaction = {
    solanaWallet: string
    payer: string
    paymentAmount: bigint
    usdAmount: bigint
    timestamp: bigint
  }

  // Add these state variables in the component
  const [baseTransactions, setBaseTransactions] = useState<BaseTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  // Add this function to fetch transactions
  const fetchBaseTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      if (!window.ethereum || !publicKey) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(BASE_CONTRACT_ADDRESS, BaseContractABI, provider)

      const transactions = await contract.getTransactionsBySolanaWallet(publicKey.toString())
      setBaseTransactions(transactions)
    } catch (err) {
      console.error("Error fetching Base transactions:", err)
      showNotification("Failed to fetch Base transactions", "error")
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  // Add useEffect to fetch transactions when component mounts or publicKey changes
  useEffect(() => {
    if (publicKey) {
      fetchBaseTransactions()
    }
  }, [publicKey])

  return (
    <div className="min-h-screen  text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-yellow-500 rounded-full filter blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Add notification component */}
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
              Doge Head Coin
            </h1>
            <p className="text-white max-w-2xl text-lg">
              More than just a memecoin, a friendly dog, lover of art, video games and music!
            </p>
          </div>
          <div className="mt-8 md:mt-0 flex flex-col sm:flex-row gap-3">
            <WalletMultiButton className="!bg-gradient-to-r from-yellow-500 to-yellow-600 !rounded-xl !py-3 !px-6 !text-white !font-medium !transition-all !shadow-lg hover:!shadow-xl hover:!scale-105" />

            {window.ethereum ? (
              isMetaMaskConnected ? (
                <Button
                  variant="outline"
                  className="border-yellow-500/20 bg-black/40 text-white hover:bg-yellow-500/20 hover:text-white flex items-center gap-2"
                  onClick={fetchUsdTransactions}
                  disabled={isLoadingUsdTransactions}
                >
                  <img src="/metamask-fox.svg" alt="MetaMask" className="w-4 h-4" />
                  <span className="truncate max-w-[120px]">
                    {metaMaskAddress.substring(0, 6)}...{metaMaskAddress.substring(metaMaskAddress.length - 4)}
                  </span>
                  {currentNetwork !== "Base Mainnet" && currentNetwork !== "Base Sepolia" && (
                    <Badge variant="outline" className="ml-1 bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                      {currentNetwork}
                    </Badge>
                  )}
                </Button>
              ) : (
                <Button
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl py-3 transition-all transform hover:scale-[1.02]"
                  onClick={connectMetaMask}
                >
                  <img src="/metamask-fox.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
                  Connect MetaMask
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                className="border-yellow-500/20 bg-black/40 text-white hover:bg-yellow-500/20 hover:text-white"
                onClick={() => window.open("https://metamask.io/download/", "_blank")}
              >
                <img src="/metamask-fox.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
                Install MetaMask
              </Button>
            )}
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex justify-center mb-10">
          <Badge
            variant="outline"
            className="bg-yellow-900/30 text-yellow-300 border-yellow-500/50 px-4 py-2 text-sm rounded-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <span>Solana Devnet</span>
            </div>
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Presale Info */}
          <div className="lg:col-span-2">
            <Card className="bg-black border-yellow-500/20 backdrop-blur-sm overflow-hidden rounded-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl"></div>
              <CardHeader className="relative z-10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold text-white">Presale Details</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing || !connected}
                      className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
                    >
                      {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="ml-1">Refresh</span>
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-gray-300">
                  {currentStage
                    ? `Stage ${currentStage.stageNumber} of the Doge Head Coin presale`
                    : "Doge Head Coin presale"}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {!isInitialized && connected && (
                  <div className="mb-6">
                    <Alert className="bg-yellow-900/20 border-yellow-500/50 mb-4">
                      <Info className="h-4 w-4 text-yellow-400" />
                      <AlertTitle>Presale not initialized</AlertTitle>
                      <AlertDescription>
                        Initialize the presale to start accepting contributions.
                        <strong className="block mt-2 text-yellow-300">
                          Important: Once initialized, the presale will be live immediately and tokens cannot be
                          deposited afterward.
                        </strong>
                      </AlertDescription>
                    </Alert>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02]"
                      onClick={() => setShowInitializeDialog(true)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...
                        </>
                      ) : (
                        <>Initialize Presale</>
                      )}
                    </Button>
                  </div>
                )}

                {isInitialized && (
                  <>
                    <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-3 mb-6 rounded-xl p-1 bg-black/50">
                        <TabsTrigger
                          value="overview"
                          className={`rounded-lg transition-all ${activeTab === "overview" ? "bg-yellow-500 text-white" : "text-gray-300 hover:text-white"}`}
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger
                          value="stages"
                          className={`rounded-lg transition-all ${activeTab === "stages" ? "bg-yellow-500 text-white" : "text-gray-300 hover:text-white"}`}
                        >
                          Stages
                        </TabsTrigger>
                        <TabsTrigger
                          value="referral"
                          className={`rounded-lg transition-all ${activeTab === "referral" ? "bg-yellow-500 text-white" : "text-gray-300 hover:text-white"}`}
                        >
                          Referral
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview">
                        <div className="space-y-6">
                          {/* Status Badge */}
                          {presaleInfo && (
                            <div className="flex justify-center mb-4">
                              <Badge
                                className={`px-4 py-2 text-sm rounded-full ${presaleInfo.isLive
                                    ? "bg-yellow-900/30 text-yellow-300 border-yellow-500/50"
                                    : "bg-yellow-900/30 text-yellow-300 border-yellow-500/50"
                                  }`}
                              >
                                {presaleInfo.isLive ? "Presale is LIVE" : "Presale not started"}
                              </Badge>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-300">Progress</span>
                              <span className="text-sm font-medium text-white">
                                {presaleInfo
                                  ? `${(presaleInfo.soldTokenAmount?.toNumber() || 0).toLocaleString()} / ${(
                                    presaleInfo.hardcapAmount?.toNumber() || 0
                                  ).toLocaleString()} $DHC`
                                  : "0 / 0 $DHC"}
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress()}
                              className="h-3 bg-black/50 rounded-full"
                              indicatorClassName="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
                            />
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                              <div className="flex items-center gap-3 mb-2">
                                <Rocket className="h-5 w-5 text-yellow-400" />
                                <p className="text-sm text-gray-300">Soft Cap</p>
                              </div>
                              <p className="text-xl font-bold text-white">
                                {presaleInfo
                                  ? `${(presaleInfo.softcapAmount?.toNumber() || 0).toLocaleString()} $DHC`
                                  : "750,000,000 $DHC"}
                              </p>
                            </div>
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                              <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="h-5 w-5 text-yellow-400" />
                                <p className="text-sm text-gray-300">Hard Cap</p>
                              </div>
                              <p className="text-xl font-bold text-white">
                                {presaleInfo
                                  ? `${(presaleInfo.hardcapAmount?.toNumber() || 0).toLocaleString()} $DHC`
                                  : "1,000,000,000 $DHC"}
                              </p>
                            </div>
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                              <div className="flex items-center gap-3 mb-2">
                                <Coins className="h-5 w-5 text-yellow-400" />
                                <p className="text-sm text-gray-300">Current Price</p>
                              </div>
                              <p className="text-xl font-bold text-white">
                                $
                                {currentStage
                                  ? `${(currentStage.pricePerToken?.toNumber() / LAMPORTS_PER_SOL || 0).toFixed(4)}`
                                  : "0.0001"}
                              </p>
                              {usdPrice !== null && (
                                <p className="text-sm text-gray-300 mt-1">≈ ${usdPrice.toFixed(4)} USD</p>
                              )}
                            </div>
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                              <div className="flex items-center gap-3 mb-2">
                                <Users className="h-5 w-5 text-yellow-400" />
                                <p className="text-sm text-gray-300">Max Per Wallet</p>
                              </div>
                              <p className="text-xl font-bold text-white">
                                {presaleInfo
                                  ? `${(presaleInfo.maxTokenAmountPerAddress?.toNumber() || 0).toLocaleString()} $DHC`
                                  : "1,000,000,000 $DHC"}
                              </p>
                            </div>
                          </div>

                          {/* Admin Controls */}
                          {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority?.toString() && (
                            <div className="mt-6">
                              <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
                                <Sparkles className="h-4 w-4 text-yellow-400" />
                                <AlertTitle>Admin Controls</AlertTitle>
                                <AlertDescription>
                                  You have admin privileges for this presale.
                                  {presaleInfo.isLive && (
                                    <div className="mt-2 text-yellow-300">
                                      Note: The presale is already live. Tokens cannot be deposited at this stage.
                                    </div>
                                  )}
                                </AlertDescription>
                              </Alert>
                              <div className="mt-4 grid grid-cols-1 gap-2">
                                <Button
                                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg py-3 transition-all transform hover:scale-[1.02]"
                                  onClick={() => setShowWithdrawDialog(true)}
                                  disabled={loading || isWithdrawing}
                                >
                                  {isWithdrawing ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Withdrawing...
                                    </>
                                  ) : (
                                    <>Withdraw SOL</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Buy Button */}
                          {isInitialized && presaleInfo && presaleInfo.isLive && (
                            <Button
                              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium py-6 text-lg rounded-xl shadow-lg transition-all transform hover:scale-[1.02] hover:shadow-xl"
                              onClick={() => setShowBuyDialog(true)}
                              disabled={!connected || loading || !currentStage}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                                </>
                              ) : !currentStage ? (
                                "No Active Stage"
                              ) : (
                                <>
                                  Buy With Sol <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                              )}
                            </Button>
                          )}

                          {/* Error Message */}
                          {error && (
                            <Alert
                              variant="destructive"
                              className="mt-4 bg-yellow-900/20 border-yellow-500/50 rounded-xl"
                            >
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="stages">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">Presale Stages</h3>
                          </div>

                          {presaleStages.length === 0 ? (
                            <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
                              <Info className="h-4 w-4 text-yellow-400" />
                              <AlertTitle>No Stages Created</AlertTitle>
                              <AlertDescription>
                                {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority?.toString()
                                  ? "Create stages to start your presale."
                                  : "No presale stages have been created yet."}
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <div className="space-y-4">
                              {presaleStages.map((stage, index) => (
                                <div
                                  key={index}
                                  className={`border rounded-xl p-5 backdrop-blur-sm transition-all hover:bg-black/60 ${stage.isActive
                                      ? "border-yellow-500/50 bg-yellow-500/20"
                                      : "border-yellow-500/20 bg-black/30"
                                    }`}
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center">
                                      <h4 className="font-medium text-white">Stage {stage.stageNumber}</h4>
                                      {stage.isActive && (
                                        <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/50 rounded-full">
                                          Active
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-300">
                                      Price: ${(stage.pricePerToken?.toNumber() / LAMPORTS_PER_SOL || 0).toFixed(4)}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-black/40 rounded-lg p-3">
                                      <p className="text-gray-300 mb-1">Available:</p>
                                      <p className="text-white font-medium">
                                        {(stage.availableTokens?.toNumber() || 0).toLocaleString()} $DHC
                                      </p>
                                    </div>
                                    <div className="bg-black/40 rounded-lg p-3">
                                      <p className="text-gray-300 mb-1">Sold:</p>
                                      <p className="text-white font-medium">
                                        {(stage.tokensSold?.toNumber() || 0).toLocaleString()} $DHC
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="referral">
                        <div className="space-y-6">
                          {/* Referral Status */}
                          {connected && (
                            <div className="mb-6">
                              {referralInfo ? (
                                <Alert className="bg-yellow-900/20 border-yellow-500/50 mb-4 rounded-xl">
                                  <Check className="h-4 w-4 text-yellow-400" />
                                  <AlertTitle>Referral Account Active</AlertTitle>
                                  <AlertDescription>
                                    Your referral account is active. Share your referral code to earn rewards!
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <Alert className="bg-yellow-900/20 border-yellow-500/50 mb-4 rounded-xl">
                                  <Info className="h-4 w-4 text-yellow-400" />
                                  <AlertTitle>Referral Account Not Created</AlertTitle>
                                  <AlertDescription>
                                    Create a referral account to start earning rewards by referring others.
                                  </AlertDescription>
                                </Alert>
                              )}

                              {!referralInfo && (
                                <Button
                                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg py-3 transition-all transform hover:scale-[1.02]"
                                  onClick={() => setShowReferralDialog(true)}
                                  disabled={loading || isCreatingReferral}
                                >
                                  {isCreatingReferral ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                    </>
                                  ) : (
                                    <>Create Referral Account</>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Referral Stats */}
                          {connected && referralInfo && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-white">Your Referral Stats</h3>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Users className="h-5 w-5 text-yellow-400" />
                                    <p className="text-sm text-gray-300">Total Referrals</p>
                                  </div>
                                  <p className="text-xl font-bold text-white">
                                    {typeof referralInfo.totalReferrals === "object" &&
                                      referralInfo.totalReferrals?.toNumber
                                      ? referralInfo.totalReferrals.toNumber()
                                      : Number(referralInfo.totalReferrals) || 0}
                                  </p>
                                </div>
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Coins className="h-5 w-5 text-yellow-400" />
                                    <p className="text-sm text-gray-300">Total Purchases</p>
                                  </div>
                                  <p className="text-xl font-bold text-white">
                                    {(typeof referralInfo.totalReferralPurchases === "object" &&
                                      referralInfo.totalReferralPurchases?.toNumber
                                      ? referralInfo.totalReferralPurchases.toNumber()
                                      : Number(referralInfo.totalReferralPurchases) || 0
                                    ).toLocaleString()}{" "}
                                    $DHC
                                  </p>
                                </div>
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Gift className="h-5 w-5 text-yellow-400" />
                                    <p className="text-sm text-gray-300">Rewards Earned</p>
                                  </div>
                                  <p className="text-xl font-bold text-white">
                                    {(typeof referralInfo.totalRewardsEarned === "object" &&
                                      referralInfo.totalRewardsEarned?.toNumber
                                      ? referralInfo.totalRewardsEarned.toNumber()
                                      : Number(referralInfo.totalRewardsEarned) || 0
                                    ).toLocaleString()}{" "}
                                    $DHC
                                  </p>
                                </div>
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Sparkles className="h-5 w-5 text-yellow-400" />
                                    <p className="text-sm text-gray-300">Rewards Status</p>
                                  </div>
                                  <p className="text-xl font-bold text-white">
                                    {referralInfo.rewardsClaimed ? "Claimed" : "Available"}
                                  </p>
                                </div>
                              </div>

                              {(typeof referralInfo.totalRewardsEarned === "object" &&
                                referralInfo.totalRewardsEarned?.toNumber
                                ? referralInfo.totalRewardsEarned.toNumber()
                                : Number(referralInfo.totalRewardsEarned) || 0) > 0 &&
                                !referralInfo.rewardsClaimed && (
                                  <Button
                                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg py-3 transition-all transform hover:scale-[1.02]"
                                    onClick={claimReferralRewards}
                                    disabled={loading || isClaimingRewards}
                                  >
                                    {isClaimingRewards ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming...
                                      </>
                                    ) : (
                                      <>Claim Referral Rewards</>
                                    )}
                                  </Button>
                                )}

                              <Button
                                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg py-3 transition-all transform hover:scale-[1.02]"
                                onClick={getReferralStats}
                                disabled={loading || isLoadingReferralStats}
                              >
                                {isLoadingReferralStats ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                                  </>
                                ) : (
                                  <>View Detailed Stats</>
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Referral Code Section */}
                          {connected && referralInfo && (
                            <div className="mt-6">
                              <h3 className="text-lg font-semibold mb-3 text-white">Your Referral Code</h3>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={publicKey?.toString() || ""}
                                  readOnly
                                  className="bg-black/40 border-yellow-500/20 text-white"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    navigator.clipboard.writeText(publicKey?.toString() || "")
                                    showNotification("Referral code copied to clipboard!", "success")
                                  }}
                                  className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-300 mt-2">
                                Share this code with friends to earn rewards when they buy tokens!
                              </p>
                            </div>
                          )}

                          {/* Referral Instructions */}
                          <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3 text-white">How Referrals Work</h3>
                            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 space-y-3">
                              <p className="text-sm text-white">
                                <strong className="text-yellow-400">1. Create a Referral Account:</strong> Click the
                                button above to create your referral account.
                              </p>
                              <p className="text-sm text-white">
                                <strong className="text-yellow-400">2. Share Your Code:</strong> Share your public key
                                with friends.
                              </p>
                              <p className="text-sm text-white">
                                <strong className="text-yellow-400">3. Friends Buy Tokens:</strong> When friends buy
                                tokens using your referral code, you earn rewards.
                              </p>
                              <p className="text-sm text-white">
                                <strong className="text-yellow-400">4. Claim Rewards:</strong> Claim your earned rewards
                                at any time.
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Info Card */}
            {connected && userInfo && (
              <Card className="bg-black border-yellow-500/20 backdrop-blur-sm overflow-hidden rounded-xl shadow-xl mt-6">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-bold text-white">Your Participation</CardTitle>
                  <CardDescription className="text-gray-300">Your current presale contribution</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                      <div className="flex items-center gap-3 mb-2">
                        <Coins className="h-5 w-5 text-yellow-400" />
                        <p className="text-sm text-gray-300">Tokens Purchased</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {(userInfo.buyTokenAmount?.toNumber() || 0).toLocaleString()} $DHC
                      </p>
                    </div>
                    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 transition-all hover:bg-black/60">
                      <div className="flex items-center gap-3 mb-2">
                        <Coins className="h-5 w-5 text-yellow-400" />
                        <p className="text-sm text-gray-300">Amount Paid</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {((userInfo.buyQuoteAmount?.toNumber() || 0) / LAMPORTS_PER_SOL).toLocaleString()} SOL
                      </p>
                    </div>
                    {userInfo.wasReferred && (
                      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 col-span-2 transition-all hover:bg-black/60">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-yellow-400" />
                          <p className="text-sm text-gray-300">Referred By</p>
                        </div>
                        <p className="text-lg font-bold text-white break-all">
                          {userInfo.referrer?.toString() || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-300 mt-2">
                          Referral Rewards:{" "}
                          <span className="text-yellow-400 font-medium">
                            {(userInfo.referralRewardsEarned?.toNumber() || 0).toLocaleString()} $DHC
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Purchase Form */}
          <div className="lg:col-span-1">
            <Card className="bg-black border-yellow-500/20 backdrop-blur-sm overflow-hidden rounded-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-bold text-white">Purchase $DHC</CardTitle>
                <CardDescription className="text-gray-300">Buy Doge Head Coin tokens</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-5">
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium py-4 mt-2 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] hover:shadow-xl"
                  onClick={() => {
                    const hasSolanaWallet = checkAndSaveSolanaWallet()
                    if (hasSolanaWallet) {
                      setShowUsdBuyDialog(true)
                    } else {
                      setIsSolanaWalletPromptOpen(true)
                    }
                  }}
                  disabled={isUsdLoading}
                >
                  {isUsdLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Buy with Base"
                  )}
                </Button>

                {!connected && (
                  <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl mt-4">
                    <Info className="h-4 w-4 text-yellow-400" />
                    <AlertTitle>Connect Wallet</AlertTitle>
                    <AlertDescription>Please connect your wallet to participate in the presale.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Additional Info Card */}
            <Card className="bg-black border-yellow-500/20 overflow-hidden rounded-xl shadow-xl mt-6">
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-bold text-yellow-500">About $DHC</CardTitle>
                <CardDescription className="text-white">Doge Head Coin features</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-yellow-500 p-2 rounded-lg mt-0.5">
                      <Sparkles className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-500">Community Driven</p>
                      <p className="text-sm text-white">Built by the community, for the community</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-yellow-500 p-2 rounded-lg mt-0.5">
                      <Rocket className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-500">Deflationary Model</p>
                      <p className="text-sm text-white">Token burns to increase scarcity over time</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-yellow-500 p-2 rounded-lg mt-0.5">
                      <Gift className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-500">Rewards Program</p>
                      <p className="text-sm text-white">Earn rewards through staking and referrals</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-yellow-500 p-2 rounded-lg mt-0.5">
                      <Users className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-500">Growing Ecosystem</p>
                      <p className="text-sm text-white">Expanding use cases and partnerships</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Initialize Presale Dialog */}
      <Dialog open={showInitializeDialog} onOpenChange={setShowInitializeDialog}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Initialize Presale</DialogTitle>
            <DialogDescription className="text-gray-300">
              Set up your presale parameters.
              <strong className="block mt-2 text-yellow-300">
                Important: Once initialized, the presale will be live immediately and tokens cannot be deposited
                afterward.
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tokenMintAddress" className="text-right text-white">
                Token Mint
              </Label>
              <Input
                type="text"
                id="tokenMintAddress"
                value={tokenMintAddress}
                onChange={(e) => setTokenMintAddress(e.target.value)}
                className="col-span-3 bg-black/40 border-yellow-500/20 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInitializeDialog(false)}
              className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={initializePresale}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...
                </>
              ) : (
                "Initialize"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Tokens Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Buy Tokens</DialogTitle>
            <DialogDescription className="text-gray-300">Purchase $DHC tokens with SOL.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyAmountDialog" className="text-right text-white">
                SOL Amount
              </Label>
              <Input
                type="number"
                id="buyAmountDialog"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="col-span-3 bg-black/40 border-yellow-500/20 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-white">Estimated $DHC</Label>
              <div className="col-span-3 p-3 rounded-lg bg-black/40 border border-yellow-500/20 text-white">
                {currentStage && buyAmount
                  ? (
                    (Number.parseFloat(buyAmount) * LAMPORTS_PER_SOL) /
                    (currentStage.pricePerToken?.toNumber() || 1)
                  ).toLocaleString()
                  : "0"}{" "}
                $DHC
              </div>
            </div>

            {/* Referral Code Input in Dialog */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referralCodeDialog" className="text-right text-white">
                Referral Code
              </Label>
              <Input
                type="text"
                id="referralCodeDialog"
                placeholder="Enter referral code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="col-span-3 bg-black/40 border-yellow-500/20 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBuyDialog(false)}
              className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={buyTokens}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buying...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Referral Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Create Referral Account</DialogTitle>
            <DialogDescription className="text-gray-300">
              Create a referral account to earn rewards when others buy tokens using your referral code.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
              <Info className="h-4 w-4 text-yellow-400" />
              <AlertTitle>How Referrals Work</AlertTitle>
              <AlertDescription className="text-gray-300">
                When someone buys tokens using your referral code, you'll earn a percentage of their purchase as a
                reward. You can claim these rewards at any time.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReferralDialog(false)}
              className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={createReferral}
              disabled={loading || isCreatingReferral}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              {isCreatingReferral ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Referral Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Stats Dialog */}
      <Dialog open={showReferralStats} onOpenChange={setShowReferralStats}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Referral Statistics</DialogTitle>
            <DialogDescription className="text-gray-300">
              Detailed statistics about your referral performance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {referralStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-yellow-400" />
                      <p className="text-sm text-gray-300">Total Referrals</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {typeof referralStats.totalReferrals === "object" && referralStats.totalReferrals?.toNumber
                        ? referralStats.totalReferrals.toNumber()
                        : Number(referralStats.totalReferrals) || 0}
                    </p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Coins className="h-5 w-5 text-yellow-400" />
                      <p className="text-sm text-gray-300">Total Purchases</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {(typeof referralStats.totalReferralPurchases === "object" &&
                        referralStats.totalReferralPurchases?.toNumber
                        ? referralStats.totalReferralPurchases.toNumber()
                        : Number(referralStats.totalReferralPurchases) || 0
                      ).toLocaleString()}{" "}
                      $DHC
                    </p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Gift className="h-5 w-5 text-yellow-400" />
                      <p className="text-sm text-gray-300">Rewards Earned</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {(typeof referralStats.totalRewardsEarned === "object" &&
                        referralStats.totalRewardsEarned?.toNumber
                        ? referralStats.totalRewardsEarned.toNumber()
                        : Number(referralStats.totalRewardsEarned) || 0
                      ).toLocaleString()}{" "}
                      $DHC
                    </p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      <p className="text-sm text-gray-300">Rewards Status</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {referralStats.rewardsClaimed ? "Claimed" : "Available"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setShowReferralStats(false)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw SOL Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Withdraw SOL</DialogTitle>
            <DialogDescription className="text-gray-300">Withdraw SOL from the presale vault.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="withdrawAmount" className="text-right text-white">
                SOL Amount
              </Label>
              <Input
                type="number"
                id="withdrawAmount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="col-span-3 bg-black/40 border-yellow-500/20 text-white"
                placeholder="Enter SOL amount to withdraw"
              />
            </div>
            <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription className="text-gray-300">
                This action will withdraw SOL from the presale vault. Make sure you have the necessary permissions.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
              className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={withdrawSol}
              disabled={loading || isWithdrawing || !withdrawAmount || isNaN(Number.parseFloat(withdrawAmount))}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Withdrawing...
                </>
              ) : (
                "Withdraw SOL"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* USD Buy Dialog */}
      <Dialog open={showUsdBuyDialog} onOpenChange={setShowUsdBuyDialog}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Buy Tokens with USD</DialogTitle>
            <DialogDescription className="text-gray-300">
              Purchase $DHC tokens with USD via Base network.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usdAmountDialog" className="text-right text-white">
                USD Amount
              </Label>
              <Input
                type="number"
                id="usdAmountDialog"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                className="col-span-3 bg-black/40 border-yellow-500/20 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-white">ETH Address</Label>
              <div className="col-span-3 p-3 rounded-lg bg-black/40 border border-yellow-500/20 text-white break-all">
                {metaMaskAddress || "Not connected"}
                {!metaMaskAddress && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                    Connect MetaMask first
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-white">Solana Wallet</Label>
              <div className="col-span-3 p-3 rounded-lg bg-black/40 border border-yellow-500/20 text-white break-all">
                {localStorageSolanaWallet || (publicKey ? publicKey.toString() : "Not connected")}
                {!publicKey && localStorageSolanaWallet && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                    From localStorage
                  </Badge>
                )}
              </div>
            </div>

            {/* Add referral code input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referralCodeUsdDialog" className="text-right text-white">
                Referral Code
              </Label>
              <Input
                type="text"
                id="referralCodeUsdDialog"
                placeholder="Enter referral code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="col-span-3 bg-black/40 border-yellow-500/20 text-white placeholder:text-gray-500"
              />
            </div>

            <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
              <Info className="h-4 w-4 text-yellow-400" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription className="text-gray-300">
                This will connect to the Base network contract and process your USD payment. Your Solana wallet address
                will be linked to receive the tokens. You'll need MetaMask or another Ethereum wallet to complete this
                transaction.
              </AlertDescription>
            </Alert>

            {!isMetaMaskConnected && (
              <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertTitle>MetaMask Not Connected</AlertTitle>
                <AlertDescription className="text-gray-300">
                  You need to connect your MetaMask wallet to proceed with the USD purchase.
                  <Button
                    className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                    onClick={connectMetaMask}
                    size="sm"
                  >
                    <img src="/metamask-fox.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
                    Connect MetaMask
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {currentNetwork !== "Base Mainnet" && currentNetwork !== "Base Sepolia" && isMetaMaskConnected && (
              <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertTitle>Wrong Network</AlertTitle>
                <AlertDescription className="text-gray-300">
                  You need to be on the Base network to make a USD purchase.
                  <Button
                    className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                    onClick={switchToBaseNetwork}
                    size="sm"
                  >
                    Switch to Base Network
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {usdError && (
              <Alert variant="destructive" className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{usdError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUsdBuyDialog(false)}
              className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={buyTokensWithUSD}
              disabled={isUsdLoading || !usdAmount || !isMetaMaskConnected}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              {isUsdLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Confirm USD Purchase"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* USD Transactions Dialog */}
      <Dialog open={showUsdTransactionsDialog} onOpenChange={setShowUsdTransactionsDialog}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl max-w-3xl">
          <DialogHeader>
            <DialogTitle>USD Purchase History</DialogTitle>
            <DialogDescription className="text-gray-300">
              Your USD purchase transactions on Base network.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingUsdTransactions ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
              </div>
            ) : usdTransactions.length === 0 ? (
              <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
                <Info className="h-4 w-4 text-yellow-400" />
                <AlertTitle>No Transactions Found</AlertTitle>
                <AlertDescription>
                  You haven't made any USD purchases yet. Try buying tokens with USD to see your transactions here.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-yellow-500/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black/60">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Payer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            ETH Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            USD Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-500/20">
                        {usdTransactions.map((tx, index) => (
                          <tr key={index} className="bg-black/20 hover:bg-black/40">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                              {new Date(tx.timestamp.toNumber() * 1000).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                              <a
                                href={`https://basescan.org/address/${tx.payer}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-yellow-400 hover:underline"
                              >
                                {tx.payer.substring(0, 6)}...{tx.payer.substring(tx.payer.length - 4)}
                              </a>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                              {ethers.formatEther(tx.paymentAmount)} ETH
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                              ${ethers.formatEther(tx.usdAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setShowUsdTransactionsDialog(false)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Solana Wallet Prompt Dialog */}
      <Dialog open={isSolanaWalletPromptOpen} onOpenChange={setIsSolanaWalletPromptOpen}>
        <DialogContent className="bg-black/90 border-yellow-500/20 text-white backdrop-blur-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Connect Solana Wallet First</DialogTitle>
            <DialogDescription className="text-gray-300">
              You need to connect your Solana wallet before making a USD purchase.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertTitle>Solana Wallet Required</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your Solana wallet address is needed to receive tokens after your USD purchase. Please connect your
                Solana wallet using the button below.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleSolanaWalletPrompt}
              className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
            >
              Cancel
            </Button>
            <WalletMultiButton className="!bg-gradient-to-r from-yellow-500 to-yellow-600 !rounded-xl !py-2 !px-4 !text-white !font-medium !transition-all !shadow-lg hover:!shadow-xl hover:!scale-105" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Base Transactions History */}
      <Card className="bg-black border-yellow-500/20 backdrop-blur-sm overflow-hidden rounded-xl shadow-xl mt-6">
        <CardHeader className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-white">Base Transactions History</CardTitle>
              <CardDescription className="text-gray-300">Your transaction history on Base network</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBaseTransactions}
              disabled={isLoadingTransactions}
              className="border-yellow-500/20 text-gray-300 hover:bg-yellow-500/20 hover:text-white"
            >
              {isLoadingTransactions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {baseTransactions.length === 0 ? (
            <Alert className="bg-yellow-900/20 border-yellow-500/50">
              <Info className="h-4 w-4 text-yellow-400" />
              <AlertTitle>No Transactions</AlertTitle>
              <AlertDescription>No Base transactions found for your Solana wallet.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-yellow-500/20">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Payer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">ETH Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">USD Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {baseTransactions.map((tx, index) => (
                    <tr key={index} className="border-b border-yellow-500/20 hover:bg-black/30">
                      <td className="py-3 px-4 text-sm text-white">
                        {new Date(Number(tx.timestamp) * 1000).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        <a
                          href={`https://basescan.org/address/${tx.payer}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:underline"
                        >
                          {tx.payer.substring(0, 6)}...{tx.payer.substring(tx.payer.length - 4)}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-white">{ethers.formatEther(tx.paymentAmount)} ETH</td>
                      <td className="py-3 px-4 text-sm text-white">${ethers.formatEther(tx.usdAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DogeHeadCoinSection
