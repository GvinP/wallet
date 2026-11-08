import { Delete, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PIN_LENGTH } from '@/core/security/pin';

import { Text } from './Text';

type PinDotsProps = { length: number; error?: boolean };

export function PinDots({ length, error = false }: PinDotsProps) {
  return (
    <View
      style={styles.dots}
      accessibilityLabel={`${length} of ${PIN_LENGTH} digits entered`}
      accessibilityLiveRegion="polite"
    >
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View key={i} style={styles.dot(i < length, error)} />
      ))}
    </View>
  );
}

type KeypadProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Bottom-left key, e.g. biometrics retry on the lock screen. */
  extraKey?: { icon: LucideIcon; label: string; onPress: () => void };
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Custom keypad: the PIN never goes through the system keyboard (no keyboard learning/logging). */
export function Keypad({ value, onChange, disabled = false, extraKey }: KeypadProps) {
  const { theme } = useUnistyles();

  const press = (digit: string) => {
    if (!disabled && value.length < PIN_LENGTH) onChange(value + digit);
  };
  const erase = () => {
    if (!disabled && value.length > 0) onChange(value.slice(0, -1));
  };

  const renderDigit = (digit: string) => (
    <Pressable
      key={digit}
      accessibilityRole="button"
      accessibilityLabel={digit}
      disabled={disabled}
      onPress={() => press(digit)}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
    >
      <Text variant="title" style={disabled && styles.disabledText}>
        {digit}
      </Text>
    </Pressable>
  );

  const ExtraIcon = extraKey?.icon;

  return (
    <View style={styles.grid}>
      {KEYS.map(renderDigit)}
      {extraKey && ExtraIcon ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={extraKey.label}
          onPress={extraKey.onPress}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        >
          <ExtraIcon size={28} color={theme.colors.accentText} />
        </Pressable>
      ) : (
        <View style={styles.key} />
      )}
      {renderDigit('0')}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete"
        disabled={disabled}
        onPress={erase}
        style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      >
        <Delete size={26} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.space(4),
  },
  dot: (filled: boolean, error: boolean) => ({
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: error
      ? theme.colors.dangerText
      : filled
        ? theme.colors.accent
        : theme.colors.muted,
    backgroundColor: error ? theme.colors.dangerText : filled ? theme.colors.accent : 'transparent',
  }),
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.space(2),
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  key: {
    width: '30%',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: theme.colors.surface2,
  },
  disabledText: {
    opacity: 0.35,
  },
}));
