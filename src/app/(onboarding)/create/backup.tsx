import { Redirect, router } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { splitMnemonic } from '@/core/wallet';
import { onboardingDraft } from '@/stores';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { WordGrid } from '@/ui/WordGrid';

export default function BackupScreen() {
  usePreventScreenCapture();
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [words] = useState(() =>
    onboardingDraft.mode === 'create' ? splitMnemonic(onboardingDraft.mnemonic ?? '') : [],
  );

  if (words.length === 0) return <Redirect href="/welcome" />;

  return (
    <Screen scroll>
      <Header progress={{ step: 1, total: 3 }} />
      <Text variant="title">Back up your recovery phrase</Text>
      <Text color="muted" style={styles.subtitle}>
        Write these {words.length} words down in order and keep them somewhere safe and offline.
        They are the only way to restore your wallet.
      </Text>

      <WordGrid words={words} revealed={revealed} onReveal={() => setRevealed(true)} />

      <View style={styles.banner}>
        <Banner text="Anyone with these words can take your funds. Never share them — Amethyst will never ask for them." />
      </View>

      <View style={styles.footer}>
        <Checkbox
          checked={confirmed}
          onChange={setConfirmed}
          disabled={!revealed}
          label="I've written it down somewhere safe"
        />
        <Button
          title="Continue"
          disabled={!confirmed}
          onPress={() => router.push('/create/verify')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  subtitle: {
    marginTop: theme.space(2),
    marginBottom: theme.space(5),
  },
  banner: {
    marginTop: theme.space(5),
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.space(6),
    gap: theme.space(3),
  },
}));
