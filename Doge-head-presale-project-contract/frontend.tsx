"use client"

import { DialogFooter } from "../../component/ui/dialog"

import { useState, useEffect, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor"
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, getMint, getAccount } from "@solana/spl-token"

import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"

import { Input } from "../../component/ui/input"

import { Label } from "../../component/ui/label"

import { Progress } from "../../component/ui/progress"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../component/ui/card"

import { Button } from "../../component/ui/button"

import { Alert, AlertDescription, AlertTitle } from "../../component/ui/alert"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../component/ui/tabs"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../component/ui/dialog"

import {
  Badge,
  // BadgeContent,
  // BadgeDescription,
  // BadgeTitle,
} from "../../component/ui/badge"

import { Loader2, Check, AlertCircle, Info, ArrowRight, X, RefreshCw } from "lucide-react"
import type { PalmPresale } from "../palm_presale"
import idl from "../palm_presale.json"

// Constants
const programID = new PublicKey("FLcLf1cpMm2ZVFVe86wUZsp17oeEQnz4mSjf44a8kxNt")
const PRESALE_SEED = Buffer.from("PRESALE_SEED")
const TOKEN_MINT_ADDRESS = new PublicKey("GK9VY5LN7sR4YesmnGitkq2VnYXd4vXE5wCsQ81ySXf2")
const USER_SEED = Buffer.from("USER_SEED")
const PRESALE_VAULT = Buffer.from("PRESALE_VAULT")

// Add custom notification component
const Notification = ({
  message,
  type = "success",
  onClose,
}: { message: string; type?: "success" | "error" | "info"; onClose: () => void }) => {
  const bgColor =
    type === "success"
      ? "bg-green-900/20 border-green-500/50"
      : type === "error"
        ? "bg-red-900/20 border-red-500/50"
        : "bg-blue-900/20 border-blue-500/50"

  const iconColor = type === "success" ? "text-green-400" : type === "error" ? "text-red-400" : "text-blue-400"

  const Icon = type === "success" ? Check : type === "error" ? AlertCircle : Info

  return (
    <div
      className={`fixed top-4 right-4 z-[99999] max-w-md ${bgColor} border rounded-lg p-4 shadow-lg flex items-start gap-3`}
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
  const { publicKey, connected, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [presaleInfo, setPresaleInfo] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [depositAmount, setDepositAmount] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showDepositDialog, setShowDepositDialog] = useState(false)
  const [presaleStages, setPresaleStages] = useState<any[]>([])
  const [currentStage, setCurrentStage] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [buyAmount, setBuyAmount] = useState("")
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [showInitializeDialog, setShowInitializeDialog] = useState(false)
  const [tokenMintAddress, setTokenMintAddress] = useState(TOKEN_MINT_ADDRESS.toString())

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

  // Find PDA for presale vault
  const findPresaleVaultPDA = useCallback(async () => {
    const [pda] = await PublicKey.findProgramAddressSync([PRESALE_VAULT], programID)
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

  // Get token decimals
  const getTokenDecimals = useCallback(
    async (mintAddress: PublicKey) => {
      try {
        const mintInfo = await getMint(connection, mintAddress)
        return mintInfo.decimals
      } catch (err) {
        console.error("Error getting token decimals:", err)
        // Default to 9 decimals if we can't get the actual decimals
        return 9
      }
    },
    [connection],
  )

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
      const tx = await program.methods
        .initialize(
          // tokenMintPubkey, // Add the token mint address parameter
          new BN(750000000), // softcapAmount
          new BN(1000000000), // hardcapAmount
          new BN(1000000000), // maxTokenAmountPerAddress
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
    if (!publicKey || !connection || !signTransaction) return

    try {
      setLoading(true)
      setError("")

      // Get program instance
      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      if (!currentStage) {
        throw new Error("No active stage")
      }

      // Convert string amount to BN
      const buyAmountBN = new BN(Math.floor(Number.parseFloat(buyAmount) * LAMPORTS_PER_SOL))

      if (buyAmountBN.lte(new BN(0))) {
        throw new Error("Buy amount must be greater than 0")
      }

      // Get the presale info PDA
      const presaleInfoPDA = await findPresaleInfoPDA()

      // Get the user info PDA
      const [userInfoPDA] = await PublicKey.findProgramAddressSync([USER_SEED], programID)

      // Get the presale vault PDA
      const [presaleVaultPDA] = await PublicKey.findProgramAddressSync([PRESALE_VAULT], programID)

      // Get the current stage PDA
      const currentStageNumber = presaleInfo.currentStage
      const [stagePDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("STAGE_SEED"), Buffer.from([currentStageNumber])],
        programID,
      )

      // Create a dummy ReferralInfo account for when no referral is used
      const [dummyReferralInfoPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("REFERRAL_SEED"), publicKey.toBuffer()],
        programID,
      )

      console.log("Current stage:", currentStageNumber)
      console.log("Stage PDA:", stagePDA.toString())
      console.log("User Info PDA:", userInfoPDA.toString())
      console.log("Presale Vault PDA:", presaleVaultPDA.toString())
      console.log("Dummy Referral Info PDA:", dummyReferralInfoPDA.toString())

      // Create the transaction
      const transaction = new Transaction()

      // We're not using a referrer, but we need to provide a dummy account for referrerInfo
      const accounts = {
        presaleInfo: presaleInfoPDA,
        presaleAuthority: presaleInfo.authority,
        presaleStage: stagePDA,
        userInfo: userInfoPDA,
        referrerInfo: dummyReferralInfoPDA, // Use a dummy ReferralInfo account
        presaleVault: presaleVaultPDA,
        buyer: publicKey,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }

      // Add the buy token instruction
      transaction.add(await program.methods.buyToken(buyAmountBN, null).accounts(accounts).instruction())

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

      console.log("Token purchase successful:", signature)
      showNotification("Token purchase successful!", "success")
      setShowBuyDialog(false)
      setBuyAmount("")

      // Refresh presale info and user info
      await checkPresaleInitialized()
      await fetchUserInfo()
    } catch (err: any) {
      console.error("Error buying tokens:", err)
      setError(`Failed to buy tokens: ${err.message}`)
      showNotification(`Failed to buy tokens: ${err.message}`, "error")
    } finally {
      setLoading(false)
    }
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

  // Initialize component
  useEffect(() => {
    if (connected && publicKey) {
      // Initial load only, no automatic refreshing
      checkPresaleInitialized().then((initialized) => {
        if (initialized) {
          fetchPresaleStages()
        }
      })
      fetchUserInfo()
    }
  }, [connected, publicKey, checkPresaleInitialized, fetchUserInfo, fetchPresaleStages])

  // Update the depositTokens function to use tokenOwner's token account instead of authority's token account
  const depositTokens = async () => {
    if (!publicKey || !connection || !signTransaction) return

    try {
      setLoading(true)
      setError("")

      // Get program instance
      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      // Convert string amount to BN
      const depositAmountBN = new BN(Math.floor(Number.parseFloat(depositAmount) * LAMPORTS_PER_SOL))

      if (depositAmountBN.lte(new BN(0))) {
        throw new Error("Deposit amount must be greater than 0")
      }

      // Get the presale info PDA
      const presaleInfoPDA = await findPresaleInfoPDA()

      // Get the presale token account PDA
      const [presaleTokenAccount] = await PublicKey.findProgramAddressSync(
        [PRESALE_SEED, TOKEN_MINT_ADDRESS.toBuffer()],
        programID,
      )

      // Get the token owner's token account (which is the same as the authority in this case)
      const tokenOwnerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT_ADDRESS, publicKey)

      // Check if the token owner's token account exists
      try {
        await getAccount(connection, tokenOwnerTokenAccount)
      } catch (err) {
        throw new Error("You don't have a token account for this token. Please create one first.")
      }

      console.log("Token owner token account:", tokenOwnerTokenAccount.toString())

      // Create the transaction
      const transaction = new Transaction()

      // Add the deposit token instruction
      transaction.add(
        await program.methods
          .depositToken(depositAmountBN)
          .accounts({
            presaleInfo: presaleInfoPDA,
            authority: publicKey,
            tokenOwner: publicKey, // The token owner is also the authority in this case
            tokenAccount: tokenOwnerTokenAccount, // This must be owned by the token owner
            presaleTokenAccount: presaleTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
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

      console.log("Token deposit successful:", signature)
      showNotification("Token deposit successful!", "success")
      setShowDepositDialog(false)
      setDepositAmount("")

      // Refresh presale info
      await checkPresaleInitialized()
    } catch (err: any) {
      console.error("Error depositing tokens:", err)
      setError(`Failed to deposit tokens: ${err.message}`)
      showNotification(`Failed to deposit tokens: ${err.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 px-4 sm:px-6 lg:px-8">
      {/* Add notification component */}
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
              Doge Head Coin
            </h1>
            <p className="text-gray-300 max-w-2xl">
              More than just a memecoin, a friendly dog, lover of art, video games and music!
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <WalletMultiButton className="!bg-gradient-to-r from-yellow-500 to-orange-500 !rounded-lg !py-2 !px-4 !text-white !font-medium !transition-all !shadow-lg hover:!shadow-xl" />
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex justify-center mb-8">
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500 px-3 py-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Solana Devnet</span>
            </div>
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Presale Info */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold">Presale Details</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing || !connected}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="ml-1">Refresh</span>
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-gray-400">
                  {currentStage
                    ? `Stage ${currentStage.stageNumber} of the Doge Head Coin presale`
                    : "Doge Head Coin presale"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isInitialized && connected && (
                  <div className="mb-6">
                    <Alert className="bg-blue-900/20 border-blue-500/50 mb-4">
                      <Info className="h-4 w-4 text-blue-400" />
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
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
                      <TabsList className="grid grid-cols-2 mb-6 rounded-lg p-2">
                        <TabsTrigger
                          value="overview"
                          style={{ backgroundColor: activeTab === "overview" ? "#222" : "transparent" }}
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger
                          value="stages"
                          style={{ backgroundColor: activeTab === "stages" ? "#222" : "transparent" }}
                        >
                          Stages
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview">
                        <div className="space-y-6">
                          {/* Status Badge */}
                          {presaleInfo && (
                            <div className="flex justify-center mb-4">
                              <Badge
                                className={`px-3 py-1 text-sm ${
                                  presaleInfo.isLive
                                    ? "bg-green-900/20 text-green-400 border-green-500"
                                    : "bg-yellow-900/20 text-yellow-400 border-yellow-500"
                                }`}
                              >
                                {presaleInfo.isLive ? "Presale is LIVE" : "Presale not started"}
                              </Badge>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-400">Progress</span>
                              <span className="text-sm font-medium">
                                {presaleInfo
                                  ? `${(presaleInfo.soldTokenAmount?.toNumber() || 0).toLocaleString()} / ${(
                                      presaleInfo.hardcapAmount?.toNumber() || 0
                                    ).toLocaleString()} $DHC`
                                  : "0 / 0 $DHC"}
                              </span>
                            </div>
                            <Progress value={calculateProgress()} className="h-2 bg-gray-700" />
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <p className="text-sm text-gray-400 mb-1">Soft Cap</p>
                              <p className="text-xl font-bold">
                                {presaleInfo
                                  ? `${(presaleInfo.softcapAmount?.toNumber() || 0).toLocaleString()} $DHC`
                                  : "750,000,000 $DHC"}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <p className="text-sm text-gray-400 mb-1">Hard Cap</p>
                              <p className="text-xl font-bold">
                                {presaleInfo
                                  ? `${(presaleInfo.hardcapAmount?.toNumber() || 0).toLocaleString()} $DHC`
                                  : "1,000,000,000 $DHC"}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <p className="text-sm text-gray-400 mb-1">Current Price</p>
                              <p className="text-xl font-bold">
                                $
                                {currentStage
                                  ? `${(currentStage.pricePerToken?.toNumber() / LAMPORTS_PER_SOL || 0).toFixed(4)}`
                                  : "0.0001"}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <p className="text-sm text-gray-400 mb-1">Max Per Wallet</p>
                              <p className="text-xl font-bold">
                                {presaleInfo
                                  ? `${(presaleInfo.maxTokenAmountPerAddress?.toNumber() || 0).toLocaleString()} $DHC`
                                  : "1,000,000,000 $DHC"}
                              </p>
                            </div>
                          </div>

                          {/* Admin Controls */}
                          {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority?.toString() && (
                            <div className="mt-4">
                              <Alert className="bg-purple-900/20 border-purple-500/50">
                                <Info className="h-4 w-4 text-purple-400" />
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
                            </div>
                          )}

                          {/* Buy Button */}
                          {isInitialized && presaleInfo && presaleInfo.isLive && (
                            <Button
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-6 text-lg"
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
                                  Buy $DHC Tokens <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                              )}
                            </Button>
                          )}

                          {/* Error Message */}
                          {error && (
                            <Alert variant="destructive" className="mt-4">
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
                            <h3 className="text-lg font-semibold">Presale Stages</h3>
                          </div>

                          {presaleStages.length === 0 ? (
                            <Alert className="bg-blue-900/20 border-blue-500/50">
                              <Info className="h-4 w-4 text-blue-400" />
                              <AlertTitle>No Stages Created</AlertTitle>
                              <AlertDescription>
                                {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority?.toString()
                                  ? "Create stages to start your presale."
                                  : "No presale stages have been created yet."}
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <div className="space-y-3">
                              {presaleStages.map((stage, index) => (
                                <div
                                  key={index}
                                  className={`border rounded-lg p-4 ${
                                    stage.isActive
                                      ? "border-yellow-500/50 bg-yellow-500/10"
                                      : "border-gray-700 bg-gray-800/30"
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center">
                                      <h4 className="font-medium">Stage {stage.stageNumber}</h4>
                                      {stage.isActive && (
                                        <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                                          Active
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      Price: ${(stage.pricePerToken?.toNumber() / LAMPORTS_PER_SOL || 0).toFixed(4)}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-gray-400">Available:</p>
                                      <p>{(stage.availableTokens?.toNumber() || 0).toLocaleString()} $DHC</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Sold:</p>
                                      <p>{(stage.tokensSold?.toNumber() || 0).toLocaleString()} $DHC</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Info Card */}
            {connected && userInfo && (
              <Card className="bg-gray-800/50 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Your Participation</CardTitle>
                  <CardDescription className="text-gray-400">Your current presale contribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Tokens Purchased</p>
                      <p className="text-xl font-bold">
                        {(userInfo.buyTokenAmount?.toNumber() || 0).toLocaleString()} $DHC
                      </p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Amount Paid</p>
                      <p className="text-xl font-bold">
                        {((userInfo.buyQuoteAmount?.toNumber() || 0) / LAMPORTS_PER_SOL).toLocaleString()} SOL
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Purchase Form */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Purchase $DHC</CardTitle>
                <CardDescription className="text-gray-400">Buy Doge Head Coin tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buyAmount">SOL Amount</Label>
                  <Input
                    id="buyAmount"
                    type="number"
                    placeholder="Enter SOL amount"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    disabled={!connected || loading || !currentStage}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated $DHC</Label>
                  <div className="p-2 rounded-md bg-gray-700/30">
                    {currentStage && buyAmount
                      ? (
                          (Number.parseFloat(buyAmount) * LAMPORTS_PER_SOL) /
                          (currentStage.pricePerToken?.toNumber() || 1)
                        ).toLocaleString()
                      : "0"}{" "}
                    $DHC
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium"
                  onClick={() => setShowBuyDialog(true)}
                  disabled={!connected || loading || !buyAmount || isNaN(Number.parseFloat(buyAmount)) || !currentStage}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Buy Tokens"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Initialize Presale Dialog */}
      <Dialog open={showInitializeDialog} onOpenChange={setShowInitializeDialog}>
        <DialogContent className="bg-gray-800/90 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Initialize Presale</DialogTitle>
            <DialogDescription>
              Set up your presale parameters.
              <strong className="block mt-2 text-yellow-300">
                Important: Once initialized, the presale will be live immediately and tokens cannot be deposited
                afterward.
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tokenMintAddress" className="text-right">
                Token Mint
              </Label>
              <Input
                type="text"
                id="tokenMintAddress"
                value={tokenMintAddress}
                onChange={(e) => setTokenMintAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowInitializeDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={initializePresale} disabled={loading}>
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
        <DialogContent className="bg-gray-800/90 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Buy Tokens</DialogTitle>
            <DialogDescription>Purchase $DHC tokens with SOL.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyAmountDialog" className="text-right">
                SOL Amount
              </Label>
              <Input
                type="number"
                id="buyAmountDialog"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Estimated $DHC</Label>
              <div className="col-span-3 p-2 rounded-md bg-gray-700/30">
                {currentStage && buyAmount
                  ? (
                      (Number.parseFloat(buyAmount) * LAMPORTS_PER_SOL) /
                      (currentStage.pricePerToken?.toNumber() || 1)
                    ).toLocaleString()
                  : "0"}{" "}
                $DHC
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowBuyDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={buyTokens} disabled={loading}>
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
    </div>
  )
}

export default DogeHeadCoinSection
