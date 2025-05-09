export type DogePresale = {
  "version": "0.1.0",
  "name": "doge_presale",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
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
          "name": "tokenMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "buy",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "referrer",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "usdAmount",
          "type": "f64"
        },
        {
          "name": "referrer",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "resize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
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
      "name": "nextStage",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "getBuyerInfo",
      "accounts": [
        {
          "name": "buyerAddress",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transactionRecord",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": {
        "defined": "BuyerInfo"
      }
    },
    {
      "name": "authorityBuy",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "usdAmount",
          "type": "f64"
        },
        {
          "name": "buyerAddress",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "depositToken",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleTokenAccount",
          "isMut": true,
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
      "name": "changeTokenMint",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newTokenMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimTokens",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "presaleTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
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
        }
      ],
      "args": []
    },
    {
      "name": "endPresale",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "changeAuthority",
      "accounts": [
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "transactionRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          },
          {
            "name": "currentStage",
            "type": "u8"
          },
          {
            "name": "transactionCount",
            "type": "u64"
          },
          {
            "name": "totalUsdSold",
            "type": "f64"
          },
          {
            "name": "totalTokensSold",
            "type": "u64"
          },
          {
            "name": "depositTokenAmount",
            "type": "u64"
          },
          {
            "name": "transactions",
            "type": {
              "vec": {
                "defined": "Transaction"
              }
            }
          },
          {
            "name": "buyers",
            "type": {
              "vec": {
                "defined": "BuyerInfo"
              }
            }
          },
          {
            "name": "presaleEndTime",
            "type": "i64"
          },
          {
            "name": "totalTokensClaimed",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Transaction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "usdAmount",
            "type": "f64"
          },
          {
            "name": "solAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "stage",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "BuyerInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyerAddress",
            "type": "publicKey"
          },
          {
            "name": "totalPaidUsd",
            "type": "f64"
          },
          {
            "name": "totalPaidSol",
            "type": "u64"
          },
          {
            "name": "totalTokensBought",
            "type": "u64"
          },
          {
            "name": "totalTokensClaimed",
            "type": "u64"
          },
          {
            "name": "lastClaimTimestamp",
            "type": "i64"
          },
          {
            "name": "referrer",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "TokenDeposited",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalDeposited",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TokensPurchased",
      "fields": [
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "usdAmount",
          "type": "f64",
          "index": false
        },
        {
          "name": "solAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "stage",
          "type": "u8",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "referrer",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    },
    {
      "name": "StageAdvanced",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldStage",
          "type": "u8",
          "index": false
        },
        {
          "name": "newStage",
          "type": "u8",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PresaleInitialized",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "AccountResized",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newSize",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TokenMintChanged",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldTokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newTokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TokensClaimed",
      "fields": [
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalClaimed",
          "type": "u64",
          "index": false
        },
        {
          "name": "remainingBalance",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PresaleEnded",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "totalBuyers",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalTokensSold",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "AuthorityChanged",
      "fields": [
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6001,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6002,
      "name": "TransactionLimitReached",
      "msg": "Transaction limit reached"
    },
    {
      "code": 6003,
      "name": "InvalidStage",
      "msg": "Invalid stage"
    },
    {
      "code": 6004,
      "name": "BuyerNotFound",
      "msg": "Buyer not found"
    },
    {
      "code": 6005,
      "name": "InvalidReferrer",
      "msg": "Invalid referrer address"
    },
    {
      "code": 6006,
      "name": "InvalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6007,
      "name": "InvalidTokenAccount",
      "msg": "Invalid token account"
    },
    {
      "code": 6008,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6009,
      "name": "NoTokensToClaim",
      "msg": "No tokens available to claim"
    },
    {
      "code": 6010,
      "name": "InsufficientTokens",
      "msg": "Insufficient tokens in presale account"
    },
    {
      "code": 6011,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic operation would result in overflow"
    },
    {
      "code": 6012,
      "name": "AlreadyClaimedInSection",
      "msg": "Already claimed tokens in this time section"
    },
    {
      "code": 6013,
      "name": "AlreadyClaimedInitial",
      "msg": "Already claimed initial 3% tokens"
    },
    {
      "code": 6014,
      "name": "PresaleNotEnded",
      "msg": "Presale has not ended yet"
    }
  ]
};

export const IDL: DogePresale = {
  "version": "0.1.0",
  "name": "doge_presale",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
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
          "name": "tokenMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "buy",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "referrer",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "usdAmount",
          "type": "f64"
        },
        {
          "name": "referrer",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "resize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
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
      "name": "nextStage",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "getBuyerInfo",
      "accounts": [
        {
          "name": "buyerAddress",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transactionRecord",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": {
        "defined": "BuyerInfo"
      }
    },
    {
      "name": "authorityBuy",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "usdAmount",
          "type": "f64"
        },
        {
          "name": "buyerAddress",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "depositToken",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "presaleTokenAccount",
          "isMut": true,
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
      "name": "changeTokenMint",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newTokenMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimTokens",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "presaleTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
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
        }
      ],
      "args": []
    },
    {
      "name": "endPresale",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "changeAuthority",
      "accounts": [
        {
          "name": "transactionRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "transactionRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "type": "publicKey"
          },
          {
            "name": "currentStage",
            "type": "u8"
          },
          {
            "name": "transactionCount",
            "type": "u64"
          },
          {
            "name": "totalUsdSold",
            "type": "f64"
          },
          {
            "name": "totalTokensSold",
            "type": "u64"
          },
          {
            "name": "depositTokenAmount",
            "type": "u64"
          },
          {
            "name": "transactions",
            "type": {
              "vec": {
                "defined": "Transaction"
              }
            }
          },
          {
            "name": "buyers",
            "type": {
              "vec": {
                "defined": "BuyerInfo"
              }
            }
          },
          {
            "name": "presaleEndTime",
            "type": "i64"
          },
          {
            "name": "totalTokensClaimed",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Transaction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "usdAmount",
            "type": "f64"
          },
          {
            "name": "solAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "stage",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "BuyerInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyerAddress",
            "type": "publicKey"
          },
          {
            "name": "totalPaidUsd",
            "type": "f64"
          },
          {
            "name": "totalPaidSol",
            "type": "u64"
          },
          {
            "name": "totalTokensBought",
            "type": "u64"
          },
          {
            "name": "totalTokensClaimed",
            "type": "u64"
          },
          {
            "name": "lastClaimTimestamp",
            "type": "i64"
          },
          {
            "name": "referrer",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "TokenDeposited",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalDeposited",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TokensPurchased",
      "fields": [
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "usdAmount",
          "type": "f64",
          "index": false
        },
        {
          "name": "solAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "stage",
          "type": "u8",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "referrer",
          "type": {
            "option": "publicKey"
          },
          "index": false
        }
      ]
    },
    {
      "name": "StageAdvanced",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldStage",
          "type": "u8",
          "index": false
        },
        {
          "name": "newStage",
          "type": "u8",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PresaleInitialized",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "AccountResized",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newSize",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TokenMintChanged",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldTokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newTokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TokensClaimed",
      "fields": [
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalClaimed",
          "type": "u64",
          "index": false
        },
        {
          "name": "remainingBalance",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PresaleEnded",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "totalBuyers",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalTokensSold",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "AuthorityChanged",
      "fields": [
        {
          "name": "oldAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newAuthority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6001,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6002,
      "name": "TransactionLimitReached",
      "msg": "Transaction limit reached"
    },
    {
      "code": 6003,
      "name": "InvalidStage",
      "msg": "Invalid stage"
    },
    {
      "code": 6004,
      "name": "BuyerNotFound",
      "msg": "Buyer not found"
    },
    {
      "code": 6005,
      "name": "InvalidReferrer",
      "msg": "Invalid referrer address"
    },
    {
      "code": 6006,
      "name": "InvalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6007,
      "name": "InvalidTokenAccount",
      "msg": "Invalid token account"
    },
    {
      "code": 6008,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6009,
      "name": "NoTokensToClaim",
      "msg": "No tokens available to claim"
    },
    {
      "code": 6010,
      "name": "InsufficientTokens",
      "msg": "Insufficient tokens in presale account"
    },
    {
      "code": 6011,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic operation would result in overflow"
    },
    {
      "code": 6012,
      "name": "AlreadyClaimedInSection",
      "msg": "Already claimed tokens in this time section"
    },
    {
      "code": 6013,
      "name": "AlreadyClaimedInitial",
      "msg": "Already claimed initial 3% tokens"
    },
    {
      "code": 6014,
      "name": "PresaleNotEnded",
      "msg": "Presale has not ended yet"
    }
  ]
};
