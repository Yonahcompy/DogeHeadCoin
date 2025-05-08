import React, { useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
// If you haven't installed heroicons, run: npm install @heroicons/react
import { UserIcon, CurrencyDollarIcon, KeyIcon, ClipboardIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { DogePresale, IDL } from "../contracts/solanaIdl";
import { toast } from "react-toastify";

// Helper to truncate wallet address
const truncateAddress = (address: string) => address.slice(0, 4) + "..." + address.slice(-4);

// Add utility function to format token amounts
const formatTokenAmount = (amount: number) => {
  const formattedAmount = amount / 1e9;
  return formattedAmount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

// Add utility function to format SOL amounts
const formatSolAmount = (amount: number) => {
  const formattedAmount = amount / 1e9;
  return formattedAmount.toLocaleString(undefined, {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });
};

// First, let's add event types to match our smart contract events
type EventType = 'TokenDeposited' | 'TokensPurchased' | 'StageAdvanced' | 'PresaleInitialized' | 'AccountResized';

interface TransactionEvent {
  type: EventType;
  timestamp: number;
  signature: string;
  // Common fields
  authority?: PublicKey;
  // TokenDeposited specific
  amount?: number;
  total_deposited?: number;
  // TokensPurchased specific
  buyer?: PublicKey;
  token_amount?: number;
  usd_amount?: number;
  stage?: number;
  referrer?: PublicKey | null;
  // StageAdvanced specific
  new_stage?: number;
  new_price?: number;
  // PresaleInitialized specific
  token_mint?: PublicKey;
  initial_price?: number;
  // AccountResized specific
  new_size?: number;
}

const Profile: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [userProfile, setUserProfile] = useState<{
    totalPaidUsd: number;
    totalPaidSol: number;
    totalTokensBought: number;
    totalTokensClaimed: number;
    lastClaimTimestamp: number;
    referrer: string | PublicKey | null;
    transactions: Array<TransactionEvent>;
  } | null>(null);

  // Get Anchor provider
  const getProvider = useCallback(() => {
    if (!publicKey || !connection) return null;

    const wallet = {
      publicKey: publicKey,
      signTransaction: window.solana?.signTransaction!,
      signAllTransactions: window.solana?.signAllTransactions!,
    };

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "processed",
    });

    return provider;
  }, [connection, publicKey]);

  // Get program instance
  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;

    const programId = new PublicKey(
      "6LsqC27EVwj4RXcfxpf8WnUhGaB3tqEkXMxBwbxunzAq"
    );

    return new Program<DogePresale>(IDL, programId, provider);
  }, [getProvider]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!connected || !publicKey) {
      setUserProfile(null);
      return;
    }

    setLoading(true);
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
        b.buyerAddress.equals(publicKey)
      );

      if (!buyerInfo) {
        setUserProfile(null);
        return;
      }

      // Get user's transactions
      const userTransactions = account.transactions
        .filter((tx) => tx.buyer.equals(publicKey))
        .map((tx) => ({
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
        referrer: buyerInfo?.referrer || "",
        transactions: userTransactions,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.info("Failed to fetch user profile. Please try again.");
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, getProgram]);

  // Fetch profile when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    }
  }, [connected, publicKey, fetchUserProfile]);

  // Copy wallet address
  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  // Add event fetching function
  const fetchUserEvents = useCallback(async () => {
    if (!connected || !publicKey) {
      setUserProfile(null);
      return;
    }

    setLoading(true);
    try {
      const program = getProgram();
      if (!program) {
        throw new Error("Program not initialized");
      }

      // Get all events for the program
      const events = await program.account.transactionRecord.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      // Process and categorize events
      const processedEvents: TransactionEvent[] = events.map(event => {
        const eventData = event.account;
        
        // Determine event type and extract relevant data
        if (eventData.type === 'TokenDeposited') {
          return {
            type: 'TokenDeposited',
            timestamp: eventData.timestamp,
            signature: event.signature,
            authority: eventData.authority,
            amount: eventData.amount,
            total_deposited: eventData.total_deposited,
          };
        } else if (eventData.type === 'TokensPurchased') {
          return {
            type: 'TokensPurchased',
            timestamp: eventData.timestamp,
            signature: event.signature,
            buyer: eventData.buyer,
            token_amount: eventData.token_amount,
            usd_amount: eventData.usd_amount,
            stage: eventData.stage,
            referrer: eventData.referrer,
          };
        }
        // Add other event types as needed
        return eventData;
      });

      // Update user profile with events
      setUserProfile(prev => ({
        ...prev!,
        transactions: processedEvents,
      }));
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, getProgram]);

  // Filter transactions
  const filteredTxs = userProfile?.transactions
    .filter(
      (tx) =>
        tx.usdAmount.toString().includes(search) ||
        tx.solAmount.toString().includes(search) ||
        tx.tokenAmount.toString().includes(search)
    )
    .map((tx) => ({
      date: new Date(tx.timestamp * 1000).toLocaleString(),
      type: "Purchase",
      amount: `${formatSolAmount(tx.solAmount)} SOL`,
      status: "Completed",
    })) || [];

  // Blockie avatar fallback (simple colored circle with initials)
  const getAvatar = () => {
    if (!publicKey) return <UserIcon className="w-12 h-12 text-yellow-400" />;
    const initials = publicKey.toBase58().slice(0, 2).toUpperCase();
    return (
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-extrabold text-2xl shadow-lg border-4 border-yellow-300 animate-pulse-slow">
        {initials}
      </div>
    );
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl w-full max-w-md text-center shadow-xl border border-yellow-400/10">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-300 mb-6">
            Please connect your wallet to view your transaction history and profile.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Animated Hero Section */}
      <div className="relative mb-16 flex flex-col items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[7rem] md:text-[10rem] font-extrabold text-yellow-400/5 tracking-widest uppercase whitespace-nowrap rotate-[-8deg] animate-fade-in">
            Profile
          </span>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="absolute -inset-4 rounded-full bg-yellow-400/10 blur-2xl animate-pulse-slow" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-2 drop-shadow-lg relative">
            Your Profile
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 rounded-full mb-4 animate-shimmer" />
        </div>
        {/* Avatar & Wallet Address */}
        <div className="relative z-10 flex flex-col items-center mt-6">
          {getAvatar()}
          <div className="flex items-center mt-3 group cursor-pointer" onClick={handleCopy}>
            <span className="text-yellow-200 font-mono text-lg tracking-wider bg-black/60 px-3 py-1 rounded-lg border border-yellow-400/20 hover:border-yellow-400 transition">
              {publicKey ? truncateAddress(publicKey.toBase58()) : "-"}
            </span>
            <ClipboardIcon className="w-5 h-5 text-yellow-400 ml-2 group-hover:scale-110 transition-transform" />
            {copied && (
              <span className="ml-2 text-green-400 text-xs animate-fade-in">Copied!</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
        <div className="relative bg-black/60 backdrop-blur-lg rounded-2xl p-10 shadow-2xl border border-yellow-400/20 ring-2 ring-yellow-400/10 overflow-hidden transition-transform hover:scale-[1.025] hover:shadow-yellow-400/10">
          <div className="absolute -top-4 -right-4 opacity-20 text-yellow-400">
            <CurrencyDollarIcon className="w-20 h-20" />
          </div>
          <div className="flex items-center mb-4">
            <span className="inline-block w-2 h-8 bg-yellow-400 rounded-full mr-3 animate-shimmer" />
            <h3 className="text-2xl font-semibold text-yellow-400">Investment Summary</h3>
          </div>
          <p className="text-gray-200 text-2xl font-bold mb-1">
            {userProfile ? formatSolAmount(userProfile.totalPaidSol) : "0"} <span className="text-yellow-300">SOL</span>
          </p>
          <p className="text-gray-200 text-lg">Current Value: <span className="font-bold text-yellow-300">${userProfile?.totalPaidUsd.toFixed(2) || "0.00"}</span></p>
          <p className="text-gray-200 text-lg">ROI: <span className="font-bold text-green-400">+15%</span></p>
        </div>
        <div className="relative bg-black/60 backdrop-blur-lg rounded-2xl p-10 shadow-2xl border border-yellow-400/20 ring-2 ring-yellow-400/10 overflow-hidden transition-transform hover:scale-[1.025] hover:shadow-yellow-400/10">
          <div className="absolute -top-4 -right-4 opacity-20 text-yellow-400">
            <KeyIcon className="w-20 h-20" />
          </div>
          <div className="flex items-center mb-4">
            <span className="inline-block w-2 h-8 bg-yellow-400 rounded-full mr-3 animate-shimmer" />
            <h3 className="text-2xl font-semibold text-yellow-400">Token Holdings</h3>
          </div>
          <p className="text-gray-200 text-2xl font-bold mb-1">
            {userProfile ? formatTokenAmount(userProfile.totalTokensBought) : "0"} <span className="text-yellow-300">Tokens</span>
          </p>
          <p className="text-gray-200 text-lg">Claimable: <span className="font-bold text-yellow-300">{userProfile ? formatTokenAmount(userProfile.totalTokensBought - userProfile.totalTokensClaimed) : "0"}</span></p>
          <p className="text-gray-200 text-lg">Claimed: <span className="font-bold text-yellow-300">{userProfile ? formatTokenAmount(userProfile.totalTokensClaimed) : "0"}</span></p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="relative bg-black md:bg-black/60 md:backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-yellow-400/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center">
            <UserIcon className="w-7 h-7 text-yellow-400 mr-3" />
            <h3 className="text-2xl font-semibold text-yellow-400">Transaction History</h3>
          </div>
          {/* Search/filter bar */}
          <div className="flex items-center bg-black/40 border border-yellow-400/10 rounded-lg px-3 py-1">
            <ArrowPathIcon className="w-5 h-5 text-yellow-400 mr-2" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-yellow-200 placeholder-yellow-200/60 w-40 md:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full rounded-xl overflow-hidden text-sm md:text-base">
            <thead>
              <tr className="text-left bg-yellow-400/5">
                <th className="pb-3 text-yellow-400 font-semibold">Date</th>
                <th className="pb-3 text-yellow-400 font-semibold">Type</th>
                <th className="pb-3 text-yellow-400 font-semibold">Amount</th>
                <th className="pb-3 text-yellow-400 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-400"></div>
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">No transactions found.</td>
                </tr>
              ) : (
                filteredTxs.map((tx, index) => (
                  <tr
                    key={index}
                    className={`transition-colors animate-fade-in ${index % 2 === 0 ? "bg-white/5" : "bg-black/10"} hover:bg-yellow-400/5`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td className="py-4 text-gray-200 font-medium whitespace-nowrap">{tx.date}</td>
                    <td className="py-4 text-gray-200 flex items-center gap-2 whitespace-nowrap">
                      {tx.type === "Purchase" ? (
                        <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <KeyIcon className="w-5 h-5 text-yellow-400" />
                      )}
                      {tx.type}
                    </td>
                    <td className="py-4 text-gray-200 whitespace-nowrap">{tx.amount}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tx.status === "Completed" ? "bg-green-400/20 text-green-400 border-green-400/30 animate-bounce-in" : "bg-yellow-400/20 text-yellow-400 border-yellow-400/30 animate-pulse"}`}>
                        {tx.status === "Completed" ? <CheckCircleIcon className="w-4 h-4 inline mr-1" /> : null}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        .animate-shimmer {
          background-size: 400px 100%;
          animation: shimmer 2.5s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes bounce-in {
          0% { transform: scale(0.7); opacity: 0.5; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Profile;
