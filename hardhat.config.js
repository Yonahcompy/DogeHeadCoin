require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532  // Base Sepolia chain ID
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL,
      chainId: parseInt(process.env.BSC_TESTNET_CHAIN_ID),
      accounts: [process.env.PRIVATE_KEY]
    },
    bsc: {
      url: process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 56
    },
    baseMainnet: {
      url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      baseMainnet: process.env.BASESCAN_API_KEY,
    },
    // customChains: [
    //   {
    //     network: "baseSepolia",
    //     chainId: 84532,
    //     urls: {
    //       apiURL: "https://api-sepolia.basescan.org/api",
    //       browserURL: "https://sepolia.basescan.org"
    //     }
    //   }
    // ]
  }
}; 