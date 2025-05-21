const hre = require("hardhat");

async function main() {
  console.log("Deploying BaseEthDogeHeadPayment to Base Sepolia network...");

  // Get deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // ETH/USD Price Feed address for Base
  const ETH_USD_PRICE_FEED = "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";
  
  // Use deployer's address as treasury wallet
  const TREASURY_WALLET = deployer.address;
  console.log("Treasury wallet:", TREASURY_WALLET);

  // Deploy the contract
  const BaseEthDogeHeadPayment = await hre.ethers.getContractFactory("BaseEthDogeHeadPayment");
  const bridge = await BaseEthDogeHeadPayment.deploy(
    TREASURY_WALLET,
    ETH_USD_PRICE_FEED
  );

  await bridge.waitForDeployment();
  const address = await bridge.getAddress();

  console.log(`BaseEthDogeHeadPayment deployed to: ${address}`);
  console.log("Contract deployment completed!");

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await bridge.deploymentTransaction().wait(5);

  // Verify the contract
  console.log("Verifying contract on Base Sepolia Explorer...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [
        TREASURY_WALLET,
        ETH_USD_PRICE_FEED
      ],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.log("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 