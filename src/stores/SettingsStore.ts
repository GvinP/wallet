import { makeAutoObservable } from 'mobx';

import {
  DEFAULT_NETWORK,
  isNetworkAvailable,
  NETWORKS,
  type NetworkId,
} from '@/core/chain/networks';
import { storage } from '@/core/storage/mmkv';
import {
  applyThemePreference,
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from '@/theme/preference';

const BIOMETRICS_KEY = 'settings.biometricsEnabled';
const NETWORK_KEY = 'settings.network';

function readNetwork(): NetworkId {
  const stored = storage.getString(NETWORK_KEY);
  return stored && stored in NETWORKS && isNetworkAvailable(stored as NetworkId)
    ? (stored as NetworkId)
    : DEFAULT_NETWORK;
}

export class SettingsStore {
  themePreference: ThemePreference;
  biometricsEnabled: boolean;
  network: NetworkId;

  constructor() {
    this.themePreference = readThemePreference();
    this.biometricsEnabled = storage.getBoolean(BIOMETRICS_KEY) ?? false;
    this.network = readNetwork();
    makeAutoObservable(this);
  }

  /** The address stays the same on every network; queries are keyed by network id. */
  setNetwork(id: NetworkId) {
    if (!isNetworkAvailable(id) || id === this.network) return;
    this.network = id;
    storage.set(NETWORK_KEY, id);
  }

  setThemePreference(preference: ThemePreference) {
    if (preference === this.themePreference) return;
    this.themePreference = preference;
    writeThemePreference(preference);
    applyThemePreference(preference);
  }

  setBiometricsEnabled(enabled: boolean) {
    this.biometricsEnabled = enabled;
    storage.set(BIOMETRICS_KEY, enabled);
  }
}
