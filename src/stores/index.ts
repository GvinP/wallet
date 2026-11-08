import { SettingsStore } from './SettingsStore';

// App-wide singletons. SessionStore, WalletStore and PendingTxStore arrive in later phases.
export const settingsStore = new SettingsStore();
