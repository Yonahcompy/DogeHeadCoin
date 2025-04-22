const hre = require("hardhat");

async function main() {
  console.log("Deploying BaseHeadPaymentBridge to Sepolia network...");

  // ETH/USD Price Feed address for Sepolia
  // Source: https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1#sepolia-testnet
  const ETH_USD_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  
  // You should replace this with your actual treasury wallet address
  const TREASURY_WALLET = "REPLACE_WITH_YOUR_TREASURY_WALLET";

  // Deploy the contract
  const BaseHeadPaymentBridge = await hre.ethers.getContractFactory("BaseHeadPaymentBridge");
  const bridge = await BaseHeadPaymentBridge.deploy(
    TREASURY_WALLET,
    ETH_USD_PRICE_FEED
  );

  await bridge.waitForDeployment();
  const address = await bridge.getAddress();

  console.log(`BaseHeadPaymentBridge deployed to: ${address}`);
  console.log("Contract deployment completed!");

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await bridge.deploymentTransaction().wait(5);

  // Verify the contract
  console.log("Verifying contract on Etherscan...");
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