import { router } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { onboardingDraft, sessionStore } from '@/stores';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/**
 * "Forgot PIN?" from the lock screen. The PIN can't be recovered — the only way back in is to
 * remove the wallet from this device and import it again with the recovery phrase.
 * This flow can only *delete*; it never reveals anything, so it needs no PIN.
 */
export default function ForgotPinScreen() {
  const { theme } = useUnistyles();
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    // The gate (src/app/index.tsx) sends an "import" draft straight to the import screen
    // once the route guards switch to onboarding.
    await sessionStore.resetWallet(() => onboardingDraft.start('import'));
  };

  return (
    <Screen>
      <Header title="Forgot PIN?" />
      <View style={styles.center}>
        <View style={styles.icon}>
          <KeyRound size={34} color={theme.colors.accentText} />
        </View>
        <Text variant="title" align="center" style={styles.title}>
          Restore with your phrase
        </Text>
        <Text color="muted" align="center">
          {
            "Your PIN can't be recovered. To get back in, remove the wallet from this device and import it again with your 12 or 24-word recovery phrase. Your funds are safe on the blockchain."
          }
        </Text>
      </View>

      <Banner text="Without the recovery phrase you will lose access to this wallet for good." />

      <View style={styles.actions}>
        <Checkbox checked={understood} onChange={setUnderstood} label="I have my recovery phrase" />
        <Button
          title="Reset and import"
          variant="danger"
          disabled={!understood}
          loading={busy}
          onPress={reset}
        />
        <Button title="Back" variant="outline" disabled={busy} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space(2),
    paddingHorizontal: theme.space(2),
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  title: {
    marginTop: theme.space(3),
  },
  actions: {
    marginTop: theme.space(5),
    gap: theme.space(3),
  },
}));
