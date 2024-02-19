import { PublicClient, WalletClient, decodeEventLog } from "viem";
import {
  MissingPublicClientError,
  MissingWalletClientError,
  ChainIdMismatchError,
  NoChainError,
  ChainNotSupportedError,
  getRegistryError,
  getHatsAccount1OfNError,
} from "../errors";
import {
  HATS_ACCOUNT_1OFN_IMPLEMENTATION,
  HATS_ACCOUNT_1OFN_ABI,
  ERC6551_REGISTRY,
  ERC6551_REGISTRY_ABI,
  HATS,
} from "../constants";
import type { CreateAccountResult, ExecutionResult, Operation } from "../types";
import type { Account, Address } from "viem";

export class HatsAccount1ofNClient {
  private readonly _publicClient: PublicClient;
  private readonly _walletClient: WalletClient;
  private readonly _chainId: string;

  /**
   * Create a HatsAccount1ofNClient
   *
   * @param publicClient Viem Public Client
   * @param walletClient Viem Wallet Client
   * @returns A HatsAccount1ofNClient instance
   */
  constructor({
    publicClient,
    walletClient,
  }: {
    publicClient: PublicClient;
    walletClient: WalletClient;
  }) {
    if (publicClient === undefined) {
      throw new MissingPublicClientError("Error: public client is required");
    }
    if (walletClient === undefined) {
      throw new MissingWalletClientError("Error: wallet client is required");
    }
    if (walletClient.chain?.id !== publicClient.chain?.id) {
      throw new ChainIdMismatchError(
        "Error: provided chain id should match the wallet client chain id"
      );
    }
    if (walletClient.chain === undefined) {
      throw new NoChainError("Error: Viem client with no chain");
    }
    if (
      !Object.keys(HATS_ACCOUNT_1OFN_IMPLEMENTATION).includes(
        walletClient.chain.id.toString()
      )
    ) {
      throw new ChainNotSupportedError(
        `Error: chain ID ${walletClient.chain.id} is not supported`
      );
    }

    this._publicClient = publicClient;
    this._walletClient = walletClient;
    this._chainId = walletClient.chain.id.toString();
  }

  /**
   * Deploy a new 1 of N Hats Account instance
   *
   * @param account A Viem account
   * @param hatId ID of the hat for which to create the account
   * @param salt arbitrary number as "salt"
   * @returns An object containing the status of the call, the transaction hash and the new Hats Account instance
   */
  async createAccount({
    account,
    hatId,
    salt,
  }: {
    account: Account | Address;
    hatId: bigint;
    salt: bigint;
  }): Promise<CreateAccountResult> {
    try {
      const { request } = await this._publicClient.simulateContract({
        address: ERC6551_REGISTRY,
        abi: ERC6551_REGISTRY_ABI,
        functionName: "createAccount",
        args: [
          HATS_ACCOUNT_1OFN_IMPLEMENTATION[this._chainId],
          `0x${salt.toString(16).padStart(64, "0")}`,
          BigInt(Number(this._chainId)),
          HATS,
          hatId,
        ],
        account,
      });

      const hash = await this._walletClient.writeContract(request);

      const receipt = await this._publicClient.waitForTransactionReceipt({
        hash,
      });

      let newHatsAccount: Address | undefined;
      for (let eventIndex = 0; eventIndex < receipt.logs.length; eventIndex++) {
        try {
          const event = decodeEventLog({
            abi: ERC6551_REGISTRY_ABI,
            eventName: "ERC6551AccountCreated",
            data: receipt.logs[eventIndex].data,
            topics: receipt.logs[eventIndex].topics,
          });

          newHatsAccount = event.args.account;
          break;
        } catch (err) {
          // continue
        }
      }

      if (newHatsAccount === undefined) {
        throw new Error("Unexpected Error");
      }

      return {
        status: receipt.status,
        transactionHash: receipt.transactionHash,
        newAccount: newHatsAccount,
      };
    } catch (err) {
      getRegistryError(err);
    }
  }

  /**
   * Perdict the address of a 1 of N Hats Account instance
   *
   * @param account A Viem account
   * @param hatId ID of the hat for the account
   * @param salt arbitrary number as "salt"
   * @returns The predicted 1 of N Hats Account address
   */
  async predictAccountAddress({
    hatId,
    salt,
  }: {
    hatId: bigint;
    salt: bigint;
  }): Promise<Address> {
    const account = await this._publicClient.readContract({
      address: ERC6551_REGISTRY,
      abi: ERC6551_REGISTRY_ABI,
      functionName: "account",
      args: [
        HATS_ACCOUNT_1OFN_IMPLEMENTATION[this._chainId],
        `0x${salt.toString(16).padStart(64, "0")}`,
        BigInt(Number(this._chainId)),
        HATS,
        hatId,
      ],
    });

    return account;
  }

  /**
   * Execute an operation. Only wearers of the account's hat can execute.
   *
   * @param account A Viem account
   * @param instance The Hats Account instance
   * @param operation The operation to execute, includes:
   * - to: The target address of the operation
   * - value: The Ether value to be sent to the target
   * - data: The encoded operation calldata
   * - operation: A value indicating the type of operation to perform (call or delegatecall)
   * @returns An object containing the status of the call and the transaction hash
   */
  async execute({
    account,
    instance,
    operation,
  }: {
    account: Account | Address;
    instance: Address;
    operation: Operation;
  }): Promise<ExecutionResult> {
    try {
      const { request } = await this._publicClient.simulateContract({
        address: instance,
        abi: HATS_ACCOUNT_1OFN_ABI,
        functionName: "execute",
        args: [
          operation.to,
          operation.value,
          operation.data,
          operation.operation,
        ],
        account,
      });

      const hash = await this._walletClient.writeContract(request);

      const receipt = await this._publicClient.waitForTransactionReceipt({
        hash,
      });

      return {
        status: receipt.status,
        transactionHash: receipt.transactionHash,
      };
    } catch (err) {
      getHatsAccount1OfNError(err);
    }
  }

  /**
   * Execute a batch of operations. Only wearers of the account's hat can execute.
   *
   * @param account A Viem account
   * @param instance The Hats Account instance
   * @param operations The operations to execute, for each operation includes:
   * - to: The target address of the operation
   * - value: The Ether value to be sent to the target
   * - data: The encoded operation calldata
   * - operation: A value indicating the type of operation to perform (call or delegatecall)
   * @returns An object containing the status of the call and the transaction hash
   */
  async executeBatch({
    account,
    instance,
    operations,
  }: {
    account: Account | Address;
    instance: Address;
    operations: Operation[];
  }): Promise<ExecutionResult> {
    try {
      const { request } = await this._publicClient.simulateContract({
        address: instance,
        abi: HATS_ACCOUNT_1OFN_ABI,
        functionName: "executeBatch",
        args: [operations],
        account,
      });

      const hash = await this._walletClient.writeContract(request);

      const receipt = await this._publicClient.waitForTransactionReceipt({
        hash,
      });

      return {
        status: receipt.status,
        transactionHash: receipt.transactionHash,
      };
    } catch (err) {
      getHatsAccount1OfNError(err);
    }
  }
}
