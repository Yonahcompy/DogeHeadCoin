require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("Deploying DogeHeadPaymentBridge contract...");
  
  // Get the contract factory
  const DogeHeadPaymentBridge = await hre.ethers.getContractFactory("DogeHeadPaymentBridge");
  
  // BSC Testnet BNB/USD price feed address
  const bnbUsdPriceFeed = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
  
  // Use deployer's address as treasury wallet for testing
  const [deployer] = await hre.ethers.getSigners();
  const treasuryWallet = deployer.address;
  
  console.log("Deploying with the following parameters:");
  console.log(`- Treasury Wallet: ${treasuryWallet}`);
  console.log(`- Price Feed: ${bnbUsdPriceFeed}`);
  
  // Deploy the contract
  const contract = await DogeHeadPaymentBridge.deploy(
    treasuryWallet,
    bnbUsdPriceFeed
  );
  
  console.log("Contract deployment transaction sent...");
  console.log("Waiting for deployment transaction to be mined...");
  
  // Wait for deployment to finish
  const deploymentReceipt = await contract.deploymentTransaction().wait();
  console.log(`Deployment transaction hash: ${deploymentReceipt.hash}`);
  
  // Get the contract address
  const address = await contract.getAddress();
  console.log(`DogeHeadPaymentBridge deployed to: ${address}`);
  
  // Wait for 15 block confirmations before verifying
  console.log("Waiting for 15 block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 45000)); // Wait 45 seconds
  
  // Verify the contract
  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [
        treasuryWallet,
        bnbUsdPriceFeed
      ],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error);
    }
  }
  
  // Print instructions for using the contract
  console.log("\nContract deployment completed!");
  console.log("\nTo buy tokens, run:");
  console.log(`npx hardhat run scripts/buy-tokens.js --network bscTestnet`);
  console.log("\nMake sure to update the contract address in the buy-tokens.js script if needed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 