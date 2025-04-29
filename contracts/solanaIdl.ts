import { IdlTypes, Idl } from "@coral-xyz/anchor";

export type DogePresaleIDL = Idl &  {
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
            "name": "transactions",
            "type": {
              "vec": {
                "defined": "Transaction"
              }
            }
          },
          {
            "name": "transactionCount",
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
    }
  ]
};

;

export type DogePresaleTypes = IdlTypes<DogePresaleIDL>;

export const IDL: DogePresaleIDL =  {
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
            "name": "transactions",
            "type": {
              "vec": {
                "defined": "Transaction"
              }
            }
          },
          {
            "name": "transactionCount",
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
    }
  ]
};
;