const hre = require("hardhat");

async function main() {
  console.log("Deploying BaseEthDogeHeadPayment to Base network...");

  // Price feed address for ETH/USD on Base
  const ETH_USD_PRICE_FEED = "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";
  
  // You should replace this with your actual treasury wallet address
  const TREASURY_WALLET = "0x1c8BD39aAA7Db8B3D2491fb18D033EDF8D0756f2";

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
  console.log("Verifying contract on Basescan...");
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