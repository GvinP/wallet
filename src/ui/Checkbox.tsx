import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text } from './Text';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  const { theme } = useUnistyles();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Check size={16} color={theme.colors.onAccent} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    minHeight: theme.layout.minTapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
  },
  disabled: {
    opacity: 0.45,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  label: {
    flex: 1,
  },
}));
