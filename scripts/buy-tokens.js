require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
    // Get contract address from command line arguments or use default
    const args = process.argv.slice(2);
    const contractAddress = args[0] || "0xCAfAFBa2d0754a5a29138d603E43921bb4631729";

    // Solana wallet address where tokens will be distributed
    const solanaWallet = "AyWCnEbpDdVdsweK6MfnML5FpTLQpXAzSin7b7DJnwq3"; // Replace with your Solana wallet

    // Optional referrer address (set to zero address if no referrer)
    const referrer = "0x0000000000000000000000000000000000000000"; // Replace with referrer address or keep as zero address

    // Amount in USD that the user wants to spend (in USD, not cents)
    const usdAmount = "0.01"; // $0.01 USD

    console.log(`Buying tokens from contract at ${contractAddress}`);
    console.log(`Solana Wallet: ${solanaWallet}`);
    console.log(`Referrer: ${referrer}`);
    console.log(`USD Amount: $${usdAmount}`);

    // Get the contract
    const DogeHeadPaymentBridge = await hre.ethers.getContractFactory("DogeHeadPaymentBridge");
    const contract = await DogeHeadPaymentBridge.attach(contractAddress);

    // Get current stage info before purchase
    const currentStageBefore = await contract.getCurrentStage();
    console.log("\nCurrent Stage Info (Before Purchase):");
    console.log(`Stage Number: ${await contract.currentStage()}`);
    console.log(`Available Tokens: ${currentStageBefore.availableTokens}`);
    console.log(`Tokens Sold: ${currentStageBefore.tokensSold}`);
    console.log(`Price in USD (8 decimals): ${currentStageBefore.priceInUSD}`);

    // Get BNB price
    const bnbPrice = await contract.getLatestBNBPrice();
    console.log(`\nCurrent BNB Price (8 decimals): ${bnbPrice}`);

    // Convert USD amount to 8 decimals (same as priceInUSD)
    const usdAmountWithDecimals = BigInt(Math.floor(parseFloat(usdAmount) * 1e8));

    // Calculate BNB amount using the contract's function
    const bnbAmountWei = await contract.calculateBNBFromUSD(usdAmountWithDecimals);
    const bnbAmount = ethers.formatEther(bnbAmountWei);

    console.log(`\nBNB Amount to send: ${bnbAmount} BNB (${bnbAmountWei} wei)`);

    // Calculate expected tokens (USD amount / token price)
    const expectedTokens = usdAmountWithDecimals / BigInt(currentStageBefore.priceInUSD);
    console.log(`Expected Token Amount: ${expectedTokens}`);

    // Make the purchase
    console.log("\nSending transaction to buy tokens...");
    const tx = await contract.purchaseWithUSDAmount(
        usdAmountWithDecimals,
        solanaWallet,
        referrer,
        {
            value: bnbAmountWei
        }
    );

    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log(`Transaction confirmed! Hash: ${receipt.hash}`);

    // Get updated stage info after purchase
    const currentStageAfter = await contract.getCurrentStage();
    console.log("\nCurrent Stage Info (After Purchase):");
    console.log(`Stage Number: ${await contract.currentStage()}`);
    console.log(`Available Tokens: ${currentStageAfter.availableTokens}`);
    console.log(`Tokens Sold: ${currentStageAfter.tokensSold}`);

    // Get transaction details
    const transactions = await contract.getTransactionsBySolanaWallet(solanaWallet);
    const latestTransaction = transactions[transactions.length - 1];

    console.log("\nTransaction Details:");
    console.log(`Solana Wallet: ${latestTransaction.solanaWallet}`);
    console.log(`Payer: ${latestTransaction.payer}`);
    console.log(`Payment Amount: ${latestTransaction.paymentAmount} wei`);
    console.log(`Token Amount: ${latestTransaction.tokenAmount}`);
    console.log(`Timestamp: ${new Date(latestTransaction.timestamp * 1000).toLocaleString()}`);
    console.log(`Referrer: ${latestTransaction.referrer}`);
    console.log(`Used Referral: ${latestTransaction.usedReferral}`);
    console.log(`Stage: ${latestTransaction.stage}`);

    // Check if referral reward was generated
    if (referrer !== "0x0000000000000000000000000000000000000000") {
        const referralReward = await contract.referralRewards(referrer);
        console.log(`\nReferral Reward: ${referralReward} wei`);
    }

    console.log("\nPurchase completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 