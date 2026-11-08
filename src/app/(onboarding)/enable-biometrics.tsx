import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { authenticateWithBiometrics } from '@/core/security';
import { useBiometryStatus } from '@/hooks/useBiometryStatus';
import { BiometryIcon } from '@/ui/BiometryIcon';
import { sessionStore, settingsStore } from '@/stores';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function EnableBiometricsScreen() {
  const { theme } = useUnistyles();
  const biometry = useBiometryStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = biometry?.label ?? 'Biometrics';

  // The wallet is already saved here — going "back" to the PIN screens makes no sense.
  // Android back acts as "Not now"; the iOS swipe is disabled in the layout.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      sessionStore.finishOnboarding();
      return true;
    });
    return () => sub.remove();
  }, []);

  const enable = async () => {
    setBusy(true);
    setError(null);
    const result = await authenticateWithBiometrics(`Enable ${label} for Amethyst`);
    setBusy(false);
    if (result.success) {
      settingsStore.setBiometricsEnabled(true);
      sessionStore.finishOnboarding();
    } else if (result.reason !== 'cancelled' && result.reason !== 'fallback') {
      setError(`${label} isn't available right now. You can enable it later in Settings.`);
    }
  };

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.iconTile}>
          <BiometryIcon
            kind={biometry?.kind ?? 'biometrics'}
            size={44}
            color={theme.colors.accentText}
            strokeWidth={1.5}
          />
        </View>
        <Text variant="title" align="center" style={styles.title}>
          Unlock with {label}?
        </Text>
        <Text color="muted" align="center" style={styles.text}>
          Open Amethyst and confirm transfers with {label}. Your PIN always works as a backup.
        </Text>
        {error ? (
          <Text variant="small" color="dangerText" align="center" style={styles.text}>
            {error}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button title={`Enable ${label}`} loading={busy} onPress={enable} />
        <Button
          title="Not now"
          variant="outline"
          disabled={busy}
          onPress={() => sessionStore.finishOnboarding()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTile: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  title: {
    marginTop: theme.space(6),
  },
  text: {
    marginTop: theme.space(3),
  },
  actions: {
    gap: theme.space(3),
  },
}));
