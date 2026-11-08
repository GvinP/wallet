import { Platform } from 'react-native';

/** Color tokens from the spec (section 10). Both palettes must have identical keys. */
export const palettes = {
  dark: {
    bg: '#0F0D14',
    surface: '#1A1724',
    surface2: '#241F33',
    text: '#F4F2F8',
    muted: '#A39DB3',
    border: '#2E2840',
    accent: '#8247E5',
    accentText: '#B794F6',
    onAccent: '#FFFFFF',
    warnBg: '#3A2A0A',
    warnText: '#FFC266',
    okBg: '#0F2E1F',
    okText: '#5FD49A',
    dangerText: '#FF7A7A',
    tokenPol: '#8247E5',
    tokenUsdt: '#1F7A63',
    networkTestnet: '#FF9F1A',
    networkMainnet: '#2FBF71',
  },
  light: {
    bg: '#F7F5FB',
    surface: '#FFFFFF',
    surface2: '#EFEBF7',
    text: '#15121C',
    muted: '#5E5870',
    border: '#E2DCEE',
    accent: '#8247E5',
    accentText: '#6B35C9',
    onAccent: '#FFFFFF',
    warnBg: '#FFF1D6',
    warnText: '#7A4A00',
    okBg: '#DDF5E8',
    okText: '#106B3E',
    dangerText: '#C62828',
    tokenPol: '#8247E5',
    tokenUsdt: '#1F7A63',
    networkTestnet: '#FF9F1A',
    networkMainnet: '#2FBF71',
  },
} as const;

export type ColorName = keyof (typeof palettes)['dark'];

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
} as const;

/**
 * Type scale from the spec: screen title 26/700, balance 40/700, body 15–16, captions 13.
 * Weight comes from the font family — never set fontWeight with custom fonts (breaks Android).
 */
export const typography = {
  balance: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  small: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const radius = {
  sm: 10,
  md: 12,
  button: 16,
  card: 18,
  pill: 999,
} as const;

export const layout = {
  screenPadding: 20,
  buttonHeight: 56,
  minTapTarget: 44,
} as const;

/** 4pt spacing grid: space(5) === 20. */
export const space = (n: number) => n * 4;
