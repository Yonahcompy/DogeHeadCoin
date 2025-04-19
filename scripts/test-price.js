require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const contractAddress = "0xCAfAFBa2d0754a5a29138d603E43921bb4631729";
  const DogeHeadPaymentBridge = await hre.ethers.getContractFactory("DogeHeadPaymentBridge");
  const contract = await DogeHeadPaymentBridge.attach(contractAddress);

  // Get current BNB price (8 decimals)
  const bnbPrice = await contract.getLatestBNBPrice();
  console.log(`Current BNB Price (8 decimals): ${bnbPrice}`);
  
  // Get current stage info
  const currentStage = await contract.getCurrentStage();
  console.log('\nCurrent Stage Info:');
  console.log(`Available Tokens: ${currentStage.availableTokens}`);
  console.log(`Tokens Sold: ${currentStage.tokensSold}`);
  console.log(`Price in USD (8 decimals): ${currentStage.priceInUSD}`);
  console.log(`Is Active: ${currentStage.isActive}`);
  
  // Test with $1184.32 USD (8 decimals precision)
  const usdAmount = 1184.32 * 1e8; // Convert to 8 decimals
  
  console.log("\nCalculating BNB amount for $1184.32...");
  console.log(`USD Amount (8 decimals): ${usdAmount}`);
  
  // Get BNB amount in wei
  const bnbAmount = await contract.calculateBNBAmount(usdAmount);
  console.log(`BNB Amount (wei): ${bnbAmount}`);
  
  // Get total raised in wei
  const totalRaised = await contract.totalRaised();
  console.log(`\nTotal Raised (wei): ${totalRaised}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 