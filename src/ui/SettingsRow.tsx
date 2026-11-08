import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text } from './Text';

export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="caption" color="muted" style={styles.groupTitle}>
        {title.toUpperCase()}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function SettingsDivider() {
  return <View style={styles.divider} />;
}

type SettingsRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Right side: a value text, a pill, or a Switch. */
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  accessibilityLabel?: string;
};

export function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  right,
  onPress,
  destructive = false,
  accessibilityLabel,
}: SettingsRowProps) {
  const { theme } = useUnistyles();
  const color = destructive ? theme.colors.dangerText : theme.colors.text;
  const content = (
    <>
      <View style={styles.icon}>
        <Icon size={18} color={destructive ? theme.colors.dangerText : theme.colors.accentText} />
      </View>
      <View style={styles.text}>
        <Text variant="label" style={{ color }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <ChevronRight size={18} color={theme.colors.muted} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  group: {
    marginTop: theme.space(6),
  },
  groupTitle: {
    marginBottom: theme.space(2),
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(2.5),
  },
  pressed: {
    backgroundColor: theme.colors.surface2,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  divider: {
    height: 1,
    marginLeft: theme.space(4) + 32 + theme.space(3),
    backgroundColor: theme.colors.border,
  },
}));
