import { HatsAccount1ofNClient, OperationType } from "../src";
import {
  HatsClient,
  HATS_V1,
  hatIdToTreeId,
  treeIdToTopHatId,
} from "@hatsprotocol/sdk-v1-core";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { createAnvil } from "@viem/anvil";
import { privateKeyToAccount } from "viem/accounts";
import type {
  PublicClient,
  WalletClient,
  PrivateKeyAccount,
  Address,
} from "viem";
import type { Anvil } from "@viem/anvil";
import type { ExecutionResult, Operation } from "../src";
import "dotenv/config";

describe("Client Tests", () => {
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let hatsAccountClient: HatsAccount1ofNClient;
  let hatsClient: HatsClient;
  let anvil: Anvil;

  let account1: PrivateKeyAccount;
  let account2: PrivateKeyAccount;
  let hat1: bigint;
  let hat1_1: bigint;

  beforeAll(async () => {
    anvil = createAnvil({
      forkUrl: process.env.SEPOLIA_RPC,
      startTimeout: 20000,
    });
    await anvil.start();

    account1 = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );

    account2 = privateKeyToAccount(
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    );

    // init Viem clients
    publicClient = createPublicClient({
      chain: sepolia,
      transport: http("http://127.0.0.1:8545"),
    });
    walletClient = createWalletClient({
      chain: sepolia,
      transport: http("http://127.0.0.1:8545"),
    });

    hatsAccountClient = new HatsAccount1ofNClient({
      publicClient,
      walletClient,
    });

    hatsClient = new HatsClient({
      chainId: sepolia.id,
      publicClient: publicClient,
      walletClient: walletClient,
    });

    const resHat1 = await hatsClient.mintTopHat({
      target: account1.address,
      details: "Tophat SDK",
      imageURI: "Tophat URI",
      account: account1,
    });
    hat1 = resHat1.hatId;

    const resHat1_1 = await hatsClient.createHat({
      admin: hat1,
      maxSupply: 3,
      eligibility: account1.address,
      toggle: account1.address,
      mutable: true,
      details: "1.1 details",
      imageURI: "1.1 URI",
      account: account1,
    });
    hat1_1 = resHat1_1.hatId;

    await hatsClient.mintHat({
      account: account1,
      hatId: hat1_1,
      wearer: account1.address,
    });
  }, 30000);

  describe("Create new account", () => {
    let hatsAccountInstance: Address;

    beforeAll(async () => {
      const res = await hatsAccountClient.createAccount({
        account: account1,
        hatId: hat1_1,
        salt: 1n,
      });

      hatsAccountInstance = res.newAccount;
    });

    test("Test hats account creation", async () => {
      const predictedHatsAccount =
        await hatsAccountClient.predictAccountAddress({
          hatId: hat1_1,
          salt: 1n,
        });

      expect(predictedHatsAccount).toBe(hatsAccountInstance);
    });

    describe("Execute from account", () => {
      let res: ExecutionResult;

      beforeAll(async () => {
        const calldata = hatsClient.mintTopHatCallData({
          target: hatsAccountInstance,
          details: "New Top Hat",
          imageURI: "New Image URI",
        });

        res = await hatsAccountClient.execute({
          account: account1,
          instance: hatsAccountInstance,
          operation: {
            to: HATS_V1,
            value: 0n,
            data: calldata.callData,
            operation: OperationType.Call,
          },
        });
      });

      test("Test execution", async () => {
        const predictedTopHatId = treeIdToTopHatId(hatIdToTreeId(hat1) + 1);
        const isWearer = await hatsClient.isWearerOfHat({
          wearer: hatsAccountInstance,
          hatId: predictedTopHatId,
        });

        expect(res.status).toBe("success");
        expect(isWearer).toBe(true);
      });

      test("Reverts with invalid signer", async () => {
        await expect(async () => {
          await hatsAccountClient.execute({
            account: account2,
            instance: hatsAccountInstance,
            operation: {
              to: account2.address,
              value: 1n,
              data: "0x",
              operation: OperationType.Call,
            },
          });
        }).rejects.toThrow(
          "Error: calling account is not wearing the required hat"
        );
      });

      test("Reverts with invalid operation", async () => {
        await expect(async () => {
          await hatsAccountClient.execute({
            account: account1,
            instance: hatsAccountInstance,
            operation: {
              to: account2.address,
              value: 0n,
              data: "0x",
              operation: 3 as unknown as OperationType,
            },
          });
        }).rejects.toThrow(
          "Error: only the call or delegatecall operations are supported"
        );
      });
    });

    describe("Batch execute from account", () => {
      let res: ExecutionResult;

      beforeAll(async () => {
        const calldata1 = hatsClient.mintTopHatCallData({
          target: hatsAccountInstance,
          details: "New Top Hat 1",
          imageURI: "New Image URI 1",
        });

        const calldata2 = hatsClient.mintTopHatCallData({
          target: hatsAccountInstance,
          details: "New Top Hat 2",
          imageURI: "New Image URI 2",
        });

        const operations: Operation[] = [
          {
            to: HATS_V1,
            value: 0n,
            data: calldata1.callData,
            operation: OperationType.Call,
          },
          {
            to: HATS_V1,
            value: 0n,
            data: calldata2.callData,
            operation: OperationType.Call,
          },
        ];

        res = await hatsAccountClient.executeBatch({
          account: account1,
          instance: hatsAccountInstance,
          operations,
        });
      });

      test("Test execution", async () => {
        const predictedTopHatId1 = treeIdToTopHatId(hatIdToTreeId(hat1) + 2);
        const predictedTopHatId2 = treeIdToTopHatId(hatIdToTreeId(hat1) + 3);
        const isWearer1 = await hatsClient.isWearerOfHat({
          wearer: hatsAccountInstance,
          hatId: predictedTopHatId1,
        });
        const isWearer2 = await hatsClient.isWearerOfHat({
          wearer: hatsAccountInstance,
          hatId: predictedTopHatId2,
        });

        expect(res.status).toBe("success");
        expect(isWearer1).toBe(true);
        expect(isWearer2).toBe(true);
      });
    });
  });

  afterAll(async () => {
    await anvil.stop();
  }, 30000);
});
