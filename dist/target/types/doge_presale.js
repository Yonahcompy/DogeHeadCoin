"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDL = void 0;
exports.IDL = {
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
        },
        {
            "code": 6005,
            "name": "BuyerInfoNotFound",
            "msg": "Buyer info not found"
        }
    ]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9nZV9wcmVzYWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGFyZ2V0L3R5cGVzL2RvZ2VfcHJlc2FsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFnUGEsUUFBQSxHQUFHLEdBQWdCO0lBQzlCLFNBQVMsRUFBRSxPQUFPO0lBQ2xCLE1BQU0sRUFBRSxjQUFjO0lBQ3RCLGNBQWMsRUFBRTtRQUNkO1lBQ0UsTUFBTSxFQUFFLFlBQVk7WUFDcEIsVUFBVSxFQUFFO2dCQUNWO29CQUNFLE1BQU0sRUFBRSxXQUFXO29CQUNuQixPQUFPLEVBQUUsSUFBSTtvQkFDYixVQUFVLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0UsTUFBTSxFQUFFLG1CQUFtQjtvQkFDM0IsT0FBTyxFQUFFLElBQUk7b0JBQ2IsVUFBVSxFQUFFLEtBQUs7aUJBQ2xCO2dCQUNEO29CQUNFLE1BQU0sRUFBRSxlQUFlO29CQUN2QixPQUFPLEVBQUUsS0FBSztvQkFDZCxVQUFVLEVBQUUsS0FBSztpQkFDbEI7YUFDRjtZQUNELE1BQU0sRUFBRSxFQUFFO1NBQ1g7UUFDRDtZQUNFLE1BQU0sRUFBRSxLQUFLO1lBQ2IsVUFBVSxFQUFFO2dCQUNWO29CQUNFLE1BQU0sRUFBRSxPQUFPO29CQUNmLE9BQU8sRUFBRSxJQUFJO29CQUNiLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDRSxNQUFNLEVBQUUsVUFBVTtvQkFDbEIsT0FBTyxFQUFFLElBQUk7b0JBQ2IsVUFBVSxFQUFFLEtBQUs7aUJBQ2xCO2dCQUNEO29CQUNFLE1BQU0sRUFBRSxtQkFBbUI7b0JBQzNCLE9BQU8sRUFBRSxJQUFJO29CQUNiLFVBQVUsRUFBRSxLQUFLO2lCQUNsQjtnQkFDRDtvQkFDRSxNQUFNLEVBQUUsZUFBZTtvQkFDdkIsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsVUFBVSxFQUFFLEtBQUs7aUJBQ2xCO2FBQ0Y7WUFDRCxNQUFNLEVBQUU7Z0JBQ047b0JBQ0UsTUFB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LEtBQUs7cUJBQ2Q7b0JBQ0Q7d0JBQ0UsTUFBTSxFQUFFLGNBQWM7d0JBQ3RCLE1BQU0sRUFBRSxLQUFLO3FCQUNkO29CQUNEO3dCQUNFLE1BQU0sRUFBRSxtQkFBbUI7d0JBQzNCLE1BQU0sRUFBRSxLQUFLO3FCQUNkO29CQUNEO3dCQUNFLE1BQU0sRUFBRSxvQkFBb0I7d0JBQzVCLE1BQU0sRUFBRSxLQUFLO3FCQUNkO29CQUNEO3dCQUNFLE1BQU0sRUFBRSxvQkFBb0I7d0JBQzVCLE1BQU0sRUFBRSxLQUFLO3FCQUNkO2lCQUNGO2FBQ0Y7U0FDRjtLQUNGO0lBQ0QsUUFBUSxFQUFFO1FBQ1I7WUFDRSxNQUFNLEVBQUUsSUFBSTtZQUNaLE1BQU0sRUFBRSxlQUFlO1lBQ3ZCLEtBQUssRUFBRSxnQkFBZ0I7U0FDeEI7UUFDRDtZQUNFLE1BQU0sRUFBRSxJQUFJO1lBQ1osTUFBTSxFQUFFLHlCQUF5QjtZQUNqQyxLQUFLLEVBQUUsMkJBQTJCO1NBQ25DO1FBQ0Q7WUFDRSxNQUFNLEVBQUUsSUFBSTtZQUNaLE1BQU0sRUFBRSxvQkFBb0I7WUFDNUIsS0FBSyxFQUFFLHFCQUFxQjtTQUM3QjtRQUNEO1lBQ0UsTUFBTSxFQUFFLElBQUk7WUFDWixNQUFNLEVBQUUsY0FBYztZQUN0QixLQUFLLEVBQUUsZUFBZTtTQUN2QjtRQUNEO1lBQ0UsTUFBTSxFQUFFLElBQUk7WUFDWixNQUFNLEVBQUUsY0FBYztZQUN0QixLQUFLLEVBQUUsY0FBYztTQUN0QjtRQUNEO1lBQ0UsTUFBTSxFQUFFLElBQUk7WUFDWixNQUFNLEVBQUUsbUJBQW1CO1lBQzNCLEtBQUssRUFBRSxzQkFBc0I7U0FDOUI7S0FDRjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgdHlwZSBEb2dlUHJlc2FsZSA9IHtcbiAgXCJ2ZXJzaW9uXCI6IFwiMC4xLjBcIixcbiAgXCJuYW1lXCI6IFwiZG9nZV9wcmVzYWxlXCIsXG4gIFwiaW5zdHJ1Y3Rpb25zXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJpbml0aWFsaXplXCIsXG4gICAgICBcImFjY291bnRzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcImF1dGhvcml0eVwiLFxuICAgICAgICAgIFwiaXNNdXRcIjogdHJ1ZSxcbiAgICAgICAgICBcImlzU2lnbmVyXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcInRyYW5zYWN0aW9uUmVjb3JkXCIsXG4gICAgICAgICAgXCJpc011dFwiOiB0cnVlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcInN5c3RlbVByb2dyYW1cIixcbiAgICAgICAgICBcImlzTXV0XCI6IGZhbHNlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogZmFsc2VcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiYXJnc1wiOiBbXVxuICAgIH0sXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiYnV5XCIsXG4gICAgICBcImFjY291bnRzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcImJ1eWVyXCIsXG4gICAgICAgICAgXCJpc011dFwiOiB0cnVlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwidHJlYXN1cnlcIixcbiAgICAgICAgICBcImlzTXV0XCI6IHRydWUsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwidHJhbnNhY3Rpb25SZWNvcmRcIixcbiAgICAgICAgICBcImlzTXV0XCI6IHRydWUsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwic3lzdGVtUHJvZ3JhbVwiLFxuICAgICAgICAgIFwiaXNNdXRcIjogZmFsc2UsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiBmYWxzZVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJhcmdzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcInVzZEFtb3VudFwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImY2NFwiXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcInJlc2l6ZVwiLFxuICAgICAgXCJhY2NvdW50c1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJhdXRob3JpdHlcIixcbiAgICAgICAgICBcImlzTXV0XCI6IHRydWUsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJ0cmFuc2FjdGlvblJlY29yZFwiLFxuICAgICAgICAgIFwiaXNNdXRcIjogdHJ1ZSxcbiAgICAgICAgICBcImlzU2lnbmVyXCI6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJzeXN0ZW1Qcm9ncmFtXCIsXG4gICAgICAgICAgXCJpc011dFwiOiBmYWxzZSxcbiAgICAgICAgICBcImlzU2lnbmVyXCI6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImFyZ3NcIjogW11cbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIm5leHRTdGFnZVwiLFxuICAgICAgXCJhY2NvdW50c1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJhdXRob3JpdHlcIixcbiAgICAgICAgICBcImlzTXV0XCI6IHRydWUsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJ0cmFuc2FjdGlvblJlY29yZFwiLFxuICAgICAgICAgIFwiaXNNdXRcIjogdHJ1ZSxcbiAgICAgICAgICBcImlzU2lnbmVyXCI6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImFyZ3NcIjogW11cbiAgICB9XG4gIF0sXG4gIFwiYWNjb3VudHNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcInRyYW5zYWN0aW9uUmVjb3JkXCIsXG4gICAgICBcInR5cGVcIjoge1xuICAgICAgICBcImtpbmRcIjogXCJzdHJ1Y3RcIixcbiAgICAgICAgXCJmaWVsZHNcIjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcImF1dGhvcml0eVwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwicHVibGljS2V5XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcImN1cnJlbnRTdGFnZVwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidThcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidHJhbnNhY3Rpb25Db3VudFwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidTY0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInRvdGFsVXNkU29sZFwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZjY0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInRvdGFsVG9rZW5zU29sZFwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidTY0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInRyYW5zYWN0aW9uc1wiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IHtcbiAgICAgICAgICAgICAgXCJ2ZWNcIjoge1xuICAgICAgICAgICAgICAgIFwiZGVmaW5lZFwiOiBcIlRyYW5zYWN0aW9uXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwiYnV5ZXJzXCIsXG4gICAgICAgICAgICBcInR5cGVcIjoge1xuICAgICAgICAgICAgICBcInZlY1wiOiB7XG4gICAgICAgICAgICAgICAgXCJkZWZpbmVkXCI6IFwiQnV5ZXJJbmZvXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH1cbiAgXSxcbiAgXCJ0eXBlc1wiOiBbXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiVHJhbnNhY3Rpb25cIixcbiAgICAgIFwidHlwZVwiOiB7XG4gICAgICAgIFwia2luZFwiOiBcInN0cnVjdFwiLFxuICAgICAgICBcImZpZWxkc1wiOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwiYnV5ZXJcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInB1YmxpY0tleVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJ1c2RBbW91bnRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImY2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJzb2xBbW91bnRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInU2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJ0b2tlbkFtb3VudFwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidTY0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInN0YWdlXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJ1OFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJ0aW1lc3RhbXBcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImk2NFwiXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJCdXllckluZm9cIixcbiAgICAgIFwidHlwZVwiOiB7XG4gICAgICAgIFwia2luZFwiOiBcInN0cnVjdFwiLFxuICAgICAgICBcImZpZWxkc1wiOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwiYnV5ZXJBZGRyZXNzXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJwdWJsaWNLZXlcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidG90YWxQYWlkVXNkXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJmNjRcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidG90YWxQYWlkU29sXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJ1NjRcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidG90YWxUb2tlbnNCb3VnaHRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInU2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJ0b3RhbFRva2Vuc0NsYWltZWRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInU2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJsYXN0Q2xhaW1UaW1lc3RhbXBcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImk2NFwiXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfVxuICBdLFxuICBcImVycm9yc1wiOiBbXG4gICAge1xuICAgICAgXCJjb2RlXCI6IDYwMDAsXG4gICAgICBcIm5hbWVcIjogXCJJbnZhbGlkQW1vdW50XCIsXG4gICAgICBcIm1zZ1wiOiBcIkludmFsaWQgYW1vdW50XCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiY29kZVwiOiA2MDAxLFxuICAgICAgXCJuYW1lXCI6IFwiVHJhbnNhY3Rpb25MaW1pdFJlYWNoZWRcIixcbiAgICAgIFwibXNnXCI6IFwiVHJhbnNhY3Rpb24gbGltaXQgcmVhY2hlZFwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImNvZGVcIjogNjAwMixcbiAgICAgIFwibmFtZVwiOiBcIkFyaXRobWV0aWNPdmVyZmxvd1wiLFxuICAgICAgXCJtc2dcIjogXCJBcml0aG1ldGljIG92ZXJmbG93XCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiY29kZVwiOiA2MDAzLFxuICAgICAgXCJuYW1lXCI6IFwiSW52YWxpZFN0YWdlXCIsXG4gICAgICBcIm1zZ1wiOiBcIkludmFsaWQgc3RhZ2VcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJjb2RlXCI6IDYwMDQsXG4gICAgICBcIm5hbWVcIjogXCJVbmF1dGhvcml6ZWRcIixcbiAgICAgIFwibXNnXCI6IFwiVW5hdXRob3JpemVkXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiY29kZVwiOiA2MDA1LFxuICAgICAgXCJuYW1lXCI6IFwiQnV5ZXJJbmZvTm90Rm91bmRcIixcbiAgICAgIFwibXNnXCI6IFwiQnV5ZXIgaW5mbyBub3QgZm91bmRcIlxuICAgIH1cbiAgXVxufTtcblxuZXhwb3J0IGNvbnN0IElETDogRG9nZVByZXNhbGUgPSB7XG4gIFwidmVyc2lvblwiOiBcIjAuMS4wXCIsXG4gIFwibmFtZVwiOiBcImRvZ2VfcHJlc2FsZVwiLFxuICBcImluc3RydWN0aW9uc1wiOiBbXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiaW5pdGlhbGl6ZVwiLFxuICAgICAgXCJhY2NvdW50c1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJhdXRob3JpdHlcIixcbiAgICAgICAgICBcImlzTXV0XCI6IHRydWUsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJ0cmFuc2FjdGlvblJlY29yZFwiLFxuICAgICAgICAgIFwiaXNNdXRcIjogdHJ1ZSxcbiAgICAgICAgICBcImlzU2lnbmVyXCI6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJzeXN0ZW1Qcm9ncmFtXCIsXG4gICAgICAgICAgXCJpc011dFwiOiBmYWxzZSxcbiAgICAgICAgICBcImlzU2lnbmVyXCI6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImFyZ3NcIjogW11cbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcImJ1eVwiLFxuICAgICAgXCJhY2NvdW50c1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJidXllclwiLFxuICAgICAgICAgIFwiaXNNdXRcIjogdHJ1ZSxcbiAgICAgICAgICBcImlzU2lnbmVyXCI6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcInRyZWFzdXJ5XCIsXG4gICAgICAgICAgXCJpc011dFwiOiB0cnVlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcInRyYW5zYWN0aW9uUmVjb3JkXCIsXG4gICAgICAgICAgXCJpc011dFwiOiB0cnVlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwibmFtZVwiOiBcInN5c3RlbVByb2dyYW1cIixcbiAgICAgICAgICBcImlzTXV0XCI6IGZhbHNlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogZmFsc2VcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiYXJnc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm5hbWVcIjogXCJ1c2RBbW91bnRcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJmNjRcIlxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJyZXNpemVcIixcbiAgICAgIFwiYWNjb3VudHNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwiYXV0aG9yaXR5XCIsXG4gICAgICAgICAgXCJpc011dFwiOiB0cnVlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwidHJhbnNhY3Rpb25SZWNvcmRcIixcbiAgICAgICAgICBcImlzTXV0XCI6IHRydWUsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwic3lzdGVtUHJvZ3JhbVwiLFxuICAgICAgICAgIFwiaXNNdXRcIjogZmFsc2UsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiBmYWxzZVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJhcmdzXCI6IFtdXG4gICAgfSxcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJuZXh0U3RhZ2VcIixcbiAgICAgIFwiYWNjb3VudHNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwiYXV0aG9yaXR5XCIsXG4gICAgICAgICAgXCJpc011dFwiOiB0cnVlLFxuICAgICAgICAgIFwiaXNTaWduZXJcIjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJuYW1lXCI6IFwidHJhbnNhY3Rpb25SZWNvcmRcIixcbiAgICAgICAgICBcImlzTXV0XCI6IHRydWUsXG4gICAgICAgICAgXCJpc1NpZ25lclwiOiBmYWxzZVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJhcmdzXCI6IFtdXG4gICAgfVxuICBdLFxuICBcImFjY291bnRzXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJ0cmFuc2FjdGlvblJlY29yZFwiLFxuICAgICAgXCJ0eXBlXCI6IHtcbiAgICAgICAgXCJraW5kXCI6IFwic3RydWN0XCIsXG4gICAgICAgIFwiZmllbGRzXCI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJhdXRob3JpdHlcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInB1YmxpY0tleVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJjdXJyZW50U3RhZ2VcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInU4XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInRyYW5zYWN0aW9uQ291bnRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInU2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJ0b3RhbFVzZFNvbGRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImY2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJ0b3RhbFRva2Vuc1NvbGRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInU2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJ0cmFuc2FjdGlvbnNcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiB7XG4gICAgICAgICAgICAgIFwidmVjXCI6IHtcbiAgICAgICAgICAgICAgICBcImRlZmluZWRcIjogXCJUcmFuc2FjdGlvblwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcImJ1eWVyc1wiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IHtcbiAgICAgICAgICAgICAgXCJ2ZWNcIjoge1xuICAgICAgICAgICAgICAgIFwiZGVmaW5lZFwiOiBcIkJ1eWVySW5mb1wiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9XG4gIF0sXG4gIFwidHlwZXNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIlRyYW5zYWN0aW9uXCIsXG4gICAgICBcInR5cGVcIjoge1xuICAgICAgICBcImtpbmRcIjogXCJzdHJ1Y3RcIixcbiAgICAgICAgXCJmaWVsZHNcIjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcImJ1eWVyXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJwdWJsaWNLZXlcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidXNkQW1vdW50XCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJmNjRcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwic29sQW1vdW50XCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJ1NjRcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidG9rZW5BbW91bnRcIixcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInU2NFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm5hbWVcIjogXCJzdGFnZVwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidThcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidGltZXN0YW1wXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJpNjRcIlxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiQnV5ZXJJbmZvXCIsXG4gICAgICBcInR5cGVcIjoge1xuICAgICAgICBcImtpbmRcIjogXCJzdHJ1Y3RcIixcbiAgICAgICAgXCJmaWVsZHNcIjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcImJ1eWVyQWRkcmVzc1wiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwicHVibGljS2V5XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInRvdGFsUGFpZFVzZFwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZjY0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInRvdGFsUGFpZFNvbFwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidTY0XCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInRvdGFsVG9rZW5zQm91Z2h0XCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJ1NjRcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwidG90YWxUb2tlbnNDbGFpbWVkXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJ1NjRcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJuYW1lXCI6IFwibGFzdENsYWltVGltZXN0YW1wXCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJpNjRcIlxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH1cbiAgXSxcbiAgXCJlcnJvcnNcIjogW1xuICAgIHtcbiAgICAgIFwiY29kZVwiOiA2MDAwLFxuICAgICAgXCJuYW1lXCI6IFwiSW52YWxpZEFtb3VudFwiLFxuICAgICAgXCJtc2dcIjogXCJJbnZhbGlkIGFtb3VudFwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImNvZGVcIjogNjAwMSxcbiAgICAgIFwibmFtZVwiOiBcIlRyYW5zYWN0aW9uTGltaXRSZWFjaGVkXCIsXG4gICAgICBcIm1zZ1wiOiBcIlRyYW5zYWN0aW9uIGxpbWl0IHJlYWNoZWRcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJjb2RlXCI6IDYwMDIsXG4gICAgICBcIm5hbWVcIjogXCJBcml0aG1ldGljT3ZlcmZsb3dcIixcbiAgICAgIFwibXNnXCI6IFwiQXJpdGhtZXRpYyBvdmVyZmxvd1wiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImNvZGVcIjogNjAwMyxcbiAgICAgIFwibmFtZVwiOiBcIkludmFsaWRTdGFnZVwiLFxuICAgICAgXCJtc2dcIjogXCJJbnZhbGlkIHN0YWdlXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiY29kZVwiOiA2MDA0LFxuICAgICAgXCJuYW1lXCI6IFwiVW5hdXRob3JpemVkXCIsXG4gICAgICBcIm1zZ1wiOiBcIlVuYXV0aG9yaXplZFwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImNvZGVcIjogNjAwNSxcbiAgICAgIFwibmFtZVwiOiBcIkJ1eWVySW5mb05vdEZvdW5kXCIsXG4gICAgICBcIm1zZ1wiOiBcIkJ1eWVyIGluZm8gbm90IGZvdW5kXCJcbiAgICB9XG4gIF1cbn07XG4iXX0=