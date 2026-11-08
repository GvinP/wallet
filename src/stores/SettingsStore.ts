import { makeAutoObservable } from 'mobx';

import { storage } from '@/core/storage/mmkv';
import {
  applyThemePreference,
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from '@/theme/preference';

const BIOMETRICS_KEY = 'settings.biometricsEnabled';

export class SettingsStore {
  themePreference: ThemePreference;
  biometricsEnabled: boolean;

  constructor() {
    this.themePreference = readThemePreference();
    this.biometricsEnabled = storage.getBoolean(BIOMETRICS_KEY) ?? false;
    makeAutoObservable(this);
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
