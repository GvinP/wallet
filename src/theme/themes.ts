import { fonts, layout, palettes, radius, space, typography } from './tokens';

const shared = { fonts, typography, radius, layout, space } as const;

export const darkTheme = { scheme: 'dark', colors: palettes.dark, ...shared } as const;
export const lightTheme = { scheme: 'light', colors: palettes.light, ...shared } as const;

export const appThemes = {
  dark: darkTheme,
  light: lightTheme,
};

export type AppThemes = typeof appThemes;
export type ThemeName = keyof AppThemes;
