import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  /** Stretch to fill the row (e.g. Send / Receive side by side). */
  flex?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled,
  flex = false,
  ...rest
}: ButtonProps) {
  const { theme } = useUnistyles();
  const isDisabled = disabled || loading;
  styles.useVariants({ variant, disabled: isDisabled });

  const contentColor =
    variant === 'primary' || variant === 'danger' ? theme.colors.onAccent : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.button, flex && styles.flex, pressed && styles.pressed]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon size={20} color={contentColor} strokeWidth={2} /> : null}
          <Text variant="label" style={styles.label}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    height: theme.layout.buttonHeight,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.space(5),
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      variant: {
        primary: { backgroundColor: theme.colors.accent },
        danger: { backgroundColor: theme.colors.danger },
        secondary: { backgroundColor: theme.colors.surface2 },
        outline: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      },
      disabled: {
        true: { opacity: 0.45 },
        false: {},
      },
    },
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(2),
  },
  label: {
    fontSize: 16,
    variants: {
      variant: {
        primary: { color: theme.colors.onAccent },
        danger: { color: theme.colors.onAccent },
        secondary: { color: theme.colors.text },
        outline: { color: theme.colors.text },
      },
    },
  },
}));
