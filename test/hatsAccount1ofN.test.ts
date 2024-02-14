import { HatsAccount1ofNClient } from "../src";
import { HatsClient } from "@hatsprotocol/sdk-v1-core";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { createAnvil } from "@viem/anvil";
import { privateKeyToAccount } from "viem/accounts";
import type { PublicClient, WalletClient, PrivateKeyAccount } from "viem";
import type { Anvil } from "@viem/anvil";
import "dotenv/config";

describe("Client Tests", () => {
  let publicClient: PublicClient;
  let walletClient: WalletClient;
  let hatsAccountClient: HatsAccount1ofNClient;
  let hatsClient: HatsClient;
  let anvil: Anvil;

  let account1: PrivateKeyAccount;
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
  }, 30000);

  test("Test hats account creation", async () => {
    const predictedHatsAccount = await hatsAccountClient.predictAccountAddress({
      hatId: hat1_1,
      salt: 1n,
    });

    const res = await hatsAccountClient.createAccount({
      account: account1,
      hatId: hat1_1,
      salt: 1n,
    });
    const createdHatsAccount = res.newAccount;

    expect(predictedHatsAccount).toBe(createdHatsAccount);
  });

  afterAll(async () => {
    await anvil.stop();
  }, 30000);
});
