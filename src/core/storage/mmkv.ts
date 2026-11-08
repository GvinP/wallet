import { createMMKV } from 'react-native-mmkv';

/**
 * Non-secret app data only: settings, cached public address, pending tx hashes.
 * Secrets (mnemonic, seed, PIN hash) live exclusively in expo-secure-store.
 */
export const storage = createMMKV({ id: 'amethyst' });
