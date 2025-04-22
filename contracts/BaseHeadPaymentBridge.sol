// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { AggregatorV3Interface } from "./interfaces/AggregatorV3Interface.sol";

/**
 * @title BaseHeadPaymentBridge
 * @notice Handles ETH payments for DogeHead presale on Base network and records Solana wallet addresses
 */
contract BaseHeadPaymentBridge is Ownable {
    using Address for address payable;

    /// @notice Struct to store transaction details
    struct Transaction {
        string solanaWallet;     // Solana wallet address where tokens will be distributed
        address payer;           // Base address that made the payment
        uint256 paymentAmount;   // Amount paid in ETH (wei)
        uint256 usdAmount;       // USD value of the purchase (with 8 decimals)
        uint256 timestamp;       // Transaction timestamp
    }

    /// @notice Address of the treasury wallet
    address public treasuryWallet;
    
    /// @notice Address of the admin
    address public admin;
    
    /// @notice Chainlink ETH/USD price feed
    AggregatorV3Interface private ethUsdPriceFeed;
    
    /// @notice Mapping to store transactions by Solana wallet address
    mapping(string => Transaction[]) private solanaWalletTransactions;
    
    /// @notice Total amount raised in ETH (wei)
    uint256 private totalRaisedETH;
    
    /// @notice Total amount raised in USD (with 8 decimals)
    uint256 private totalRaisedUSD;

    /// @notice Number of decimals in the price feed
    uint8 private constant PRICE_FEED_DECIMALS = 8;
    
    /// @notice Event emitted when admin is changed
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    
    /// @notice Event emitted when treasury wallet is changed
    event TreasuryWalletChanged(address indexed previousTreasury, address indexed newTreasury);
    
    /// @notice Event emitted when price feed is updated
    event PriceFeedUpdated(address indexed oldFeed, address indexed newFeed);
    
    /// @notice Event emitted when a payment is received
    event PaymentReceived(
        string solanaWallet,
        address indexed payer,
        uint256 ethAmount,
        uint256 usdAmount,
        uint256 timestamp
    );

    /**
     * @notice Constructor
     * @param _treasuryWallet Initial treasury wallet address
     * @param _ethUsdPriceFeed Address of the ETH/USD price feed on Base
     */
    constructor(
        address _treasuryWallet,
        address _ethUsdPriceFeed
    ) Ownable(msg.sender) {
        require(_treasuryWallet != address(0), "Invalid treasury wallet address");
        require(_ethUsdPriceFeed != address(0), "Invalid price feed address");
        
        treasuryWallet = _treasuryWallet;
        admin = msg.sender;
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
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
     * @notice Update the ETH/USD price feed address
     * @param _newPriceFeed Address of the new price feed
     */
    function updatePriceFeed(address _newPriceFeed) external onlyAdmin {
        require(_newPriceFeed != address(0), "Invalid price feed address");
        address oldFeed = address(ethUsdPriceFeed);
        ethUsdPriceFeed = AggregatorV3Interface(_newPriceFeed);
        emit PriceFeedUpdated(oldFeed, _newPriceFeed);
    }

    /**
     * @notice Calculate ETH amount needed for a given USD amount
     * @param dollarAmount Amount in whole dollars (e.g., 1 for $1.00)
     * @return ethAmount Amount of ETH needed (in wei)
     */
    function calculateETHAmount(uint256 dollarAmount) private view returns (uint256) {
        (
            ,
            int256 price,
            ,
            uint256 timeStamp,
            
        ) = ethUsdPriceFeed.latestRoundData();
        
        require(timeStamp > 0, "Round not complete");
        require(price > 0, "Invalid price");
        
        // Convert dollar amount to the same precision as ETH price (8 decimals)
        uint256 usdAmount = dollarAmount * 1e8;
        // Calculate ETH amount in wei (18 decimals)
        return (usdAmount * 1e18) / uint256(price);
    }

    /**
     * @notice Purchase tokens with USD amount
     * @param dollarAmount Amount in whole dollars without decimals (e.g., 5 for $5.00)
     * @param solanaWallet Solana wallet address where tokens will be distributed
     */
    function purchaseWithUSDAmount(
        uint256 dollarAmount,
        string calldata solanaWallet
    ) external payable {
        require(bytes(solanaWallet).length > 0, "Invalid Solana wallet");
        require(dollarAmount > 0, "Invalid dollar amount");
        
        // Calculate required ETH amount directly from dollar amount
        uint256 requiredETH = calculateETHAmount(dollarAmount);
        require(msg.value >= requiredETH, "Insufficient ETH sent");

        // Convert dollar amount to internal format (8 decimals)
        uint256 usdAmount = dollarAmount * 1e8;

        // Create transaction record
        Transaction memory newTx = Transaction({
            solanaWallet: solanaWallet,
            payer: msg.sender,
            paymentAmount: msg.value,
            usdAmount: usdAmount,
            timestamp: block.timestamp
        });

        // Update total raised
        totalRaisedETH += msg.value;
        totalRaisedUSD += usdAmount;

        // Store transaction
        solanaWalletTransactions[solanaWallet].push(newTx);

        // Transfer ETH to treasury
        payable(treasuryWallet).transfer(msg.value);

        // Emit event
        emit PaymentReceived(
            solanaWallet,
            msg.sender,
            msg.value,
            usdAmount,
            block.timestamp
        );
    }

    /**
     * @notice Get required ETH amount for a purchase (for front-end use)
     * @param dollarAmount Amount in whole dollars without decimals (e.g., 5 for $5.00)
     * @return requiredETH Required ETH amount in wei
     */
    function getQuote(uint256 dollarAmount) external view returns (uint256 requiredETH) {
        require(dollarAmount > 0, "Dollar amount must be greater than 0");
        return calculateETHAmount(dollarAmount);
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
     * @notice Emergency withdrawal of funds (for contract recovery)
     * @param _to Address to send funds to
     */
    function emergencyWithdraw(address _to) external onlyOwner {
        require(_to != address(0), "Invalid recipient address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(_to).transfer(balance);
    }
} 