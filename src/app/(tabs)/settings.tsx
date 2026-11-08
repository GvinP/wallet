import { router } from 'expo-router';
import { Gauge, Globe, Info, KeyRound, Lock, Trash2 } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { NETWORKS } from '@/core/chain/networks';
import { authenticateWithBiometrics } from '@/core/security';
import { biometryIcon, useBiometryStatus } from '@/hooks/useBiometryStatus';
import { sensitiveGrants, settingsStore, type SensitiveAction } from '@/stores';
import type { ThemePreference } from '@/theme/preference';
import { appVersion } from '@/ui/appVersion';
import { NetworkPill } from '@/ui/NetworkPill';
import { PinPromptModal } from '@/ui/PinPromptModal';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { SettingsDivider, SettingsGroup, SettingsRow } from '@/ui/SettingsRow';
import { Text } from '@/ui/Text';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const PIN_PROMPTS: Record<SensitiveAction, { title: string; subtitle: string; route: string }> = {
  revealPhrase: {
    title: 'Show recovery phrase',
    subtitle: 'Enter your PIN to view your 12 words.',
    route: '/recovery-phrase',
  },
  deleteWallet: {
    title: 'Delete wallet',
    subtitle: 'Enter your PIN to continue.',
    route: '/delete-wallet',
  },
};

function SettingsScreen() {
  const { theme } = useUnistyles();
  const biometry = useBiometryStatus();
  const [pinFor, setPinFor] = useState<SensitiveAction | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const network = NETWORKS[settingsStore.network];
  const BioIcon = biometryIcon(biometry?.kind ?? 'biometrics');
  const bioLabel = biometry?.label ?? 'Biometrics';

  const toggleBiometrics = async (on: boolean) => {
    setBioError(null);
    if (!on) {
      settingsStore.setBiometricsEnabled(false);
      return;
    }
    // Prove the biometric works before relying on it for unlock and transfers.
    const result = await authenticateWithBiometrics(`Enable ${bioLabel} for Amethyst`);
    if (result.success) settingsStore.setBiometricsEnabled(true);
    else if (result.reason !== 'cancelled' && result.reason !== 'fallback') {
      setBioError(`${bioLabel} isn't available right now.`);
    }
  };

  const onPinSuccess = () => {
    if (!pinFor) return;
    const { route } = PIN_PROMPTS[pinFor];
    sensitiveGrants.grant(pinFor);
    setPinFor(null);
    router.push(route as '/recovery-phrase' | '/delete-wallet');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text variant="title">Settings</Text>

      <SettingsGroup title="Network">
        <SettingsRow
          icon={Globe}
          title="Network"
          right={<NetworkPill network={network} label="full" />}
          onPress={() => router.push('/network')}
        />
      </SettingsGroup>

      <SettingsGroup title="Appearance">
        <View style={styles.padded}>
          <SegmentedControl
            accessibilityLabel="Theme"
            options={THEME_OPTIONS}
            value={settingsStore.themePreference}
            onChange={(value) => settingsStore.setThemePreference(value)}
          />
        </View>
      </SettingsGroup>

      <SettingsGroup title="Security">
        <SettingsRow
          icon={BioIcon}
          title={`Unlock with ${bioLabel}`}
          subtitle={
            biometry && !biometry.available
              ? 'Not set up on this device'
              : (bioError ?? 'Also used to confirm transfers')
          }
          right={
            <Switch
              accessibilityLabel={`Unlock with ${bioLabel}`}
              value={settingsStore.biometricsEnabled && !!biometry?.available}
              disabled={!biometry?.available}
              onValueChange={toggleBiometrics}
              trackColor={{ false: theme.colors.surface2, true: theme.colors.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.colors.surface2}
            />
          }
        />
        <SettingsDivider />
        <SettingsRow
          icon={KeyRound}
          title="Show recovery phrase"
          subtitle="Requires your PIN"
          onPress={() => setPinFor('revealPhrase')}
        />
        <SettingsDivider />
        <SettingsRow icon={Lock} title="Auto-lock" subtitle="After 1 minute in the background" />
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <SettingsRow
          icon={Trash2}
          title="Delete wallet"
          subtitle="Remove it from this device"
          destructive
          onPress={() => setPinFor('deleteWallet')}
        />
      </SettingsGroup>

      <SettingsGroup title="About">
        <SettingsRow
          icon={Info}
          title="Version"
          right={<Text color="muted">{appVersion()}</Text>}
        />
        {__DEV__ ? (
          <>
            <SettingsDivider />
            <SettingsRow
              icon={Gauge}
              title="Dev: crypto benchmark"
              onPress={() => router.push('/dev/benchmark')}
            />
          </>
        ) : null}
      </SettingsGroup>

      <Text variant="caption" color="muted" align="center" style={styles.footer}>
        Amethyst · self-custody wallet for Polygon.{'\n'}Your keys never leave this device.
      </Text>

      <PinPromptModal
        visible={pinFor !== null}
        title={pinFor ? PIN_PROMPTS[pinFor].title : ''}
        subtitle={pinFor ? PIN_PROMPTS[pinFor].subtitle : undefined}
        onSuccess={onPinSuccess}
        onCancel={() => setPinFor(null)}
      />
    </ScrollView>
  );
}

export default observer(SettingsScreen);

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    paddingTop: rt.insets.top + theme.space(4),
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.space(10),
  },
  padded: {
    padding: theme.space(3),
  },
  footer: {
    marginTop: theme.space(8),
  },
}));
