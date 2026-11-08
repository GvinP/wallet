import { mnemonicToSeed as scureMnemonicToSeed } from '@scure/bip39';
import { bytesToHex, type Address, type Hex } from 'viem';
import { HDKey, privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';

/** First account of the first address — the same path MetaMask uses for "Account 1". */
export const DERIVATION_PATH = "m/44'/60'/0'/0/0";

/**
 * BIP39 mnemonic → 64-byte seed (PBKDF2-HMAC-SHA512, 2048 rounds).
 * This is the slow step; the async variant yields to the event loop so the UI stays responsive.
 * Expects an already validated + normalized mnemonic.
 */
export function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
  return scureMnemonicToSeed(mnemonic);
}

/** Overwrites a buffer with zeros. Best effort: JS can't guarantee no copies were made. */
export function wipeBytes(bytes: Uint8Array | null | undefined): void {
  bytes?.fill(0);
}

function derivePrivateKey(seed: Uint8Array): Hex {
  const master = HDKey.fromMasterSeed(seed);
  const child = master.derive(DERIVATION_PATH);
  try {
    if (!child.privateKey) throw new Error('Derivation produced no private key');
    return bytesToHex(child.privateKey);
  } finally {
    child.wipePrivateData();
    master.wipePrivateData();
  }
}

/**
 * Seed → signing account. Fast (BIP32 only, no PBKDF2).
 * Callers must keep the returned account short-lived: create it right before
 * signing and drop the reference afterwards (see Vault.withSigner).
 */
export function deriveAccount(seed: Uint8Array): PrivateKeyAccount {
  return privateKeyToAccount(derivePrivateKey(seed));
}

/** Seed → checksummed address. The private key never leaves this function. */
export function deriveAddress(seed: Uint8Array): Address {
  return deriveAccount(seed).address;
}
