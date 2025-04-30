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
      "args": []
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
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "usdAmount",
          "type": "f64"
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
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6001,
      "name": "TransactionLimitReached",
      "msg": "Transaction limit reached"
    },
    {
      "code": 6002,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6003,
      "name": "InvalidStage",
      "msg": "Invalid stage"
    },
    {
      "code": 6004,
      "name": "Unauthorized",
      "msg": "Unauthorized"
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
      "args": []
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
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "usdAmount",
          "type": "f64"
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
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6001,
      "name": "TransactionLimitReached",
      "msg": "Transaction limit reached"
    },
    {
      "code": 6002,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6003,
      "name": "InvalidStage",
      "msg": "Invalid stage"
    },
    {
      "code": 6004,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    }
  ]
};
