export type PalmPresale = {
  "version": "0.1.0",
  "name": "palm_presale",
  "constants": [
    {
      "name": "PRESALE_SEED",
      "type": "bytes",
      "value": "[80, 82, 69, 83, 65, 76, 69, 95, 83, 69, 69, 68]"
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stage1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenMintAddress",
          "type": "publicKey"
        },
        {
          "name": "softcapAmount",
          "type": "u64"
        },
        {
          "name": "hardcapAmount",
          "type": "u64"
        },
        {
          "name": "maxTokenAmountPerAddress",
          "type": "u64"
        },
        {
          "name": "tokenPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeStage",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stageNumber",
          "type": "u8"
        },
        {
          "name": "availableTokens",
          "type": "u64"
        },
        {
          "name": "pricePerToken",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositToken",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenOwner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The token owner (Address B)"
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyToken",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "referrerInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Referrer info account - optional but required if referrer_address is provided"
          ]
        },
        {
          "name": "presaleVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "priceFeed",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transactionHistory",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "referrerAddress",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "claimToken",
      "accounts": [
        {
          "name": "presaleTokenMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerPresaleTokenAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presalePresaleTokenAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdrawSol",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "presaleVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdrawToken",
      "accounts": [
        {
          "name": "mintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "adminAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleTokenMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "adminAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createReferral",
      "accounts": [
        {
          "name": "referralInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimReferralRewards",
      "accounts": [
        {
          "name": "referralInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "getReferralStats",
      "accounts": [
        {
          "name": "referralInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "getTransactionHistory",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "buyer",
          "type": "publicKey"
        }
      ],
      "returns": {
        "vec": {
          "defined": "TransactionHistory"
        }
      }
    },
    {
      "name": "getAllTransactions",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [],
      "returns": {
        "vec": {
          "defined": "TransactionHistory"
        }
      }
    },
    {
      "name": "setAuthorizedUpdater",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newUpdater",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateUserAllocation",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "currentStage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "referrerInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Referrer info account - optional but required if referrer is provided"
          ]
        },
        {
          "name": "updater",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transactionHistory",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "solanaWallet",
          "type": "publicKey"
        },
        {
          "name": "usdAmount",
          "type": "u64"
        },
        {
          "name": "referrer",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "presaleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMintAddress",
            "type": "publicKey"
          },
          {
            "name": "softcapAmount",
            "type": "u64"
          },
          {
            "name": "hardcapAmount",
            "type": "u64"
          },
          {
            "name": "depositTokenAmount",
            "type": "u64"
          },
          {
            "name": "soldTokenAmount",
            "type": "u64"
          },
          {
            "name": "maxTokenAmountPerAddress",
            "type": "u64"
          },
          {
            "name": "maxTokenAmount",
            "type": "u64"
          },
          {
            "name": "isLive",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "isSoftCapped",
            "type": "bool"
          },
          {
            "name": "isHardCapped",
            "type": "bool"
          },
          {
            "name": "currentStage",
            "type": "u8"
          },
          {
            "name": "totalStages",
            "type": "u8"
          },
          {
            "name": "totalRaised",
            "type": "u64"
          },
          {
            "name": "minTokenAmount",
            "type": "u64"
          },
          {
            "name": "tokenPrice",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authorizedUpdater",
            "type": "publicKey"
          },
          {
            "name": "tokensSold",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "presaleStage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stageNumber",
            "type": "u8"
          },
          {
            "name": "availableTokens",
            "type": "u64"
          },
          {
            "name": "pricePerToken",
            "type": "u64"
          },
          {
            "name": "tokensSold",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "referralInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "totalReferrals",
            "type": "u32"
          },
          {
            "name": "totalReferralPurchases",
            "type": "u64"
          },
          {
            "name": "totalRewardsEarned",
            "type": "u64"
          },
          {
            "name": "rewardsClaimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "transactionHistory",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "usdAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "chain",
            "type": "string"
          },
          {
            "name": "nativeAmount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "oracle",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "userInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "buyTokenAmount",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "buyQuoteAmount",
            "type": "u64"
          },
          {
            "name": "buyTime",
            "type": "u64"
          },
          {
            "name": "claimTime",
            "type": "u64"
          },
          {
            "name": "referrer",
            "type": "publicKey"
          },
          {
            "name": "wasReferred",
            "type": "bool"
          },
          {
            "name": "referralRewardsEarned",
            "type": "u64"
          },
          {
            "name": "referralRewardsClaimed",
            "type": "u64"
          },
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidStageNumber"
          },
          {
            "name": "StageNumberExceedsTotal"
          }
        ]
      }
    },
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidPriceFeed"
          },
          {
            "name": "StalePriceFeed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PresaleNotStarted",
      "msg": "The presale has not started yet"
    },
    {
      "code": 6001,
      "name": "PresaleNotEnded",
      "msg": "The presale has already ended"
    },
    {
      "code": 6002,
      "name": "PresaleNotLive",
      "msg": "The presale is not live"
    },
    {
      "code": 6003,
      "name": "InvalidSolanaWallet",
      "msg": "Invalid Solana wallet address"
    },
    {
      "code": 6004,
      "name": "SelfReferralNotAllowed",
      "msg": "Self referral is not allowed"
    },
    {
      "code": 6005,
      "name": "UnauthorizedUpdater",
      "msg": "Unauthorized updater"
    },
    {
      "code": 6006,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6007,
      "name": "InvalidAuthority",
      "msg": "Invalid authority"
    },
    {
      "code": 6008,
      "name": "InvalidStageNumber",
      "msg": "Invalid stage number"
    },
    {
      "code": 6009,
      "name": "StageNotActive",
      "msg": "Stage not active"
    },
    {
      "code": 6010,
      "name": "StageAlreadyActive",
      "msg": "Stage already active"
    },
    {
      "code": 6011,
      "name": "PreviousStageNotCompleted",
      "msg": "Previous stage not completed"
    },
    {
      "code": 6012,
      "name": "PreviousStageNotSoldOut",
      "msg": "Previous stage not sold out"
    },
    {
      "code": 6013,
      "name": "PreviousStageRequired",
      "msg": "Previous stage required"
    },
    {
      "code": 6014,
      "name": "StageNotStarted",
      "msg": "Stage not started"
    },
    {
      "code": 6015,
      "name": "StageEnded",
      "msg": "Stage ended"
    },
    {
      "code": 6016,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6017,
      "name": "PresaleAlreadyStarted",
      "msg": "Presale already started"
    },
    {
      "code": 6018,
      "name": "InvalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6019,
      "name": "InvalidPresaleTokenAccount",
      "msg": "Invalid presale token account"
    },
    {
      "code": 6020,
      "name": "InvalidTokenAccountOwner",
      "msg": "Invalid token account owner"
    },
    {
      "code": 6021,
      "name": "InsufficientTokenBalance",
      "msg": "Insufficient token balance"
    },
    {
      "code": 6022,
      "name": "MathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6023,
      "name": "ReferralAlreadyExists",
      "msg": "Referral already exists"
    },
    {
      "code": 6024,
      "name": "InvalidReferralCode",
      "msg": "Invalid referral code"
    },
    {
      "code": 6025,
      "name": "SelfReferral",
      "msg": "Self referral not allowed"
    },
    {
      "code": 6026,
      "name": "PresaleEnded",
      "msg": "Presale ended"
    },
    {
      "code": 6027,
      "name": "InsufficientFund",
      "msg": "Insufficient funds"
    },
    {
      "code": 6028,
      "name": "HardCapped",
      "msg": "Hard capped"
    },
    {
      "code": 6029,
      "name": "TokenAmountMismatch",
      "msg": "Token amount mismatch"
    },
    {
      "code": 6030,
      "name": "InvalidTimeSettings",
      "msg": "Invalid time settings"
    },
    {
      "code": 6031,
      "name": "Unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6032,
      "name": "NoReferralRewards",
      "msg": "No referral rewards available"
    },
    {
      "code": 6033,
      "name": "RewardsAlreadyClaimed",
      "msg": "Rewards have already been claimed"
    },
    {
      "code": 6034,
      "name": "PresaleAlreadyEnded",
      "msg": "Presale has already ended"
    },
    {
      "code": 6035,
      "name": "SoftcapNotReached",
      "msg": "Softcap not reached"
    },
    {
      "code": 6036,
      "name": "NoTokensToClaim",
      "msg": "No tokens to claim"
    },
    {
      "code": 6037,
      "name": "InvalidReferrer",
      "msg": "Invalid referrer"
    },
    {
      "code": 6038,
      "name": "InvalidPriceFeed",
      "msg": "Invalid price feed"
    }
  ]
};

export const IDL: PalmPresale = {
  "version": "0.1.0",
  "name": "palm_presale",
  "constants": [
    {
      "name": "PRESALE_SEED",
      "type": "bytes",
      "value": "[80, 82, 69, 83, 65, 76, 69, 95, 83, 69, 69, 68]"
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stage1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenMintAddress",
          "type": "publicKey"
        },
        {
          "name": "softcapAmount",
          "type": "u64"
        },
        {
          "name": "hardcapAmount",
          "type": "u64"
        },
        {
          "name": "maxTokenAmountPerAddress",
          "type": "u64"
        },
        {
          "name": "tokenPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeStage",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stageNumber",
          "type": "u8"
        },
        {
          "name": "availableTokens",
          "type": "u64"
        },
        {
          "name": "pricePerToken",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositToken",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenOwner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The token owner (Address B)"
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyToken",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "referrerInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Referrer info account - optional but required if referrer_address is provided"
          ]
        },
        {
          "name": "presaleVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "priceFeed",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transactionHistory",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "referrerAddress",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "claimToken",
      "accounts": [
        {
          "name": "presaleTokenMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerPresaleTokenAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presalePresaleTokenAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdrawSol",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "presaleVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdrawToken",
      "accounts": [
        {
          "name": "mintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "adminAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAssociatedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleTokenMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "adminAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createReferral",
      "accounts": [
        {
          "name": "referralInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimReferralRewards",
      "accounts": [
        {
          "name": "referralInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "getReferralStats",
      "accounts": [
        {
          "name": "referralInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "getTransactionHistory",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "buyer",
          "type": "publicKey"
        }
      ],
      "returns": {
        "vec": {
          "defined": "TransactionHistory"
        }
      }
    },
    {
      "name": "getAllTransactions",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [],
      "returns": {
        "vec": {
          "defined": "TransactionHistory"
        }
      }
    },
    {
      "name": "setAuthorizedUpdater",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newUpdater",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateUserAllocation",
      "accounts": [
        {
          "name": "presaleInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "currentStage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "referrerInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Referrer info account - optional but required if referrer is provided"
          ]
        },
        {
          "name": "updater",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transactionHistory",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "solanaWallet",
          "type": "publicKey"
        },
        {
          "name": "usdAmount",
          "type": "u64"
        },
        {
          "name": "referrer",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "presaleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMintAddress",
            "type": "publicKey"
          },
          {
            "name": "softcapAmount",
            "type": "u64"
          },
          {
            "name": "hardcapAmount",
            "type": "u64"
          },
          {
            "name": "depositTokenAmount",
            "type": "u64"
          },
          {
            "name": "soldTokenAmount",
            "type": "u64"
          },
          {
            "name": "maxTokenAmountPerAddress",
            "type": "u64"
          },
          {
            "name": "maxTokenAmount",
            "type": "u64"
          },
          {
            "name": "isLive",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "isSoftCapped",
            "type": "bool"
          },
          {
            "name": "isHardCapped",
            "type": "bool"
          },
          {
            "name": "currentStage",
            "type": "u8"
          },
          {
            "name": "totalStages",
            "type": "u8"
          },
          {
            "name": "totalRaised",
            "type": "u64"
          },
          {
            "name": "minTokenAmount",
            "type": "u64"
          },
          {
            "name": "tokenPrice",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authorizedUpdater",
            "type": "publicKey"
          },
          {
            "name": "tokensSold",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "presaleStage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stageNumber",
            "type": "u8"
          },
          {
            "name": "availableTokens",
            "type": "u64"
          },
          {
            "name": "pricePerToken",
            "type": "u64"
          },
          {
            "name": "tokensSold",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "referralInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "totalReferrals",
            "type": "u32"
          },
          {
            "name": "totalReferralPurchases",
            "type": "u64"
          },
          {
            "name": "totalRewardsEarned",
            "type": "u64"
          },
          {
            "name": "rewardsClaimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "transactionHistory",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "usdAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "chain",
            "type": "string"
          },
          {
            "name": "nativeAmount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "oracle",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "userInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "buyTokenAmount",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "buyQuoteAmount",
            "type": "u64"
          },
          {
            "name": "buyTime",
            "type": "u64"
          },
          {
            "name": "claimTime",
            "type": "u64"
          },
          {
            "name": "referrer",
            "type": "publicKey"
          },
          {
            "name": "wasReferred",
            "type": "bool"
          },
          {
            "name": "referralRewardsEarned",
            "type": "u64"
          },
          {
            "name": "referralRewardsClaimed",
            "type": "u64"
          },
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidStageNumber"
          },
          {
            "name": "StageNumberExceedsTotal"
          }
        ]
      }
    },
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidPriceFeed"
          },
          {
            "name": "StalePriceFeed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PresaleNotStarted",
      "msg": "The presale has not started yet"
    },
    {
      "code": 6001,
      "name": "PresaleNotEnded",
      "msg": "The presale has already ended"
    },
    {
      "code": 6002,
      "name": "PresaleNotLive",
      "msg": "The presale is not live"
    },
    {
      "code": 6003,
      "name": "InvalidSolanaWallet",
      "msg": "Invalid Solana wallet address"
    },
    {
      "code": 6004,
      "name": "SelfReferralNotAllowed",
      "msg": "Self referral is not allowed"
    },
    {
      "code": 6005,
      "name": "UnauthorizedUpdater",
      "msg": "Unauthorized updater"
    },
    {
      "code": 6006,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6007,
      "name": "InvalidAuthority",
      "msg": "Invalid authority"
    },
    {
      "code": 6008,
      "name": "InvalidStageNumber",
      "msg": "Invalid stage number"
    },
    {
      "code": 6009,
      "name": "StageNotActive",
      "msg": "Stage not active"
    },
    {
      "code": 6010,
      "name": "StageAlreadyActive",
      "msg": "Stage already active"
    },
    {
      "code": 6011,
      "name": "PreviousStageNotCompleted",
      "msg": "Previous stage not completed"
    },
    {
      "code": 6012,
      "name": "PreviousStageNotSoldOut",
      "msg": "Previous stage not sold out"
    },
    {
      "code": 6013,
      "name": "PreviousStageRequired",
      "msg": "Previous stage required"
    },
    {
      "code": 6014,
      "name": "StageNotStarted",
      "msg": "Stage not started"
    },
    {
      "code": 6015,
      "name": "StageEnded",
      "msg": "Stage ended"
    },
    {
      "code": 6016,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6017,
      "name": "PresaleAlreadyStarted",
      "msg": "Presale already started"
    },
    {
      "code": 6018,
      "name": "InvalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6019,
      "name": "InvalidPresaleTokenAccount",
      "msg": "Invalid presale token account"
    },
    {
      "code": 6020,
      "name": "InvalidTokenAccountOwner",
      "msg": "Invalid token account owner"
    },
    {
      "code": 6021,
      "name": "InsufficientTokenBalance",
      "msg": "Insufficient token balance"
    },
    {
      "code": 6022,
      "name": "MathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6023,
      "name": "ReferralAlreadyExists",
      "msg": "Referral already exists"
    },
    {
      "code": 6024,
      "name": "InvalidReferralCode",
      "msg": "Invalid referral code"
    },
    {
      "code": 6025,
      "name": "SelfReferral",
      "msg": "Self referral not allowed"
    },
    {
      "code": 6026,
      "name": "PresaleEnded",
      "msg": "Presale ended"
    },
    {
      "code": 6027,
      "name": "InsufficientFund",
      "msg": "Insufficient funds"
    },
    {
      "code": 6028,
      "name": "HardCapped",
      "msg": "Hard capped"
    },
    {
      "code": 6029,
      "name": "TokenAmountMismatch",
      "msg": "Token amount mismatch"
    },
    {
      "code": 6030,
      "name": "InvalidTimeSettings",
      "msg": "Invalid time settings"
    },
    {
      "code": 6031,
      "name": "Unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6032,
      "name": "NoReferralRewards",
      "msg": "No referral rewards available"
    },
    {
      "code": 6033,
      "name": "RewardsAlreadyClaimed",
      "msg": "Rewards have already been claimed"
    },
    {
      "code": 6034,
      "name": "PresaleAlreadyEnded",
      "msg": "Presale has already ended"
    },
    {
      "code": 6035,
      "name": "SoftcapNotReached",
      "msg": "Softcap not reached"
    },
    {
      "code": 6036,
      "name": "NoTokensToClaim",
      "msg": "No tokens to claim"
    },
    {
      "code": 6037,
      "name": "InvalidReferrer",
      "msg": "Invalid referrer"
    },
    {
      "code": 6038,
      "name": "InvalidPriceFeed",
      "msg": "Invalid price feed"
    }
  ]
};
