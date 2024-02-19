import { OperationType } from "./constants";
import type { Address, Hex } from "viem";

export interface TransactionResult {
  status: "success" | "reverted";
  transactionHash: Address;
}

export interface CreateAccountResult extends TransactionResult {
  newAccount: Address;
}

export interface ExecutionResult extends TransactionResult {}

export interface Operation {
  to: Address;
  value: bigint;
  data: Hex;
  operation: OperationType;
}
