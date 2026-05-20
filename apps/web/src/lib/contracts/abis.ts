export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export const registryAbi = [
  {
    type: "function",
    name: "createEscrow",
    stateMutability: "nonpayable",
    inputs: [
      { name: "payer", type: "address" },
      { name: "payee", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "termsHash", type: "bytes32" },
      { name: "metadataUri", type: "string" }
    ],
    outputs: [{ name: "escrow", type: "address" }]
  },
  {
    type: "event",
    name: "EscrowCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "escrow", type: "address" },
      { indexed: true, name: "payer", type: "address" },
      { indexed: false, name: "payee", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "termsHash", type: "bytes32" },
      { indexed: false, name: "metadataUri", type: "string" }
    ]
  }
] as const;

export const escrowAbi = [
  {
    type: "function",
    name: "fund",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }
] as const;
