import { Redirect, router } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { vault } from '@/core/security';
import { splitMnemonic } from '@/core/wallet';
import { sensitiveGrants } from '@/stores';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { WordGrid } from '@/ui/WordGrid';

/**
 * Spec §6.6 / §7: only after the PIN; screenshots blocked; hidden until "Show".
 * The phrase lives only in this component's state and is dropped on unmount.
 */
export default function RecoveryPhraseScreen() {
  usePreventScreenCapture();
  // Consumed once on mount: navigation alone (deep link, back stack) can't open this screen.
  const [allowed] = useState(() => sensitiveGrants.consume('revealPhrase'));
  const [words, setWords] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    vault
      .revealMnemonic()
      .then((m) => alive && setWords(splitMnemonic(m)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
      setWords(null);
    };
  }, [allowed]);

  // Hide again whenever the app leaves the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s !== 'active' && setRevealed(false));
    return () => sub.remove();
  }, []);

  if (!allowed) return <Redirect href="/settings" />;

  return (
    <Screen scroll>
      <Header title="Recovery phrase" />
      <Text color="muted" style={styles.subtitle}>
        These {words?.length ?? 12} words restore your wallet on any device. Keep them offline and
        never share them.
      </Text>

      {error ? (
        <Banner tone="danger" text="Couldn't read the recovery phrase from secure storage." />
      ) : words ? (
        <WordGrid words={words} revealed={revealed} onReveal={() => setRevealed(true)} />
      ) : null}

      <View style={styles.banner}>
        <Banner text="Anyone with these words can take your funds. Amethyst will never ask for them." />
      </View>

      <View style={styles.footer}>
        <Button title="Done" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  subtitle: {
    marginTop: theme.space(1),
    marginBottom: theme.space(5),
  },
  banner: {
    marginTop: theme.space(5),
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.space(6),
  },
}));
