const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DogeHeadPaymentBridge", function () {
  let DogeHeadPaymentBridge;
  let contract;
  let owner;
  let admin;
  let treasury;
  let buyer;
  let mockPriceFeed;

  const PRICE_FEED_DECIMALS = 8;
  const BNB_PRICE = 300n * BigInt(10 ** PRICE_FEED_DECIMALS); // $300 per BNB

  beforeEach(async function () {
    // Get signers
    [owner, admin, treasury, buyer] = await ethers.getSigners();

    // Deploy mock price feed
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockPriceFeed = await MockV3Aggregator.deploy(PRICE_FEED_DECIMALS, BNB_PRICE);

    // Deploy payment bridge
    DogeHeadPaymentBridge = await ethers.getContractFactory("DogeHeadPaymentBridge");
    contract = await DogeHeadPaymentBridge.deploy(
      treasury.address,
      await mockPriceFeed.getAddress()
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should set the right treasury wallet", async function () {
      expect(await contract.treasuryWallet()).to.equal(treasury.address);
    });

    it("Should set the right price feed", async function () {
      expect(await contract.bnbUsdPriceFeed()).to.equal(await mockPriceFeed.getAddress());
    });

    it("Should set the right admin", async function () {
      expect(await contract.admin()).to.equal(owner.address);
    });
  });

  describe("Admin functions", function () {
    it("Should allow admin to change treasury wallet", async function () {
      await contract.changeTreasuryWallet(buyer.address);
      expect(await contract.treasuryWallet()).to.equal(buyer.address);
    });

    it("Should allow admin to change price feed", async function () {
      const newMockPriceFeed = await (await ethers.getContractFactory("MockV3Aggregator")).deploy(PRICE_FEED_DECIMALS, BNB_PRICE);
      await contract.updatePriceFeed(await newMockPriceFeed.getAddress());
      expect(await contract.bnbUsdPriceFeed()).to.equal(await newMockPriceFeed.getAddress());
    });

    it("Should allow admin to change admin", async function () {
      await contract.changeAdmin(admin.address);
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("Should not allow non-admin to change treasury wallet", async function () {
      await expect(
        contract.connect(buyer).changeTreasuryWallet(buyer.address)
      ).to.be.revertedWith("Caller is not the admin");
    });
  });

  describe("Price calculations", function () {
    it("Should correctly convert dollar amount to internal format", async function () {
      const dollarAmount = 100n;
      const expected = dollarAmount * BigInt(10 ** PRICE_FEED_DECIMALS);
      expect(await contract.convertDollarToInternal(dollarAmount)).to.equal(expected);
    });

    it("Should correctly calculate BNB amount for USD", async function () {
      const dollarAmount = 300n;
      const usdAmount = dollarAmount * BigInt(10 ** PRICE_FEED_DECIMALS);
      const expectedBNB = ethers.parseEther("1"); // At $300/BNB, $300 = 1 BNB
      expect(await contract.calculateBNBAmount(usdAmount)).to.equal(expectedBNB);
    });

    it("Should get latest BNB price", async function () {
      expect(await contract.getLatestBNBPrice()).to.equal(BNB_PRICE);
    });
  });

  describe("Purchases", function () {
    const solanaWallet = "DH1LJYbRBhvpzqRKs1zAVQUxgcwZtXxtRF9YsZnKuZoX";
    const dollarAmount = 100n;

    it("Should process purchase correctly", async function () {
      const requiredBNB = await contract.getQuote(dollarAmount);
      
      await expect(
        contract.connect(buyer).purchaseWithUSDAmount(dollarAmount, solanaWallet, {
          value: requiredBNB
        })
      ).to.emit(contract, "PaymentReceived")
        .withArgs(
          solanaWallet,
          buyer.address,
          requiredBNB,
          dollarAmount * BigInt(10 ** PRICE_FEED_DECIMALS),
          await ethers.provider.getBlock("latest").then(b => b.timestamp)
        );

      // Check treasury received the BNB
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceBefore).to.equal(requiredBNB);
    });

    it("Should fail if insufficient BNB sent", async function () {
      const requiredBNB = await contract.getQuote(dollarAmount);
      const insufficientBNB = requiredBNB - 1n;
      
      await expect(
        contract.connect(buyer).purchaseWithUSDAmount(dollarAmount, solanaWallet, {
          value: insufficientBNB
        })
      ).to.be.revertedWith("Insufficient BNB sent");
    });

    it("Should fail if invalid Solana wallet", async function () {
      const requiredBNB = await contract.getQuote(dollarAmount);
      
      await expect(
        contract.connect(buyer).purchaseWithUSDAmount(dollarAmount, "", {
          value: requiredBNB
        })
      ).to.be.revertedWith("Invalid Solana wallet");
    });

    it("Should record transaction history", async function () {
      const requiredBNB = await contract.getQuote(dollarAmount);
      
      await contract.connect(buyer).purchaseWithUSDAmount(dollarAmount, solanaWallet, {
        value: requiredBNB
      });

      const transactions = await contract.getTransactionsBySolanaWallet(solanaWallet);
      expect(transactions.length).to.equal(1);
      expect(transactions[0].solanaWallet).to.equal(solanaWallet);
      expect(transactions[0].payer).to.equal(buyer.address);
      expect(transactions[0].paymentAmount).to.equal(requiredBNB);
    });
  });

  describe("Emergency functions", function () {
    it("Should allow owner to withdraw funds", async function () {
      // First make a purchase to get funds in the contract
      const dollarAmount = 100n;
      const solanaWallet = "DH1LJYbRBhvpzqRKs1zAVQUxgcwZtXxtRF9YsZnKuZoX";
      const requiredBNB = await contract.getQuote(dollarAmount);
      
      await contract.connect(buyer).purchaseWithUSDAmount(dollarAmount, solanaWallet, {
        value: requiredBNB
      });

      // Now try emergency withdrawal
      const recipientBalanceBefore = await ethers.provider.getBalance(admin.address);
      await contract.emergencyWithdraw(admin.address);
      const recipientBalanceAfter = await ethers.provider.getBalance(admin.address);

      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(requiredBNB);
    });

    it("Should not allow non-owner to withdraw funds", async function () {
      await expect(
        contract.connect(buyer).emergencyWithdraw(buyer.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 