const hre = require("hardhat");

async function main() {
  console.log("Deploying BaseHeadPaymentBridge to Base Mainnet...");

  // Get deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // ETH/USD Price Feed address for Base Mainnet
  const ETH_USD_PRICE_FEED = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";

  // Use deployer's address as treasury wallet
  const TREASURY_WALLET = deployer.address;
  console.log("Treasury wallet:", TREASURY_WALLET);

  // Mainnet deployment safety check
  console.log("\n⚠️  MAINNET DEPLOYMENT WARNING ⚠️");
  console.log("Please verify the following before proceeding:");
  console.log("1. Treasury wallet address is correct:", TREASURY_WALLET);
  console.log("2. Price feed address is correct:", ETH_USD_PRICE_FEED);
  console.log("3. You have sufficient ETH for deployment");
  console.log("4. You are on the correct network (Base Mainnet)");
  console.log("5. Your private key is correct and secure");
  console.log("\nPress Ctrl+C now if you need to verify these details...");

  // Wait 10 seconds to allow for cancellation
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Deploy the contract
  const BaseHeadPaymentBridge = await hre.ethers.getContractFactory(
    "BaseHeadPaymentBridge"
  );
  const bridge = await BaseHeadPaymentBridge.deploy(
    TREASURY_WALLET,
    ETH_USD_PRICE_FEED
  );

  await bridge.waitForDeployment();
  const address = await bridge.getAddress();

  console.log(`BaseHeadPaymentBridge deployed to: ${address}`);
  console.log("Contract deployment completed!");

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await bridge.deploymentTransaction().wait(5);

  // Verify the contract
  console.log("Verifying contract on BaseScan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [TREASURY_WALLET, ETH_USD_PRICE_FEED],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error);
    }
  }

  // Print deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: Base Mainnet`);
  console.log(`Contract Address: ${address}`);
  console.log(`Treasury Wallet: ${TREASURY_WALLET}`);
  console.log(`Price Feed: ${ETH_USD_PRICE_FEED}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("========================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
