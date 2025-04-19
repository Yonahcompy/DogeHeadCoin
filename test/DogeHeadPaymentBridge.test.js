const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DogeHeadPaymentBridge", function () {
  let DogeHeadPaymentBridge;
  let dogeHeadBridge;
  let owner;
  let admin;
  let treasury;
  let buyer;
  let referrer;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, admin, treasury, buyer, referrer, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    DogeHeadPaymentBridge = await ethers.getContractFactory("DogeHeadPaymentBridge");
    dogeHeadBridge = await DogeHeadPaymentBridge.deploy(500, treasury.address); // 5% referral reward
    await dogeHeadBridge.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await dogeHeadBridge.admin()).to.equal(owner.address);
    });

    it("Should set the right treasury wallet", async function () {
      expect(await dogeHeadBridge.treasuryWallet()).to.equal(treasury.address);
    });

    it("Should set the right referral reward percentage", async function () {
      expect(await dogeHeadBridge.referralRewardBps()).to.equal(500);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to change admin", async function () {
      await dogeHeadBridge.changeAdmin(admin.address);
      expect(await dogeHeadBridge.admin()).to.equal(admin.address);
    });

    it("Should allow admin to change treasury wallet", async function () {
      await dogeHeadBridge.changeTreasuryWallet(addr1.address);
      expect(await dogeHeadBridge.treasuryWallet()).to.equal(addr1.address);
    });

    it("Should not allow non-admin to change admin", async function () {
      await expect(
        dogeHeadBridge.connect(buyer).changeAdmin(admin.address)
      ).to.be.revertedWith("Caller is not the admin");
    });

    it("Should not allow non-admin to change treasury wallet", async function () {
      await expect(
        dogeHeadBridge.connect(buyer).changeTreasuryWallet(addr1.address)
      ).to.be.revertedWith("Caller is not the admin");
    });
  });

  describe("Payments", function () {
    it("Should accept payments and update total raised", async function () {
      const paymentAmount = ethers.parseEther("1.0");
      await dogeHeadBridge.connect(buyer).processPayment("", { value: paymentAmount });
      expect(await dogeHeadBridge.totalRaised()).to.equal(paymentAmount);
    });

    it("Should store transaction details", async function () {
      const paymentAmount = ethers.parseEther("1.0");
      await dogeHeadBridge.connect(buyer).processPayment("", { value: paymentAmount });
      const transactions = await dogeHeadBridge.getBuyerTransactions(buyer.address);
      expect(transactions[0].buyer).to.equal(buyer.address);
      expect(transactions[0].paymentAmount).to.equal(paymentAmount);
    });
  });

  describe("Referral System", function () {
    it("Should allow users to register referral codes", async function () {
      await dogeHeadBridge.connect(referrer).registerReferralCode("REF123");
      expect(await dogeHeadBridge.referralOwners("REF123")).to.equal(referrer.address);
    });

    it("Should not allow duplicate referral codes", async function () {
      await dogeHeadBridge.connect(referrer).registerReferralCode("REF123");
      await expect(
        dogeHeadBridge.connect(addr1).registerReferralCode("REF123")
      ).to.be.revertedWith("Referral code already exists");
    });

    it("Should process referral rewards correctly", async function () {
      // Register referral code
      await dogeHeadBridge.connect(referrer).registerReferralCode("REF123");
      
      // Make a payment with referral
      const paymentAmount = ethers.parseEther("1.0");
      await dogeHeadBridge.connect(buyer).processPayment("REF123", { value: paymentAmount });
      
      // Check referral rewards (5% of payment)
      const expectedReward = paymentAmount * BigInt(500) / BigInt(10000);
      expect(await dogeHeadBridge.referralRewards("REF123")).to.equal(expectedReward);
    });

    it("Should allow claiming referral rewards", async function () {
      // Register referral code and make payment
      await dogeHeadBridge.connect(referrer).registerReferralCode("REF123");
      const paymentAmount = ethers.parseEther("1.0");
      await dogeHeadBridge.connect(buyer).processPayment("REF123", { value: paymentAmount });
      
      // Get initial balance
      const initialBalance = await ethers.provider.getBalance(referrer.address);

      console.log("-----initialBalance",initialBalance)
      
      // Claim rewards
      const tx = await dogeHeadBridge.connect(referrer).claimReferralRewards("REF123");
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      // Check final balance and rewards
      const expectedReward = paymentAmount * BigInt(500) / BigInt(10000);
      const finalBalance = await ethers.provider.getBalance(referrer.address);
      expect(finalBalance + gasCost - initialBalance).to.equal(expectedReward);
      expect(await dogeHeadBridge.referralRewards("REF123")).to.equal(0);
    });
  });

  describe("Withdrawal", function () {
    it("Should allow admin to withdraw funds to treasury", async function () {
      // Make a payment
      const paymentAmount = ethers.parseEther("1.0");
      await dogeHeadBridge.connect(buyer).processPayment("", { value: paymentAmount });
      
      // Get initial treasury balance
      const initialTreasuryBalance = await ethers.provider.getBalance(treasury.address);
      
      // Withdraw funds
      await dogeHeadBridge.withdraw();
      
      // Check final treasury balance
      const finalTreasuryBalance = await ethers.provider.getBalance(treasury.address);
      expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(paymentAmount);
    });

    it("Should not allow non-admin to withdraw funds", async function () {
      // Make a payment
      const paymentAmount = ethers.parseEther("1.0");
      await dogeHeadBridge.connect(buyer).processPayment("", { value: paymentAmount });
      
      // Try to withdraw as non-admin
      await expect(
        dogeHeadBridge.connect(buyer).withdraw()
      ).to.be.revertedWith("Caller is not the admin");
    });
  });
}); 