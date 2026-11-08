import {
  CircleExclamationPoint,
  Info,
  TriangleExclamationPoint,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text } from './Text';

type Tone = 'warn' | 'danger' | 'info';

const ICONS: Record<Tone, LucideIcon> = {
  warn: TriangleExclamationPoint,
  danger: CircleExclamationPoint,
  info: Info,
};

export function Banner({ tone = 'warn', text }: { tone?: Tone; text: string }) {
  const { theme } = useUnistyles();
  styles.useVariants({ tone });
  const Icon = ICONS[tone];
  const color = tone === 'info' ? theme.colors.muted : theme.colors.warnText;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon size={18} color={tone === 'danger' ? theme.colors.dangerText : color} />
      <Text variant="small" style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  banner: {
    flexDirection: 'row',
    gap: theme.space(3),
    padding: theme.space(4),
    borderRadius: theme.radius.md + 2,
    variants: {
      tone: {
        warn: { backgroundColor: theme.colors.warnBg },
        danger: { backgroundColor: theme.colors.warnBg },
        info: { backgroundColor: theme.colors.surface2 },
      },
    },
  },
  text: {
    flex: 1,
    variants: {
      tone: {
        warn: { color: theme.colors.warnText },
        danger: { color: theme.colors.warnText },
        info: { color: theme.colors.text },
      },
    },
  },
}));
