import { observer } from 'mobx-react-lite';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { settingsStore } from '@/stores';
import type { ThemePreference } from '@/theme/preference';
import { palettes, type ColorName } from '@/theme/tokens';
import { ScreenStub } from '@/ui/ScreenStub';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Text } from '@/ui/Text';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const SWATCHES = Object.keys(palettes.dark) as ColorName[];

function SettingsScreen() {
  return (
    <ScreenStub
      title="Settings"
      phase={7}
      bottomInset={false}
      description="Network, biometrics, show recovery phrase, delete wallet and app version come later."
    >
      <View style={styles.section}>
        <Text variant="caption" color="muted" style={styles.sectionTitle}>
          APPEARANCE
        </Text>
        <SegmentedControl
          accessibilityLabel="Theme"
          options={THEME_OPTIONS}
          value={settingsStore.themePreference}
          onChange={(value) => settingsStore.setThemePreference(value)}
        />
      </View>

      <View style={styles.section}>
        <Text variant="caption" color="muted" style={styles.sectionTitle}>
          THEME TOKENS
        </Text>
        <View style={styles.card}>
          {SWATCHES.map((name) => (
            <View key={name} style={styles.swatchRow}>
              <View style={styles.swatch(name)} />
              <Text variant="small">{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenStub>
  );
}

export default observer(SettingsScreen);

const styles = StyleSheet.create((theme) => ({
  section: {
    marginTop: theme.space(6),
  },
  sectionTitle: {
    marginBottom: theme.space(2),
    letterSpacing: 0.6,
  },
  card: {
    padding: theme.space(4),
    gap: theme.space(2),
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
  },
  swatch: (name: ColorName) => ({
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors[name],
  }),
}));
