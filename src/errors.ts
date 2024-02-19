import { BaseError, ContractFunctionRevertedError } from "viem";

export class ChainIdMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChainIdMismatchError";
  }
}

export class MissingPublicClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingPublicClientError";
  }
}

export class MissingWalletClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingWalletClientError";
  }
}

export class NoChainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoChainError";
  }
}

export class ChainNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChainNotSupportedError";
  }
}

export class AccountCreationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountCreationFailedError";
  }
}

export class InvalidSignerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSignerError";
  }
}

export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOperationError";
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function getRegistryError(err: unknown): never {
  if (err instanceof BaseError) {
    const revertError = err.walk(
      (err) => err instanceof ContractFunctionRevertedError
    );
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? "";
      //const errorArgs = revertError.data?.args as any[];
      switch (errorName) {
        case "AccountCreationFailed": {
          throw new AccountCreationFailedError(
            `Error: account creation has failed`
          );
        }
        default: {
          throw err;
        }
      }
    } else {
      throw err;
    }
  } else {
    if (err instanceof Error) {
      throw err;
    } else {
      throw new Error("Unexpected error occured");
    }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function getHatsAccount1OfNError(err: unknown): never {
  if (err instanceof BaseError) {
    const revertError = err.walk(
      (err) => err instanceof ContractFunctionRevertedError
    );
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? "";
      //const errorArgs = revertError.data?.args as any[];
      switch (errorName) {
        case "InvalidSigner": {
          throw new InvalidSignerError(
            `Error: calling account is not wearing the required hat`
          );
        }
        case "InvalidOperation": {
          throw new InvalidOperationError(
            `Error: only the call or delegatecall operations are supported`
          );
        }
        default: {
          throw err;
        }
      }
    } else {
      throw err;
    }
  } else {
    if (err instanceof Error) {
      throw err;
    } else {
      throw new Error("Unexpected error occured");
    }
  }
}
