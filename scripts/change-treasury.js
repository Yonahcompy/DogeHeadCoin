require("dotenv").config();
const hre = require("hardhat");

async function main() {
  // Contract address from the deployment
  const contractAddress = "0xCAfAFBa2d0754a5a29138d603E43921bb4631729";
  
  // New treasury wallet address
  const newTreasuryWallet = "0x1c8BD39aAA7Db8B3D2491fb18D033EDF8D0756f2"; // Replace with your desired address
  
  console.log(`Changing treasury wallet for contract at ${contractAddress}`);
  console.log(`New treasury wallet: ${newTreasuryWallet}`);
  
  // Get the contract
  const DogeHeadPaymentBridge = await hre.ethers.getContractFactory("DogeHeadPaymentBridge");
  const contract = await DogeHeadPaymentBridge.attach(contractAddress);
  
  // Get the current treasury wallet
  const currentTreasuryWallet = await contract.treasuryWallet();
  console.log(`Current treasury wallet: ${currentTreasuryWallet}`);
  
  // Change the treasury wallet
  console.log("Sending transaction to change treasury wallet...");
  const tx = await contract.changeTreasuryWallet(newTreasuryWallet);
  
  console.log("Transaction sent. Waiting for confirmation...");
  const receipt = await tx.wait();
  
  console.log(`Transaction confirmed! Hash: ${receipt.hash}`);
  
  // Verify the change
  const updatedTreasuryWallet = await contract.treasuryWallet();
  console.log(`Updated treasury wallet: ${updatedTreasuryWallet}`);
  
  if (updatedTreasuryWallet.toLowerCase() === newTreasuryWallet.toLowerCase()) {
    console.log("Treasury wallet successfully changed!");
  } else {
    console.log("Error: Treasury wallet was not updated correctly.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 