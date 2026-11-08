import { makeAutoObservable } from 'mobx';

import {
  applyThemePreference,
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from '@/theme/preference';

export class SettingsStore {
  themePreference: ThemePreference;

  constructor() {
    this.themePreference = readThemePreference();
    makeAutoObservable(this);
  }

  setThemePreference(preference: ThemePreference) {
    if (preference === this.themePreference) return;
    this.themePreference = preference;
    writeThemePreference(preference);
    applyThemePreference(preference);
  }
}
