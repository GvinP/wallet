import { Appearance } from 'react-native';
import { UnistylesRuntime } from 'react-native-unistyles';

import { storage } from '@/core/storage/mmkv';

import { SettingsStore } from '../SettingsStore';

describe('SettingsStore', () => {
  beforeEach(() => {
    storage.clearAll();
    jest.restoreAllMocks();
  });

  it('defaults to the system theme', () => {
    expect(new SettingsStore().themePreference).toBe('system');
  });

  it('ignores garbage in storage', () => {
    storage.set('settings.themePreference', 'neon');
    expect(new SettingsStore().themePreference).toBe('system');
  });

  it('persists the preference and restores it in a new instance', () => {
    new SettingsStore().setThemePreference('dark');
    expect(new SettingsStore().themePreference).toBe('dark');
  });

  it('applies a manual theme to Unistyles and the native appearance', () => {
    const setTheme = jest.spyOn(UnistylesRuntime, 'setTheme');
    const setAdaptive = jest.spyOn(UnistylesRuntime, 'setAdaptiveThemes');
    const setScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

    new SettingsStore().setThemePreference('light');

    expect(setAdaptive).toHaveBeenCalledWith(false);
    expect(setTheme).toHaveBeenCalledWith('light');
    expect(setScheme).toHaveBeenCalledWith('light');
  });

  it('switches back to adaptive themes for "system"', () => {
    storage.set('settings.themePreference', 'dark');
    const setAdaptive = jest.spyOn(UnistylesRuntime, 'setAdaptiveThemes');
    const setScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

    new SettingsStore().setThemePreference('system');

    expect(setAdaptive).toHaveBeenCalledWith(true);
    expect(setScheme).toHaveBeenCalledWith('unspecified');
  });
});
