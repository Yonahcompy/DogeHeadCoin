require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("Deploying BscBnbDogeHeadCoin to BNB Mainnet...");

  // Get the contract factory
  const BscBnbDogeHeadCoin = await hre.ethers.getContractFactory(
    "BscBnbDogeHeadCoin"
  );

  // BNB Mainnet BNB/USD price feed address
  const bnbUsdPriceFeed = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";

  // Use deployer's address as treasury wallet
  const [deployer] = await hre.ethers.getSigners();
  const treasuryWallet = deployer.address;

  // Mainnet deployment safety check
  console.log("\n⚠️  MAINNET DEPLOYMENT WARNING ⚠️");
  console.log("Please verify the following before proceeding:");
  console.log("1. Treasury wallet address is correct:", treasuryWallet);
  console.log("2. Price feed address is correct:", bnbUsdPriceFeed);
  console.log("3. You have sufficient BNB for deployment");
  console.log("4. You are on the correct network (BNB Mainnet)");
  console.log("5. Your private key is correct and secure");
  console.log("\nPress Ctrl+C now if you need to verify these details...");

  // Wait 10 seconds to allow for cancellation
  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("\nDeploying with the following parameters:");
  console.log(`- Treasury Wallet: ${treasuryWallet}`);
  console.log(`- Price Feed: ${bnbUsdPriceFeed}`);

  // Deploy the contract
  const contract = await BscBnbDogeHeadCoin.deploy(
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
  console.log(`BscBnbDogeHeadCoin deployed to: ${address}`);

  // Wait for block confirmations before verifying
  console.log("Waiting for block confirmations...");
  await contract.deploymentTransaction().wait(5);

  // Verify the contract
  console.log("Verifying contract on BscScan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [treasuryWallet, bnbUsdPriceFeed],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error);
    }
  }

  // Print deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: BNB Mainnet`);
  console.log(`Contract Address: ${address}`);
  console.log(`Treasury Wallet: ${treasuryWallet}`);
  console.log(`Price Feed: ${bnbUsdPriceFeed}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("========================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
