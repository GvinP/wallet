import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { env } from '@/core/chain/env';
import { runWalletBenchmarks, type BenchmarkResult } from '@/dev/benchmarks';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/** Dev-only: measures crypto timings on the device. Uses a public test phrase only. */
export default function BenchmarkScreen() {
  const [results, setResults] = useState<BenchmarkResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!env.devTools) return <Redirect href="/" />;

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setResults(await runWalletBenchmarks());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Screen scroll>
      <Text variant="title">Crypto benchmark</Text>
      <Text color="muted" style={styles.subtitle}>
        {Platform.OS} {String(Platform.Version)} · median of 3 runs · test phrase only
      </Text>

      <Button title="Run" loading={running} onPress={run} />

      {error ? (
        <Text color="dangerText" style={styles.subtitle}>
          {error}
        </Text>
      ) : null}

      {results ? (
        <View style={styles.card}>
          {results.map((r) => (
            <View key={r.name} style={styles.row}>
              <Text variant="small" style={styles.name}>
                {r.name}
              </Text>
              <Text variant="label">{r.medianMs.toFixed(0)} ms</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  subtitle: {
    marginTop: theme.space(2),
    marginBottom: theme.space(6),
  },
  card: {
    marginTop: theme.space(6),
    padding: theme.space(4),
    gap: theme.space(3),
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space(3),
  },
  name: {
    flex: 1,
  },
}));
