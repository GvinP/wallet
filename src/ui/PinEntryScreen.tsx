import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PIN_LENGTH } from '@/core/security/pin';

import { Header } from './Header';
import { Keypad, PinDots } from './PinPad';
import { Screen } from './Screen';
import { Text } from './Text';

type PinEntryScreenProps = {
  title: string;
  subtitle: string;
  progress?: { step: number; total: number };
  /** Called with the full PIN. Return an error message to show it; the dots are cleared either way. */
  onComplete: (pin: string) => Promise<string | null> | string | null;
  busyText?: string;
  footer?: ReactNode;
};

/** Shared layout for "Create a PIN" / "Confirm your PIN". */
export function PinEntryScreen({
  title,
  subtitle,
  progress,
  onComplete,
  busyText,
  footer,
}: PinEntryScreenProps) {
  const { theme } = useUnistyles();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = async (value: string) => {
    setBusy(true);
    try {
      const message = await onComplete(value);
      if (!mounted.current) return;
      setError(message);
      setPin('');
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const handleChange = (next: string) => {
    setError(null);
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  };

  return (
    <Screen>
      <Header progress={progress} />
      <Text variant="title">{title}</Text>
      <Text color="muted" style={styles.subtitle}>
        {subtitle}
      </Text>

      <View style={styles.center}>
        <PinDots length={pin.length} error={!!error && pin.length === 0} />
        <View style={styles.message}>
          {busy && busyText ? (
            <View style={styles.busy}>
              <ActivityIndicator color={theme.colors.accentText} />
              <Text variant="small" color="muted">
                {busyText}
              </Text>
            </View>
          ) : error ? (
            <Text variant="small" color="dangerText" align="center">
              {error}
            </Text>
          ) : null}
        </View>
      </View>

      <Keypad value={pin} disabled={busy} onChange={handleChange} />
      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  subtitle: {
    marginTop: theme.space(2),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    minHeight: 48,
    marginTop: theme.space(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(2),
  },
}));
