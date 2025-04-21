require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
    // Contract address - replace with your deployed contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("Please set CONTRACT_ADDRESS in your .env file");
    }

    // Get the contract instance
    const DogeHeadPaymentBridge = await hre.ethers.getContractFactory("DogeHeadPaymentBridge");
    const contract = DogeHeadPaymentBridge.attach(contractAddress);

    // Example purchase parameters
    const dollarAmount = 100; // $100 USD
    const solanaWallet = "YOUR_SOLANA_WALLET_ADDRESS"; // Replace with actual Solana wallet address

    // Get the required BNB amount for the purchase
    const requiredBNB = await contract.getQuote(dollarAmount);
    console.log(`Required BNB for $${dollarAmount}: ${hre.ethers.formatEther(requiredBNB)} BNB`);

    // Make the purchase
    console.log("Sending transaction...");
    const tx = await contract.purchaseWithUSDAmount(dollarAmount, solanaWallet, {
        value: requiredBNB
    });

    console.log("Waiting for transaction to be mined...");
    const receipt = await tx.wait();

    console.log("Purchase successful!");
    console.log(`Transaction hash: ${receipt.hash}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    // Get transaction details
    const events = receipt.logs.map(log => {
        try {
            return contract.interface.parseLog(log);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);

    const paymentEvent = events.find(event => event.name === "PaymentReceived");
    if (paymentEvent) {
        console.log("\nPayment details:");
        console.log(`Solana wallet: ${paymentEvent.args.solanaWallet}`);
        console.log(`BNB amount: ${hre.ethers.formatEther(paymentEvent.args.bnbAmount)} BNB`);
        console.log(`USD amount: $${paymentEvent.args.usdAmount / 1e8}`);
        console.log(`Timestamp: ${new Date(Number(paymentEvent.args.timestamp) * 1000).toLocaleString()}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 