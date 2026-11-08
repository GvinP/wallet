import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PIN_LENGTH, pinManager } from '@/core/security';

import { formatCountdown } from './copy';
import { Keypad, PinDots } from './PinPad';
import { Text } from './Text';

type PinPromptModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

/** PIN check for sensitive actions (confirming a transfer, showing the phrase, deleting). */
export function PinPromptModal({
  visible,
  title,
  subtitle,
  onSuccess,
  onCancel,
}: PinPromptModalProps) {
  const { theme } = useUnistyles();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    pinManager
      .getLockState()
      .then((s) => {
        if (!mounted.current) return;
        setNow(Date.now());
        setLockedUntil(s.lockedUntil);
      })
      .catch(() => {});
  }, [visible]);

  useEffect(() => {
    if (lockedUntil === null) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) setLockedUntil(null);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const close = () => {
    setPin('');
    setError(null);
    onCancel();
  };

  const verify = async (value: string) => {
    setBusy(true);
    try {
      const result = await pinManager.verify(value);
      if (!mounted.current) return;
      setPin('');
      if (result.status === 'ok') {
        setError(null);
        onSuccess();
        return;
      }
      setNow(Date.now());
      setLockedUntil(result.lockedUntil);
      setError(
        result.status === 'wrong' && result.lockedUntil === null
          ? `Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`
          : null,
      );
    } catch {
      if (mounted.current) {
        setPin('');
        setError("Couldn't check the PIN. Please try again.");
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const onChange = (value: string) => {
    setError(null);
    setPin(value);
    if (value.length === PIN_LENGTH) void verify(value);
  };

  const lockedFor = lockedUntil !== null ? Math.max(0, lockedUntil - now) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={close}
          style={styles.close}
        >
          <X size={24} color={theme.colors.text} />
        </Pressable>
        <Text variant="title" align="center">
          {title}
        </Text>
        {subtitle ? (
          <Text color="muted" align="center" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.middle}>
          <PinDots length={pin.length} error={!!error && pin.length === 0} />
          <View style={styles.message}>
            <Text
              variant="small"
              color={lockedFor > 0 || error ? 'dangerText' : 'muted'}
              align="center"
            >
              {lockedFor > 0
                ? `Too many wrong attempts. Try again in ${formatCountdown(lockedFor)}.`
                : (error ?? 'Enter your PIN')}
            </Text>
          </View>
        </View>
        <Keypad value={pin} onChange={onChange} disabled={busy || lockedFor > 0} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.space(4),
    paddingBottom: rt.insets.bottom + theme.space(4),
  },
  close: {
    alignSelf: 'flex-end',
    width: theme.layout.minTapTarget,
    height: theme.layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: theme.space(2),
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    minHeight: 48,
    marginTop: theme.space(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
