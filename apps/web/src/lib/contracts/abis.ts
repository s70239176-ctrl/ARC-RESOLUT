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
    name: "createAgreement",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentB", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "joinDeadlineSeconds", type: "uint256" },
      { name: "evidenceWindowSeconds", type: "uint256" },
      { name: "statementHash", type: "bytes32" },
      { name: "guidelinesHash", type: "bytes32" },
      { name: "evidenceRulesHash", type: "bytes32" },
      { name: "metadataUri", type: "string" }
    ],
    outputs: [{ name: "agreement", type: "address" }]
  },
  {
    type: "event",
    name: "AgreementCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "agreement", type: "address" },
      { indexed: true, name: "agentA", type: "address" },
      { indexed: false, name: "agentB", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "joinDeadlineSeconds", type: "uint256" },
      { indexed: false, name: "evidenceWindowSeconds", type: "uint256" },
      { indexed: false, name: "statementHash", type: "bytes32" },
      { indexed: false, name: "guidelinesHash", type: "bytes32" },
      { indexed: false, name: "evidenceRulesHash", type: "bytes32" },
      { indexed: false, name: "metadataUri", type: "string" }
    ]
  }
] as const;

export const agreementAbi = [
  {
    type: "function",
    name: "acceptAgreement",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "proposeOutcome",
    stateMutability: "nonpayable",
    inputs: [
      { name: "outcomeHash", type: "bytes32" },
      { name: "winner", type: "address" },
      { name: "agentAAmount", type: "uint256" },
      { name: "agentBAmount", type: "uint256" },
      { name: "uri", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "confirmOutcome",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposer", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "raiseDispute",
    stateMutability: "nonpayable",
    inputs: [{ name: "reasonUri", type: "string" }],
    outputs: []
  },
  {
    type: "function",
    name: "submitEvidence",
    stateMutability: "nonpayable",
    inputs: [{ name: "evidenceUri", type: "string" }],
    outputs: []
  },
  {
    type: "function",
    name: "claimFunds",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "submitJuryVerdict",
    stateMutability: "nonpayable",
    inputs: [
      { name: "verdictHash", type: "bytes32" },
      { name: "winner", type: "address" },
      { name: "agentAAmount", type: "uint256" },
      { name: "agentBAmount", type: "uint256" },
      { name: "uri", type: "string" }
    ],
    outputs: []
  }
] as const;
