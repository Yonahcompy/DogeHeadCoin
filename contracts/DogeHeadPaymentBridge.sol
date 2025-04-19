// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { AggregatorV3Interface } from "./interfaces/AggregatorV3Interface.sol";

/**
 * @title DogeHeadPaymentBridge
 * @notice Handles BNB payments for DogeHead presale and records Solana wallet addresses
 */
contract DogeHeadPaymentBridge is Ownable {
    using Address for address payable;

    /// @notice Struct to store stage information
    struct Stage {
        uint256 availableTokens;    // Number of tokens available in this stage
        uint256 tokensSold;         // Number of tokens sold in this stage
        uint256 priceInUSD;         // Price per token in USD (with 8 decimals)
        bool isActive;              // Whether this stage is active
    }

    /// @notice Struct to store transaction details
    struct Transaction {
        string solanaWallet;     // Solana wallet address where tokens will be distributed
        address payer;           // BSC address that made the payment
        uint256 paymentAmount;   // Amount paid in BNB (wei)
        uint256 tokenAmount;     // Amount of tokens to be distributed
        uint256 usdAmount;       // USD value of the purchase (with 8 decimals)
        uint256 timestamp;       // Transaction timestamp
        address referrer;        // Address of the referrer (if any)
        bool usedReferral;       // Whether a referral was used for this purchase
        uint8 stage;             // Stage number when purchase was made
    }

    /// @notice Address of the treasury wallet
    address public treasuryWallet;
    
    /// @notice Address of the admin
    address public admin;
    
    /// @notice Current active stage number (1-5)
    uint8 public currentStage;
    
    /// @notice Total number of stages
    uint8 public constant TOTAL_STAGES = 5;
    
    /// @notice Mapping of stage number to stage info
    mapping(uint8 => Stage) public stages;
    
    /// @notice Chainlink BNB/USD price feed
    AggregatorV3Interface public bnbUsdPriceFeed;
    
    /// @notice Mapping to store transactions by Solana wallet address
    mapping(string => Transaction[]) public solanaWalletTransactions;
    
    /// @notice Mapping to store referral rewards
    mapping(address => uint256) public referralRewards;
    
    /// @notice Total amount raised in BNB (wei)
    uint256 public totalRaised;
    
    /// @notice Referral reward percentage (in basis points, 1% = 100)
    uint256 public referralRewardBps;

    /// @notice Number of decimals in the price feed
    uint8 public constant PRICE_FEED_DECIMALS = 8;
    
    /// @notice Number of decimals for tokens
    uint8 public constant TOKEN_DECIMALS = 18;
    
    /// @notice Event emitted when admin is changed
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    
    /// @notice Event emitted when treasury wallet is changed
    event TreasuryWalletChanged(address indexed previousTreasury, address indexed newTreasury);
    
    /// @notice Event emitted when stage changes
    event StageChanged(uint8 indexed previousStage, uint8 indexed newStage);
    
    /// @notice Event emitted when price feed is updated
    event PriceFeedUpdated(address indexed oldFeed, address indexed newFeed);
    
    /// @notice Event emitted when a payment is received
    event PaymentReceived(
        string solanaWallet,
        address indexed payer,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 usdAmount,
        address indexed referrer,
        uint256 timestamp
    );
    
    /// @notice Event emitted when referral rewards are claimed
    event ReferralRewardsClaimed(
        address indexed referrer,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Event emitted when a cross-chain purchase is made
    event CrossChainPurchase(
        string solanaWallet,
        address payer,
        uint256 paymentAmount,
        uint256 tokenAmount,
        uint256 usdAmount,
        address referrer,
        uint256 timestamp,
        uint8 stage
    );

    /**
     * @notice Constructor
     * @param _referralRewardBps Referral reward percentage in basis points
     * @param _treasuryWallet Initial treasury wallet address
     * @param _bnbUsdPriceFeed Address of the BNB/USD price feed
     */
    constructor(
        uint256 _referralRewardBps,
        address _treasuryWallet,
        address _bnbUsdPriceFeed
    ) Ownable(msg.sender) {
        require(_referralRewardBps <= 1000, "Referral reward cannot exceed 10%");
        require(_treasuryWallet != address(0), "Invalid treasury wallet address");
        require(_bnbUsdPriceFeed != address(0), "Invalid price feed address");
        
        referralRewardBps = _referralRewardBps;
        treasuryWallet = _treasuryWallet;
        admin = msg.sender;
        bnbUsdPriceFeed = AggregatorV3Interface(_bnbUsdPriceFeed);
        currentStage = 1;
        
        // Initialize stages with their respective token amounts and USD prices
        // Stage 1: 750M tokens at $0.0001
        stages[1] = Stage({
            availableTokens: 750_000_000 * 10**TOKEN_DECIMALS,
            tokensSold: 0,
            priceInUSD: 10_000,  // $0.0001 with 8 decimals (0.0001 * 1e8)
            isActive: true
        });
        
        // Stage 2: 600M tokens at $0.00033
        stages[2] = Stage({
            availableTokens: 600_000_000 * 10**TOKEN_DECIMALS,
            tokensSold: 0,
            priceInUSD: 33_000,  // $0.00033 with 8 decimals
            isActive: false
        });
        
        // Stage 3: 450M tokens at $0.000957
        stages[3] = Stage({
            availableTokens: 450_000_000 * 10**TOKEN_DECIMALS,
            tokensSold: 0,
            priceInUSD: 95_700,  // $0.000957 with 8 decimals
            isActive: false
        });
        
        // Stage 4: 600M tokens at $0.00202
        stages[4] = Stage({
            availableTokens: 600_000_000 * 10**TOKEN_DECIMALS,
            tokensSold: 0,
            priceInUSD: 202_000,  // $0.00202 with 8 decimals
            isActive: false
        });
        
        // Stage 5: 600M tokens at $0.00313
        stages[5] = Stage({
            availableTokens: 600_000_000 * 10**TOKEN_DECIMALS,
            tokensSold: 0,
            priceInUSD: 313_000,  // $0.00313 with 8 decimals
            isActive: false
        });
    }

    /**
     * @notice Modifier to restrict function access to admin only
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    /**
     * @notice Change the admin address
     * @param _newAdmin Address of the new admin
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        address previousAdmin = admin;
        admin = _newAdmin;
        emit AdminChanged(previousAdmin, _newAdmin);
    }

    /**
     * @notice Change the treasury wallet address
     * @param _newTreasuryWallet Address of the new treasury wallet
     */
    function changeTreasuryWallet(address _newTreasuryWallet) external onlyAdmin {
        require(_newTreasuryWallet != address(0), "Invalid treasury wallet address");
        address previousTreasury = treasuryWallet;
        treasuryWallet = _newTreasuryWallet;
        emit TreasuryWalletChanged(previousTreasury, _newTreasuryWallet);
    }

    /**
     * @notice Update the BNB/USD price feed address
     * @param _newPriceFeed Address of the new price feed
     */
    function updatePriceFeed(address _newPriceFeed) external onlyAdmin {
        require(_newPriceFeed != address(0), "Invalid price feed address");
        address oldFeed = address(bnbUsdPriceFeed);
        bnbUsdPriceFeed = AggregatorV3Interface(_newPriceFeed);
        emit PriceFeedUpdated(oldFeed, _newPriceFeed);
    }

    /**
     * @notice Update referral reward percentage
     * @param _newRewardBps New referral reward percentage in basis points
     */
    function updateReferralReward(uint256 _newRewardBps) external onlyAdmin {
        require(_newRewardBps <= 1000, "Referral reward cannot exceed 10%");
        referralRewardBps = _newRewardBps;
    }

    /**
     * @notice Manual stage transition (in case automatic transition fails)
     * @param _newStage The new stage number to activate
     */
    function setStage(uint8 _newStage) external onlyAdmin {
        require(_newStage > 0 && _newStage <= TOTAL_STAGES, "Invalid stage number");
        require(_newStage != currentStage, "Already in this stage");
        
        stages[currentStage].isActive = false;
        uint8 previousStage = currentStage;
        currentStage = _newStage;
        stages[currentStage].isActive = true;
        
        emit StageChanged(previousStage, currentStage);
    }

    /**
     * @notice Get the latest BNB/USD price
     * @return Latest price with 8 decimals
     */
    function getLatestBNBPrice() public view returns (uint256) {
        (
            ,
            int256 price,
            ,
            uint256 timeStamp,
            
        ) = bnbUsdPriceFeed.latestRoundData();
        
        require(timeStamp > 0, "Round not complete");
        require(price > 0, "Invalid price");
        
        return uint256(price);
    }

    /**
     * @notice Calculate token amount for a given USD amount
     * @param usdAmount Amount in USD (with 8 decimals)
     * @return tokenAmount Amount of tokens (with 18 decimals)
     */
    function calculateTokensFromUSD(uint256 usdAmount) public view returns (uint256) {
        Stage storage stage = stages[currentStage];
        require(stage.isActive, "Current stage is not active");
        
        // Calculate token amount:
        // usdAmount (8 decimals) / tokenPrice (8 decimals) * 10^TOKEN_DECIMALS = token amount with TOKEN_DECIMALS
        return (usdAmount * 10**TOKEN_DECIMALS) / stage.priceInUSD;
    }

    /**
     * @notice Calculate required BNB amount for a given USD amount
     * @param usdAmount Amount in USD (with 8 decimals)
     * @return bnbAmount Amount in BNB (wei)
     */
    function calculateBNBFromUSD(uint256 usdAmount) public view returns (uint256) {
        // Get BNB price (8 decimals)
        uint256 bnbPrice = getLatestBNBPrice();
        
        // Calculate BNB amount:
        // usdAmount (8 decimals) * 10^18 / bnbPrice (8 decimals) = BNB amount in wei
        return (usdAmount * 1e18) / bnbPrice;
    }

    /**
     * @notice Process a payment with USD amount, Solana wallet address, and optional referrer
     * @param usdAmount Amount in USD (with 8 decimals)
     * @param _solanaWallet Solana wallet address where tokens will be distributed
     * @param _referrer Optional address of the referrer (set to address(0) for no referrer)
     */
    function purchaseWithUSDAmount(
        uint256 usdAmount,
        string calldata _solanaWallet,
        address _referrer
    ) external payable {
        require(usdAmount > 0, "USD amount must be greater than 0");
        require(bytes(_solanaWallet).length > 0, "Invalid Solana wallet address");
        require(_referrer != msg.sender, "Cannot refer yourself");
        
        Stage storage stage = stages[currentStage];
        require(stage.isActive, "Current stage is not active");
        
        // Calculate BNB required for the USD amount
        uint256 requiredBNB = calculateBNBFromUSD(usdAmount);
        require(msg.value >= requiredBNB, "Insufficient BNB sent");
        
        // Calculate token amount based on USD amount
        uint256 tokenAmount = calculateTokensFromUSD(usdAmount);
        require(tokenAmount > 0, "Invalid token amount");
        require(stage.tokensSold + tokenAmount <= stage.availableTokens, "Exceeds stage token limit");
        
        // Store transaction
        _recordTransaction(
            _solanaWallet,
            requiredBNB,
            tokenAmount,
            usdAmount,
            _referrer
        );
        
        // Update stage and total raised
        totalRaised += requiredBNB;
        stage.tokensSold += tokenAmount;
        
        // Check if current stage is complete
        _checkAndUpdateStage();
        
        // Process payment and referral
        _processPaymentAndReferral(requiredBNB, _referrer);
        
        // Return excess BNB if any
        uint256 excess = msg.value - requiredBNB;
        if (excess > 0) {
            payable(msg.sender).sendValue(excess);
        }
        
        emit PaymentReceived(_solanaWallet, msg.sender, requiredBNB, tokenAmount, usdAmount, _referrer, block.timestamp);
    }
    
    /**
     * @notice Internal function to record a transaction
     */
    function _recordTransaction(
        string memory _solanaWallet,
        uint256 _requiredBNB,
        uint256 _tokenAmount,
        uint256 _usdAmount,
        address _referrer
    ) internal {
        Transaction memory newTx = Transaction({
            solanaWallet: _solanaWallet,
            payer: msg.sender,
            paymentAmount: _requiredBNB,
            tokenAmount: _tokenAmount,
            usdAmount: _usdAmount,
            timestamp: block.timestamp,
            referrer: _referrer,
            usedReferral: _referrer != address(0),
            stage: currentStage
        });
        
        solanaWalletTransactions[_solanaWallet].push(newTx);
    }
    
    /**
     * @notice Internal function to check and update stage if needed
     */
    function _checkAndUpdateStage() internal {
        Stage storage stage = stages[currentStage];
        if (stage.tokensSold >= stage.availableTokens && currentStage < TOTAL_STAGES) {
            stages[currentStage].isActive = false;
            uint8 previousStage = currentStage;
            currentStage++;
            stages[currentStage].isActive = true;
            emit StageChanged(previousStage, currentStage);
        }
    }
    
    /**
     * @notice Internal function to process payment and referral
     */
    function _processPaymentAndReferral(uint256 _requiredBNB, address _referrer) internal {
        uint256 treasuryAmount = _requiredBNB;
        
        // Process referral if referrer is provided
        if (_referrer != address(0)) {
            uint256 reward = (_requiredBNB * referralRewardBps) / 10000;
            referralRewards[_referrer] += reward;
            treasuryAmount -= reward;  // Subtract reward from amount sent to treasury
        }
        
        // Transfer BNB to treasury (minus referral rewards)
        payable(treasuryWallet).sendValue(treasuryAmount);
    }

    /**
     * @notice Get required BNB amount for a purchase (for front-end use)
     * @param usdAmount Amount in USD (with 8 decimals)
     * @return requiredBNB Required BNB amount in wei
     * @return tokenAmount Token amount to be received
     */
    function getQuote(uint256 usdAmount) external view returns (uint256 requiredBNB, uint256 tokenAmount) {
        require(usdAmount > 0, "USD amount must be greater than 0");
        
        requiredBNB = calculateBNBFromUSD(usdAmount);
        tokenAmount = calculateTokensFromUSD(usdAmount);
        
        return (requiredBNB, tokenAmount);
    }

    /**
     * @notice Claim referral rewards
     */
    function claimReferralRewards() external {
        uint256 rewards = referralRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");
        
        // Reset rewards before transfer to prevent reentrancy
        referralRewards[msg.sender] = 0;
        
        // Transfer rewards
        (bool success, ) = payable(msg.sender).call{value: rewards}("");
        require(success, "Transfer failed");
        
        emit ReferralRewardsClaimed(msg.sender, rewards, block.timestamp);
    }

    /**
     * @notice Get all transactions for a Solana wallet
     * @param _solanaWallet The Solana wallet address
     * @return Array of transactions
     */
    function getTransactionsBySolanaWallet(string calldata _solanaWallet) external view returns (Transaction[] memory) {
        return solanaWalletTransactions[_solanaWallet];
    }

    /**
     * @notice Get current stage information
     * @return Stage information
     */
    function getCurrentStage() external view returns (Stage memory) {
        return stages[currentStage];
    }

    /**
     * @notice Get information for a specific stage
     * @param _stageNumber Stage number
     * @return Stage information
     */
    function getStage(uint8 _stageNumber) external view returns (Stage memory) {
        require(_stageNumber > 0 && _stageNumber <= TOTAL_STAGES, "Invalid stage number");
        return stages[_stageNumber];
    }

    /**
     * @notice Emergency withdrawal of funds (for contract recovery)
     * @param _to Address to send funds to
     */
    function emergencyWithdraw(address _to) external onlyOwner {
        require(_to != address(0), "Invalid address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(_to).sendValue(balance);
    }
}