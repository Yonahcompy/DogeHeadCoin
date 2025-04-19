const hre = require("hardhat");

async function main() {
  console.log("Deploying DogeHeadPaymentBridge contract...");

  // Get the contract factory
  const DogeHeadPaymentBridge = await hre.ethers.getContractFactory("DogeHeadPaymentBridge");

  // Initial parameters
  const referralRewardBps = 500; // 5% referral reward
  const treasuryWallet = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"; // Your provided treasury wallet

  // Deploy the contract
  const contract = await DogeHeadPaymentBridge.deploy(referralRewardBps, treasuryWallet);

  // Wait for deployment to finish
  await contract.waitForDeployment();

  console.log("DogeHeadPaymentBridge deployed to:", await contract.getAddress());

  // Wait for 6 block confirmations
  console.log("Waiting for 6 block confirmations...");
  await contract.deploymentTransaction().wait(6);

  // Verify the contract
  console.log("Verifying contract on BscScan...");
  try {
    await hre.run("verify:verify", {
      address: await contract.getAddress(),
      constructorArguments: [referralRewardBps, treasuryWallet],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 