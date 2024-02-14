import { PublicClient, WalletClient, decodeEventLog } from "viem";
import {
  MissingPublicClientError,
  MissingWalletClientError,
  ChainIdMismatchError,
  NoChainError,
  ChainNotSupportedError,
  getRegistryError,
} from "../errors";
import {
  HATS_ACCOUNT_1OFN_IMPLEMENTATION,
  ERC6551_REGISTRY,
  ERC6551_REGISTRY_ABI,
  HATS,
} from "../constants";
import type { CreateAccountResult } from "../types";
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
}
