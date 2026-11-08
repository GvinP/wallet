import { bytesToHex, hexToBytes, type Address, type Hex } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';

import {
  deriveAccount,
  deriveAddress,
  mnemonicToSeed,
  validateMnemonic,
  wipeBytes,
} from '../wallet';
import { SECURE_KEYS, type SecureKeyValueStore } from './secureStore';

export class InvalidMnemonicError extends Error {
  constructor() {
    super('Invalid recovery phrase');
    this.name = 'InvalidMnemonicError';
  }
}

export class NoWalletError extends Error {
  constructor() {
    super('No wallet on this device');
    this.name = 'NoWalletError';
  }
}

/**
 * The only place that reads or writes wallet secrets.
 *
 * Storage layout (SecureStore):
 * - `wallet.seed`     — 64-byte BIP39 seed (hex). Lets us sign without re-running PBKDF2.
 * - `wallet.mnemonic` — the phrase, only for "Show recovery phrase". Written last and
 *                       acts as the commit marker: a wallet exists only if both are present.
 */
export class Vault {
  constructor(private readonly store: SecureKeyValueStore) {}

  async hasWallet(): Promise<boolean> {
    const [mnemonic, seed] = await Promise.all([
      this.store.get(SECURE_KEYS.mnemonic),
      this.store.get(SECURE_KEYS.seed),
    ]);
    return mnemonic !== null && seed !== null;
  }

  /**
   * Validates the phrase, derives the seed and stores both. Replaces any existing wallet.
   * Returns the public address so the caller can cache it outside SecureStore.
   */
  async importMnemonic(input: string): Promise<{ address: Address }> {
    const validation = validateMnemonic(input);
    if (!validation.ok) throw new InvalidMnemonicError();

    const seed = await mnemonicToSeed(validation.mnemonic);
    try {
      const address = deriveAddress(seed);
      await this.wipe();
      await this.store.set(SECURE_KEYS.seed, bytesToHex(seed));
      await this.store.set(SECURE_KEYS.mnemonic, validation.mnemonic);
      return { address };
    } finally {
      wipeBytes(seed);
    }
  }

  /** Re-derives the address from the stored seed (fast, no PBKDF2). */
  async getAddress(): Promise<Address> {
    return this.withSeed(deriveAddress);
  }

  /**
   * Gives `fn` a signing account for the duration of the call only.
   * The seed buffer is zeroed afterwards; don't keep the account reference.
   */
  async withSigner<T>(fn: (account: PrivateKeyAccount) => Promise<T>): Promise<T> {
    const account = await this.withSeed(deriveAccount);
    return fn(account);
  }

  /** For "Show recovery phrase" only — callers must have re-checked the PIN. */
  async revealMnemonic(): Promise<string> {
    const mnemonic = await this.store.get(SECURE_KEYS.mnemonic);
    if (mnemonic === null) throw new NoWalletError();
    return mnemonic;
  }

  /** Deletes the wallet secrets. Callers must have checked the PIN and asked for confirmation. */
  async wipe(): Promise<void> {
    // Mnemonic first: it is the commit marker, so a crash mid-way leaves "no wallet".
    await this.store.delete(SECURE_KEYS.mnemonic);
    await this.store.delete(SECURE_KEYS.seed);
  }

  private async withSeed<T>(fn: (seed: Uint8Array) => T): Promise<T> {
    const seedHex = await this.store.get(SECURE_KEYS.seed);
    if (seedHex === null || (await this.store.get(SECURE_KEYS.mnemonic)) === null) {
      throw new NoWalletError();
    }
    const seed = hexToBytes(seedHex as Hex);
    try {
      return fn(seed);
    } finally {
      wipeBytes(seed);
    }
  }
}
