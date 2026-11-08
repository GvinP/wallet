import * as SecureStore from 'expo-secure-store';

import type { SecureKeyValueStore } from './secureStore';

/**
 * WHEN_UNLOCKED_THIS_DEVICE_ONLY: readable only while the device is unlocked and never
 * migrated to another device via backups/restores. On Android, expo-secure-store data
 * is excluded from Auto Backup by its config plugin.
 *
 * We don't use `requireAuthentication` here: access is gated by our own app lock
 * (biometrics with PIN fallback), which an OS-level biometric binding would break.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const expoSecureStore: SecureKeyValueStore = {
  get: (key) => SecureStore.getItemAsync(key, OPTIONS),
  set: (key, value) => SecureStore.setItemAsync(key, value, OPTIONS),
  delete: (key) => SecureStore.deleteItemAsync(key, OPTIONS),
};
