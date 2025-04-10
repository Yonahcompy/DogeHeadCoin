"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../../component/ui/button/index"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Program, AnchorProvider, web3, BN, setProvider } from "@coral-xyz/anchor"
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import idl from "../../component/palm_presale.json"
import { toast } from "react-hot-toast"
import type { PalmPresale } from "../palm_presale"
import { Buffer } from "buffer"
import { Progress } from "../../component/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../component/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../component/ui/dialog"
import { Loader2, Check, AlertCircle, Info, ArrowRight, Clock, ChevronRight, Gift, Users, Layers } from "lucide-react"
import { Badge } from "../../component/ui/badge/index"
import { Input } from "../../component/ui/input/index"
import { Label } from "../../component/ui/label/index"
import { Alert, AlertDescription, AlertTitle } from "../../component/ui/alert/index"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../component/ui/tabs/index"

// Constants
const programID = new PublicKey(
  // idl?.metadata?.address ||
  "Bxa17nCo2DYSy9FBVnugR2GeU4kGJ1tPPSxhWWzLBHDd",
)
const PRESALE_SEED = Buffer.from([80, 82, 69, 83, 65, 76, 69, 95, 83, 69, 69, 68])
const TOKEN_MINT_ADDRESS = new PublicKey("wGmzfk9s1TdiEqmWnzzPp26uTRK5hFZx3uTTJefNswo")
const REFERRAL_SEED = "REFERRAL_SEED"
const STAGE_SEED = Buffer.from([83, 84, 65, 71, 69, 95, 83, 69, 69, 68]) // "STAGE_SEED"

const DogeHeadCoinSection = () => {
  // State variables
  const { publicKey, connected, sendTransaction, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [showPurchase, setShowPurchase] = useState(false)
  const [usdtAmount, setUsdtAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [presaleInfo, setPresaleInfo] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showDepositDialog, setShowDepositDialog] = useState(false)
  const [showCreateStageDialog, setShowCreateStageDialog] = useState(false)
  const [showActivateStageDialog, setShowActivateStageDialog] = useState(false)
  const [, setShowReferralDialog] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [referralInfo, setReferralInfo] = useState<any>(null)
  const [presaleStages, setPresaleStages] = useState<any[]>([])
  const [currentStage, setCurrentStage] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Stage form state
  const [stageNumber, setStageNumber] = useState("1")
  const [stageTokens, setStageTokens] = useState("")
  const [stagePrice, setStagePrice] = useState("")
  const [stageStartTime, setStageStartTime] = useState("")
  const [stageEndTime, setStageEndTime] = useState("")

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
  const findUserInfoPDA = useCallback(async (userPubkey: any) => {
    if (!userPubkey) return null
    const [pda] = await PublicKey.findProgramAddressSync([Buffer.from("USER_INFO"), userPubkey.toBuffer()], programID)
    return pda
  }, [])

  // Find PDA for presale vault
  const findPresaleVaultPDA = useCallback(async () => {
    const [pda, bump] = await PublicKey.findProgramAddressSync([Buffer.from("PRESALE_VAULT")], programID)
    return { pda, bump }
  }, [])

  // Find PDA for presale stage
  const findPresaleStagePDA = useCallback(async (stageNumber: number) => {
    const [pda] = await PublicKey.findProgramAddressSync(
      [STAGE_SEED, Buffer.from([stageNumber])],
      programID,
    )
    return pda
  }, [])

  // Find PDA for referral info
  const findReferralInfoPDA = useCallback((userPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(REFERRAL_SEED), userPubkey.toBuffer()],
      programID
    )[0]
  }, [])

  // Fetch user info
  const fetchUserInfo = useCallback(async () => {
    try {
      if (!publicKey) return

      const program = getProgram()
      if (!program) return

      const userInfoPDA = await findUserInfoPDA(publicKey)
      if (!userInfoPDA) return

      try {
        const userInfoData: any = await program.account.userInfo.fetch(userInfoPDA)
        setUserInfo(userInfoData)

        // If user has a referrer, try to get referral info
        if (userInfoData.wasReferred) {
          try {
            const referralInfoPDA = await findReferralInfoPDA(publicKey)
            if (referralInfoPDA) {
              const referralData = await program.account.referralInfo.fetch(referralInfoPDA)
              setReferralInfo(referralData)
            }
          } catch (err) {
            // console.log("Referral info not found:", err)
          }
        }
      } catch (err) {
        // console.log("User info not found:", err)
        setUserInfo(null)
      }
    } catch (err) {
      console.error("Error fetching user info:", err)
    }
  }, [findUserInfoPDA, findReferralInfoPDA, getProgram, publicKey])

  // Fetch presale stages
  const fetchPresaleStages = useCallback(async () => {
    try {
      if (!presaleInfo) return

      const program = getProgram()
      if (!program) return

      const stages = []
      const totalStages = presaleInfo.totalStages

      for (let i = 1; i <= totalStages; i++) {
        try {
          const stagePDA = await findPresaleStagePDA(i)
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
          // console.log(`Stage ${i} not found:`, err)
        }
      }

      setPresaleStages(stages)
    } catch (err) {
      console.error("Error fetching presale stages:", err)
    }
  }, [findPresaleStagePDA, getProgram, presaleInfo])

  // Buy tokens
  const buyTokens = useCallback(
    async (tokenAmount: any, quoteAmount: any, referrerCodeInput?: string) => {
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

        // Check if presale is initialized
        if (!isInitialized) {
          throw new Error("Presale not initialized yet")
        }

        // Check if we have a current stage
        if (!currentStage) {
          throw new Error("No active presale stage")
        }

        const presaleInfoPDA = await findPresaleInfoPDA()
        const userInfoPDA = await findUserInfoPDA(publicKey)
        const { pda: presaleVaultPDA } = await findPresaleVaultPDA()
        const presaleStagePDA = currentStage.pda || (await findPresaleStagePDA(presaleInfo.currentStage))

        // Prepare referral code if provided
        let referrerCode = null
        let referrerInfoAccount = null

        if (referrerCodeInput) {
          // Convert string to Uint8Array of length 8
          const codeBytes = new TextEncoder().encode(referrerCodeInput.substring(0, 8))
          const paddedCode = new Uint8Array(8)
          paddedCode.set(codeBytes)
          referrerCode = paddedCode

          // Find the referrer's account
          // This is simplified - in a real app you'd need to query all referral accounts
          // to find the one with the matching code
          try {
            // This is a placeholder - you'd need to implement a way to find the referrer account
            // by code in a real application
            const allReferrals = await program.account.referralInfo.all()
            const matchingReferral = allReferrals.find(
              (r) => Buffer.from(r.account.referralCode).toString() === referrerCodeInput,
            )

            if (matchingReferral) {
              referrerInfoAccount = matchingReferral.publicKey
            }
          } catch (err) {
            console.error("Error finding referrer:", err)
            throw new Error("Invalid referral code")
          }
        }

        // Build the transaction
        const buyTokenTx = await program.methods
          .buyToken(new BN(tokenAmount), new BN(quoteAmount), referrerCode ? Array.from(referrerCode) : null)
          .accounts({
            presaleInfo: presaleInfoPDA,
            presaleAuthority: presaleInfo.authority,
            presaleStage: presaleStagePDA,
            userInfo: userInfoPDA as PublicKey,
            referrerInfo: referrerInfoAccount,
            presaleVault: presaleVaultPDA,
            buyer: publicKey as PublicKey,
            rent: web3.SYSVAR_RENT_PUBKEY,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
          })
          .rpc()

        console.log("Token purchase successful:", buyTokenTx)
        toast.success("Token purchase successful!")

        // Refresh user info
        await fetchUserInfo()
        await checkPresaleInitialized()
        await fetchPresaleStages()
      } catch (err: any) {
        console.error("Error buying tokens:", err)
        setError(`Failed to buy tokens: ${err.message}`)
        toast.error(`Failed to buy tokens: ${err.message}`)
      } finally {
        setLoading(false)
      }
    },
    [
      findPresaleInfoPDA,
      findPresaleVaultPDA,
      findUserInfoPDA,
      findPresaleStagePDA,
      getProgram,
      isInitialized,
      presaleInfo,
      publicKey,
      // checkPresaleInitialized,
      fetchPresaleStages,
      fetchUserInfo,
      currentStage,
    ],
  )

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
  const createPresale = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const program = getProgram()
      if (!program) {
        throw new Error("Program not available")
      }

      const presaleInfoPDA = await findPresaleInfoPDA()

      // Check if presale already exists
      const isAlreadyInitialized = await checkPresaleInitialized()
      if (isAlreadyInitialized) {
        console.log("Presale already initialized")
        setLoading(false)
        return
      }

      console.log("Creating presale...")

      const tx = await program.methods
        .createPresale(
          TOKEN_MINT_ADDRESS,
          new BN(750000000), // softcapAmount
          new BN(1000000000), // hardcapAmount
          new BN(1000000000), // maxTokenAmountPerAddress
          new BN(1000000000), // pricePerToken
          new BN(Date.now()), // startTime
          new BN(Date.now() + 7 * 24 * 60 * 60 * 1000), // endTime 1 week from now
          3, // totalStages - default to 3 stages
        )
        .accounts({
          presaleInfo: presaleInfoPDA,
          authority: publicKey!, // Assert publicKey is not null
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc()

      console.log("Presale created successfully:", tx)
      toast.success("Presale created successfully!")

      // Fetch the newly created presale info
      await checkPresaleInitialized()
    } catch (err: any) {
      console.error("Error creating presale:", err)
      setError(`Failed to create presale: ${err.message}`)
      toast.error(`Failed to create presale: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [checkPresaleInitialized, findPresaleInfoPDA, getProgram, publicKey])

  // Create a presale stage
  const createPresaleStage = useCallback(async () => {
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

      // Check if presale is initialized
      if (!isInitialized) {
        throw new Error("Presale not initialized yet")
      }

      // Validate stage number
      const stageNum = Number.parseInt(stageNumber)
      if (isNaN(stageNum) || stageNum <= 0 || stageNum > 255) {
        throw new Error("Invalid stage number (must be between 1 and 255)")
      }

      // Check if stage number exceeds total stages
      if (!presaleInfo || stageNum > presaleInfo.totalStages) {
        throw new Error(`Stage number cannot exceed total stages (${presaleInfo?.totalStages || 0})`)
      }

      // Check if stage already exists
      const existingStage = presaleStages.find(s => s.stageNumber === stageNum)
      if (existingStage) {
        throw new Error(`Stage ${stageNum} already exists`)
      }

      // Validate token amount
      const tokenAmount = Number.parseFloat(stageTokens)
      if (isNaN(tokenAmount) || tokenAmount <= 0) {
        throw new Error("Invalid token amount")
      }

      // Convert token amount to raw amount (no need to convert to lamports)
      const tokenAmountRaw = new BN(Math.floor(tokenAmount))
      if (tokenAmountRaw.lte(new BN(0))) {
        throw new Error("Token amount must be greater than 0")
      }

      // Validate price
      const price = Number.parseFloat(stagePrice)
      if (isNaN(price) || price <= 0) {
        throw new Error("Invalid price")
      }

      // Convert price to lamports (u64)
      const priceLamports = new BN(Math.floor(price * LAMPORTS_PER_SOL))
      if (priceLamports.lte(new BN(0))) {
        throw new Error("Price must be greater than 0")
      }

      // Validate dates
      const startTimeMs = new Date(stageStartTime).getTime()
      const endTimeMs = new Date(stageEndTime).getTime()
      const now = Date.now()

      if (isNaN(startTimeMs) || isNaN(endTimeMs)) {
        throw new Error("Invalid date format")
      }

      if (startTimeMs < now) {
        throw new Error("Start time cannot be in the past")
      }

      if (endTimeMs <= startTimeMs) {
        throw new Error("End time must be after start time")
      }

      // Convert times to BN (u64)
      const startTimeBN = new BN(startTimeMs)
      const endTimeBN = new BN(endTimeMs)

      const presaleInfoPDA = await findPresaleInfoPDA()
      const presaleStagePDA = await findPresaleStagePDA(stageNum)

      console.log("Creating stage with the following parameters:")
      console.log("Stage Number:", stageNum)
      console.log("Available Tokens:", tokenAmountRaw.toString())
      console.log("Price Per Token:", priceLamports.toString())
      console.log("Start Time:", new Date(startTimeMs).toISOString())
      console.log("End Time:", new Date(endTimeMs).toISOString())
      console.log("Presale Info PDA:", presaleInfoPDA.toString())
      console.log("Presale Stage PDA:", presaleStagePDA.toString())

      const tx = await program.methods
        .addPresaleStage(
          new BN(stageNum),
          tokenAmountRaw,
          priceLamports,
          startTimeBN,
          endTimeBN,
        )
        .accounts({
          presaleInfo: presaleInfoPDA,
          presaleStage: presaleStagePDA,
          authority: publicKey,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc()

      console.log("Stage created successfully:", tx)
      toast.success(`Stage ${stageNum} created successfully!`)
      setShowCreateStageDialog(false)

      // Reset form
      setStageNumber("1")
      setStageTokens("")
      setStagePrice("")
      setStageStartTime("")
      setStageEndTime("")

      // Refresh stages
      await fetchPresaleStages()
    } catch (err: any) {
      console.error("Error creating stage:", err)
      const errorMessage = err.message || "Failed to create stage"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [
    findPresaleInfoPDA,
    findPresaleStagePDA,
    getProgram,
    isInitialized,
    publicKey,
    stageNumber,
    stageTokens,
    stagePrice,
    stageStartTime,
    stageEndTime,
    fetchPresaleStages,
    presaleInfo,
    presaleStages,
  ])

  // Activate a presale stage
  const activateStage = useCallback(
    async (stageNum: number) => {
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

        // Check if presale is initialized
        if (!isInitialized) {
          throw new Error("Presale not initialized yet")
        }

        const presaleInfoPDA = await findPresaleInfoPDA()
        const presaleStagePDA = await findPresaleStagePDA(stageNum)

        // If this is not the first stage, we need the previous stage
        let previousStagePDA = null
        if (stageNum > 1) {
          previousStagePDA = await findPresaleStagePDA(stageNum - 1)
        }

        const tx = await program.methods
          .activateStage(stageNum)
          .accounts({
            presaleInfo: presaleInfoPDA,
            presaleStage: presaleStagePDA,
            previousStage: previousStagePDA,
            authority: publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc()

        console.log("Stage activated successfully:", tx)
        toast.success(`Stage ${stageNum} activated successfully!`)
        setShowActivateStageDialog(false)

        // Refresh stages and presale info
        await checkPresaleInitialized()
        await fetchPresaleStages()
      } catch (err: any) {
        console.error("Error activating stage:", err)
        setError(`Failed to activate stage: ${err.message}`)
        toast.error(`Failed to activate stage: ${err.message}`)
      } finally {
        setLoading(false)
      }
    },
    [
      findPresaleInfoPDA,
      findPresaleStagePDA,
      getProgram,
      isInitialized,
      publicKey,
      checkPresaleInitialized,
      fetchPresaleStages,
    ],
  )

  // Create referral
  const createReferral = useCallback(async () => {
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

      const referralInfoPDA = await findReferralInfoPDA(publicKey)
      if (!referralInfoPDA) {
        throw new Error("Failed to generate referral address")
      }

      const tx = await program.methods
        .createReferral()
        .accounts({
          referralInfo: referralInfoPDA,
          user: publicKey,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc()

      console.log("Referral created successfully:", tx)
      toast.success("Referral created successfully!")

      // Fetch the newly created referral info
      const referralData = await program.account.referralInfo.fetch(referralInfoPDA)
      setReferralInfo(referralData)
      setShowReferralDialog(false)
    } catch (err: any) {
      console.error("Error creating referral:", err)
      setError(`Failed to create referral: ${err.message}`)
      toast.error(`Failed to create referral: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [findReferralInfoPDA, getProgram, publicKey])

  // Claim referral rewards
  const claimReferralRewards = useCallback(async () => {
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

      if (!referralInfo) {
        throw new Error("No referral information found")
      }

      const referralInfoPDA = await findReferralInfoPDA(publicKey)
      if (!referralInfoPDA) {
        throw new Error("Failed to generate referral address")
      }

      const userInfoPDA = await findUserInfoPDA(publicKey)
      if (!userInfoPDA) {
        // throw new Error("User info not found")
      }

      const tx = await program.methods
        .claimReferralRewards()
        .accounts({
          referralInfo: referralInfoPDA,
          userInfo: userInfoPDA as PublicKey,
          user: publicKey,
        })
        .rpc()

      console.log("Rewards claimed successfully:", tx)
      toast.success("Referral rewards claimed successfully!")

      // Refresh user and referral info
      await fetchUserInfo()
    } catch (err: any) {
      console.error("Error claiming rewards:", err)
      setError(`Failed to claim rewards: ${err.message}`)
      toast.error(`Failed to claim rewards: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [findReferralInfoPDA, findUserInfoPDA, getProgram, publicKey, referralInfo, fetchUserInfo])

  // Deposit tokens to presale
  const depositTokens = useCallback(
    async (amount: BN) => {
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

        // Check if presale is initialized
        if (!isInitialized) {
          throw new Error("Presale not initialized yet")
        }

        const presaleInfoPDA = await findPresaleInfoPDA()
        const { pda: presaleVaultPDA } = await findPresaleVaultPDA()

        // Get the token mint address from presale info
        const tokenMintAddress = presaleInfo.tokenMintAddress

        if (!tokenMintAddress) {
          throw new Error("Token mint address not found in presale info")
        }

        console.log("Token mint address:", tokenMintAddress.toString())

        // Get associated token accounts
        const fromAssociatedTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, publicKey)

        const toAssociatedTokenAccount = await getAssociatedTokenAddress(
          tokenMintAddress,
          presaleVaultPDA,
          true, // allowOwnerOffCurve
        )

        // Create transaction
        const transaction = new Transaction()

        // Check if the presale token account exists, if not create it
        try {
          await connection.getAccountInfo(toAssociatedTokenAccount)
        } catch (err) {
          // Token account doesn't exist, create it
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              toAssociatedTokenAccount,
              presaleVaultPDA,
              tokenMintAddress,
            ),
          )
        }

        // Add deposit instruction with all required accounts
        const depositTx = await program.methods
          .depositToken(amount)
          .accounts({
            mintAccount: tokenMintAddress,
            fromAssociatedTokenAccount: fromAssociatedTokenAccount,
            fromAuthority: publicKey,
            toAssociatedTokenAccount: toAssociatedTokenAccount,
            presaleVault: presaleVaultPDA,
            presaleInfo: presaleInfoPDA,
            admin: presaleInfo.authority,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .transaction()

        transaction.add(depositTx)

        const signature = await sendTransaction(transaction, connection)
        await connection.confirmTransaction(signature, "confirmed")

        console.log("Token deposit successful:", signature)
        toast.success("Token deposit successful!")
        setShowDepositDialog(false)
        setDepositAmount("")

        // Refresh presale info
        await checkPresaleInitialized()
      } catch (err: any) {
        console.error("Error depositing tokens:", err)
        setError(`Failed to deposit tokens: ${err.message}`)
        toast.error(`Failed to deposit tokens: ${err.message}`)
      } finally {
        setLoading(false)
      }
    },
    [
      checkPresaleInitialized,
      connection,
      findPresaleInfoPDA,
      findPresaleVaultPDA,
      getProgram,
      isInitialized,
      publicKey,
      sendTransaction,
      presaleInfo,
    ],
  )

  // Calculate $DHC tokens based on USDT amount
  const calculateTokens = useCallback(() => {
    if (!usdtAmount || isNaN(Number.parseFloat(usdtAmount))) return 0

    // Use the current stage price if available, otherwise fallback to presale info
    const price = currentStage?.pricePerToken
      ? currentStage.pricePerToken.toNumber() / LAMPORTS_PER_SOL
      : presaleInfo?.pricePerToken
        ? presaleInfo.pricePerToken.toNumber() / LAMPORTS_PER_SOL
        : 0.0001

    return Number.parseFloat(usdtAmount) / price
  }, [usdtAmount, presaleInfo, currentStage])

  // Handle buy button click
  const handleBuyClick = () => {
    if (!connected) return
    setShowPurchase(true)
  }

  // Handle cancel
  const handleCancel = () => {
    setShowPurchase(false)
    setUsdtAmount("")
    setReferralCode("")
  }

  // Handle confirm purchase
  const handleConfirmPurchase = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first")
      return
    }

    try {
      const tokenAmount = calculateTokens()
      const quoteAmount = Number.parseFloat(usdtAmount) * LAMPORTS_PER_SOL

      await buyTokens(Math.floor(tokenAmount * LAMPORTS_PER_SOL), Math.floor(quoteAmount), referralCode || undefined)

      setShowPurchase(false)
      setUsdtAmount("")
      setReferralCode("")
    } catch (error) {
      console.error("Purchase failed:", error)
      toast.error("Purchase failed. Please try again.")
    }
  }

  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (!presaleInfo) return 0
    const soldAmount = presaleInfo.soldTokenAmount.toNumber()
    const hardcapAmount = presaleInfo.hardcapAmount.toNumber()
    return (soldAmount / hardcapAmount) * 100
  }, [presaleInfo])

  // Format time remaining
  const formatTimeRemaining = useCallback(() => {
    if (!presaleInfo) return "Not started"

    const now = Date.now()
    const endTime = presaleInfo.endTime.toNumber()
    const timeLeft = endTime - now

    if (timeLeft <= 0) return "Ended"

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    return `${days}d ${hours}h ${minutes}m`
  }, [presaleInfo])

  // Format stage time
  const formatStageTime = useCallback((stage: any) => {
    if (!stage) return { start: "N/A", end: "N/A" }

    const startDate = new Date(stage.startTime.toNumber())
    const endDate = new Date(stage.endTime.toNumber())

    return {
      start: startDate.toLocaleDateString(),
      end: endDate.toLocaleDateString(),
    }
  }, [])

  // Add a new function to handle manual refresh after the other callback functions
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError("")

      if (connected && publicKey) {
        await checkPresaleInitialized()
        await fetchUserInfo()
        await fetchPresaleStages()
      }

      toast.success("Data refreshed successfully!")
    } catch (err: any) {
      console.error("Error refreshing data:", err)
      setError(`Failed to refresh data: ${err.message}`)
      toast.error(`Failed to refresh data: ${err.message}`)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 px-4 sm:px-6 lg:px-8">
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
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-refresh-cw"
                        >
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                      )}
                      <span className="ml-1">Refresh</span>
                    </Button>
                    {isInitialized && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                        <Clock className="w-3 h-3 mr-1" /> {formatTimeRemaining()}
                      </Badge>
                    )}
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
                      <AlertDescription>Initialize the presale to start accepting contributions.</AlertDescription>
                    </Alert>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      onClick={createPresale}
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
                    <Tabs defaultValue="overview" className="w-full " onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-3 mb-6 rounded-lg p-2">
                        <TabsTrigger value="overview" style={{ backgroundColor: activeTab === 'overview' ? '#222' : 'transparent' }}>Overview</TabsTrigger>
                        <TabsTrigger value="stages" style={{ backgroundColor: activeTab === 'stages' ? '#222' : 'transparent' }}>Stages</TabsTrigger>
                        <TabsTrigger value="referrals" style={{ backgroundColor: activeTab === 'referrals' ? '#222' : 'transparent' }}>Referrals</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview">
                        <div className="space-y-6">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-400">Progress</span>
                              <span className="text-sm font-medium">
                                {presaleInfo
                                  ? `${(presaleInfo.soldTokenAmount.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} / ${(
                                      presaleInfo.hardcapAmount.toNumber() / LAMPORTS_PER_SOL
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
                                  ? `${(presaleInfo.softcapAmount.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC`
                                  : "750,000,000 $DHC"}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <p className="text-sm text-gray-400 mb-1">Hard Cap</p>
                              <p className="text-xl font-bold">
                                {presaleInfo
                                  ? `${(presaleInfo.hardcapAmount.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC`
                                  : "1,000,000,000 $DHC"}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <p className="text-sm text-gray-400 mb-1">Current Price</p>
                              <p className="text-xl font-bold">
                                $
                                {currentStage
                                  ? `${(currentStage.pricePerToken.toNumber() / LAMPORTS_PER_SOL).toFixed(4)}`
                                  : presaleInfo
                                    ? `${(presaleInfo.pricePerToken.toNumber() / LAMPORTS_PER_SOL).toFixed(4)}`
                                    : "0.0001"}
                              </p>
                            </div>
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <p className="text-sm text-gray-400 mb-1">Max Per Wallet</p>
                              <p className="text-xl font-bold">
                                {presaleInfo
                                  ? `${(
                                      presaleInfo.maxTokenAmountPerAddress.toNumber() / LAMPORTS_PER_SOL
                                    ).toLocaleString()} $DHC`
                                  : "1,000,000,000 $DHC"}
                              </p>
                            </div>
                          </div>

                          {/* Current Stage Info */}
                          {currentStage && (
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <Layers className="h-5 w-5 text-yellow-400 mr-2" />
                                <h3 className="text-lg font-semibold">Current Stage: {currentStage.stageNumber}</h3>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-sm text-gray-400">Available Tokens</p>
                                  <p className="font-medium">
                                    {(currentStage.availableTokens.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Tokens Sold</p>
                                  <p className="font-medium">
                                    {(currentStage.tokensSold.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Start Date</p>
                                  <p className="font-medium">{formatStageTime(currentStage).start}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">End Date</p>
                                  <p className="font-medium">{formatStageTime(currentStage).end}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Admin Controls */}
                          {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority.toString() && (
                            <div className="mt-4">
                              <Alert className="bg-purple-900/20 border-purple-500/50">
                                <Info className="h-4 w-4 text-purple-400" />
                                <AlertTitle>Admin Controls</AlertTitle>
                                <AlertDescription>You have admin privileges for this presale.</AlertDescription>
                              </Alert>
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Button
                                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                                  onClick={() => setShowDepositDialog(true)}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                    </>
                                  ) : (
                                    <>Deposit Tokens</>
                                  )}
                                </Button>
                                <Button
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                                  onClick={() => setShowCreateStageDialog(true)}
                                  disabled={loading}
                                >
                                  Create Stage
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Buy Button */}
                          {isInitialized && (
                            <Button
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-6 text-lg"
                              onClick={handleBuyClick}
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
                            {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority.toString() && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                                onClick={() => setShowActivateStageDialog(true)}
                                disabled={loading || presaleStages.length === 0}
                              >
                                Activate Stage
                              </Button>
                            )}
                          </div>

                          {presaleStages.length === 0 ? (
                            <Alert className="bg-blue-900/20 border-blue-500/50">
                              <Info className="h-4 w-4 text-blue-400" />
                              <AlertTitle>No Stages Created</AlertTitle>
                              <AlertDescription>
                                {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority.toString()
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
                                      Price: ${(stage.pricePerToken.toNumber() / LAMPORTS_PER_SOL).toFixed(4)}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-gray-400">Available:</p>
                                      <p>
                                        {(stage.availableTokens.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Sold:</p>
                                      <p>{(stage.tokensSold.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Start:</p>
                                      <p>{formatStageTime(stage).start}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">End:</p>
                                      <p>{formatStageTime(stage).end}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {connected && presaleInfo && publicKey?.toString() === presaleInfo.authority.toString() && (
                            <Button
                              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                              onClick={() => setShowCreateStageDialog(true)}
                              disabled={loading}
                            >
                              Create New Stage
                            </Button>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="referrals">
                        <div className="space-y-4">
                          {referralInfo ? (
                            <div className="space-y-4">
                              <Alert className="bg-green-900/20 border-green-500/50">
                                <Gift className="h-4 w-4 text-green-400" />
                                <AlertTitle>Your Referral Code</AlertTitle>
                                <AlertDescription className="font-mono text-lg mt-2">
                                  {Buffer.from(referralInfo.referralCode).toString().trim() || "Code not available"}
                                </AlertDescription>
                              </Alert>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                  <p className="text-sm text-gray-400 mb-1">Total Referrals</p>
                                  <p className="text-xl font-bold flex items-center">
                                    <Users className="h-5 w-5 mr-2 text-yellow-400" />
                                    {referralInfo.totalReferrals.toString()}
                                  </p>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                  <p className="text-sm text-gray-400 mb-1">Total Rewards</p>
                                  <p className="text-xl font-bold">
                                    {(referralInfo.totalRewardsEarned.toNumber() / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                                    SOL
                                  </p>
                                </div>
                              </div>

                              {referralInfo.totalRewardsEarned.toNumber() > 0 && !referralInfo.rewardsClaimed && (
                                <Button
                                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                                  onClick={claimReferralRewards}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                    </>
                                  ) : (
                                    <>Claim Referral Rewards</>
                                  )}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Alert className="bg-blue-900/20 border-blue-500/50">
                                <Info className="h-4 w-4 text-blue-400" />
                                <AlertTitle>Referral Program</AlertTitle>
                                <AlertDescription>
                                  Create a referral code to earn rewards when others use your code to buy tokens.
                                </AlertDescription>
                              </Alert>

                              <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                                onClick={createReferral}
                                disabled={loading || !connected}
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                  </>
                                ) : (
                                  <>Create Referral Code</>
                                )}
                              </Button>
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
                        {(userInfo.buyTokenAmount.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC
                      </p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Amount Paid</p>
                      <p className="text-xl font-bold">
                        ${(userInfo.buyQuoteAmount.toNumber() / LAMPORTS_PER_SOL).toLocaleString()}
                      </p>
                    </div>
                    {userInfo.wasReferred && (
                      <div className="col-span-2 bg-gray-700/30 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">Referred By</p>
                        <p className="text-sm font-mono truncate">{userInfo.referrer.toString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Doge Image and Info */}
          <div>
            <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
              <div className="relative">
                <img
                  src="https://doge-head.com/wp-content/uploads/2025/01/Meme_goden_2-2048x2048.png"
                  alt="Doge Head Character"
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent"></div>
              </div>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">About Doge Head Coin</h3>
                <p className="text-gray-300 mb-4">
                  Doge Head Coin ($DHC) is more than just a memecoin. It's a community-driven project focused on art,
                  gaming, and music.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-2 h-5 w-5" />
                    <span>Community-driven project</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-2 h-5 w-5" />
                    <span>Deflationary tokenomics</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-2 h-5 w-5" />
                    <span>NFT integration planned</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="text-green-400 mr-2 h-5 w-5" />
                    <span>Gaming platform in development</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <a
                    href="https://doge-head.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    Learn more about $DHC <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Buy $DHC Tokens</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the amount you want to purchase in USDT.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="usdt-amount">USDT Amount</Label>
              <Input
                id="usdt-amount"
                type="number"
                placeholder="Enter USDT amount"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-code">Referral Code (Optional)</Label>
              <Input
                id="referral-code"
                type="text"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">You will receive:</span>
                <span className="font-medium">{calculateTokens().toLocaleString()} $DHC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price per token:</span>
                <span className="font-medium">
                  $
                  {currentStage?.pricePerToken
                    ? (currentStage.pricePerToken.toNumber() / LAMPORTS_PER_SOL).toFixed(4)
                    : presaleInfo?.pricePerToken
                      ? (presaleInfo.pricePerToken.toNumber() / LAMPORTS_PER_SOL).toFixed(4)
                      : "0.0001"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPurchase}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              disabled={!usdtAmount || isNaN(Number.parseFloat(usdtAmount)) || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>Confirm Purchase</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Deposit Tokens</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the amount of tokens you want to deposit to the presale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Token Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter token amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDepositDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (depositAmount && !isNaN(Number.parseFloat(depositAmount))) {
                  depositTokens(new BN(Number.parseFloat(depositAmount) * LAMPORTS_PER_SOL))
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              disabled={!depositAmount || isNaN(Number.parseFloat(depositAmount)) || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>Confirm Deposit</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Stage Dialog */}
      <Dialog open={showCreateStageDialog} onOpenChange={setShowCreateStageDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create Presale Stage</DialogTitle>
            <DialogDescription className="text-gray-400">Configure a new stage for your presale.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stage-number">Stage Number</Label>
              <Input
                id="stage-number"
                type="number"
                placeholder="Enter stage number"
                value={stageNumber}
                onChange={(e) => setStageNumber(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-tokens">Available Tokens</Label>
              <Input
                id="stage-tokens"
                type="number"
                placeholder="Enter available tokens"
                value={stageTokens}
                onChange={(e) => setStageTokens(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-price">Price Per Token (in USD)</Label>
              <Input
                id="stage-price"
                type="number"
                placeholder="Enter price per token"
                value={stagePrice}
                onChange={(e) => setStagePrice(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-start">Start Date</Label>
              <Input
                id="stage-start"
                type="date"
                value={stageStartTime}
                onChange={(e) => setStageStartTime(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-end">End Date</Label>
              <Input
                id="stage-end"
                type="date"
                value={stageEndTime}
                onChange={(e) => setStageEndTime(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateStageDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={createPresaleStage}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              disabled={!stageNumber || !stageTokens || !stagePrice || !stageStartTime || !stageEndTime || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>Create Stage</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Stage Dialog */}
      <Dialog open={showActivateStageDialog} onOpenChange={setShowActivateStageDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Activate Stage</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a stage to activate for your presale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {presaleStages.length > 0 ? (
                <div className="space-y-3">
                  {presaleStages.map((stage, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        stage.isActive
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-gray-700 bg-gray-800/30 hover:border-gray-500"
                      }`}
                      onClick={() => !stage.isActive && activateStage(stage.stageNumber)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <h4 className="font-medium">Stage {stage.stageNumber}</h4>
                          {stage.isActive && (
                            <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          Price: ${(stage.pricePerToken.toNumber() / LAMPORTS_PER_SOL).toFixed(4)}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        <p>Available: {(stage.availableTokens.toNumber() / LAMPORTS_PER_SOL).toLocaleString()} $DHC</p>
                        <p>
                          Period: {formatStageTime(stage).start} - {formatStageTime(stage).end}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert className="bg-yellow-900/20 border-yellow-500/50">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertTitle>No Stages Available</AlertTitle>
                  <AlertDescription>Create stages first before activating them.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActivateStageDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DogeHeadCoinSection
