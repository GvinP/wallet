import { Appearance } from 'react-native';
import { UnistylesRuntime } from 'react-native-unistyles';

import { storage } from '@/core/storage/mmkv';

export const THEME_PREFERENCES = ['system', 'dark', 'light'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

const KEY = 'settings.themePreference';

const isThemePreference = (value: unknown): value is ThemePreference =>
  THEME_PREFERENCES.includes(value as ThemePreference);

export function readThemePreference(): ThemePreference {
  const value = storage.getString(KEY);
  return isThemePreference(value) ? value : 'system';
}

export function writeThemePreference(preference: ThemePreference): void {
  storage.set(KEY, preference);
}

/**
 * Forces the OS-level appearance too, so native UI (keyboard, alerts, pickers)
 * matches the in-app theme when the user picks dark/light manually.
 */
export function applyNativeAppearance(preference: ThemePreference): void {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

/** Applies a preference at runtime (after StyleSheet.configure has run). */
export function applyThemePreference(preference: ThemePreference): void {
  applyNativeAppearance(preference);
  if (preference === 'system') {
    UnistylesRuntime.setAdaptiveThemes(true);
  } else {
    UnistylesRuntime.setAdaptiveThemes(false);
    UnistylesRuntime.setTheme(preference);
  }
}
