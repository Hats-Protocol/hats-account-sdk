import type { Address } from "viem";

export interface TransactionResult {
  status: "success" | "reverted";
  transactionHash: Address;
}

export interface CreateAccountResult extends TransactionResult {
  newAccount: Address;
}
