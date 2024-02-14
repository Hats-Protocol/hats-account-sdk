import type { Address } from "viem";

export const HATS_ACCOUNT_1OFN_IMPLEMENTATION: { [chainID: string]: Address } =
  {
    11155111: "0x5CB8a5B063B7E94cF39E8A8813A777f49B8DD050",
  };

export const ERC6551_REGISTRY = "0x000000006551c19487814612e58FE06813775758";

export const HATS = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137";

export const ERC6551_REGISTRY_ABI = [
  { inputs: [], name: "AccountCreationFailed", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "tokenContract",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ERC6551AccountCreated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "implementation", type: "address" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      { internalType: "uint256", name: "chainId", type: "uint256" },
      { internalType: "address", name: "tokenContract", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "account",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "implementation", type: "address" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      { internalType: "uint256", name: "chainId", type: "uint256" },
      { internalType: "address", name: "tokenContract", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "createAccount",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
