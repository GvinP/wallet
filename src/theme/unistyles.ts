import { StyleSheet } from 'react-native-unistyles';

import { applyNativeAppearance, readThemePreference } from './preference';
import { appThemes, type AppThemes } from './themes';

declare module 'react-native-unistyles' {
  // Module augmentation pattern required by Unistyles for typed themes.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

// `adaptiveThemes` and `initialTheme` are mutually exclusive in Unistyles,
// so the stored preference decides which one we pass.
const preference = readThemePreference();

StyleSheet.configure({
  themes: appThemes,
  settings: preference === 'system' ? { adaptiveThemes: true } : { initialTheme: preference },
});

applyNativeAppearance(preference);
