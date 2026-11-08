/**
 * Minimal async key-value contract for secrets. The production implementation is
 * expo-secure-store (Keychain / Android Keystore); tests use an in-memory one.
 */
export interface SecureKeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/** All SecureStore keys in one place. Allowed characters: [A-Za-z0-9._-]. */
export const SECURE_KEYS = {
  mnemonic: 'wallet.mnemonic',
  seed: 'wallet.seed',
  pinRecord: 'security.pin',
  pinAttempts: 'security.pinAttempts',
} as const;

export function createMemorySecureStore(
  initial: Record<string, string> = {},
): SecureKeyValueStore & {
  dump(): Record<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    async get(key) {
      return data.get(key) ?? null;
    },
    async set(key, value) {
      data.set(key, value);
    },
    async delete(key) {
      data.delete(key);
    },
    dump: () => Object.fromEntries(data),
  };
}
