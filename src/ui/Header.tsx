import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ProgressSteps } from './ProgressSteps';
import { Text } from './Text';

type HeaderProps = {
  title?: string;
  /** Default: router.back(). Pass null to hide the back button. */
  onBack?: (() => void) | null;
  progress?: { step: number; total: number };
  right?: ReactNode;
};

/** 44pt top bar: back chevron · centered title or step indicator · optional right slot. */
export function Header({ title, onBack, progress, right }: HeaderProps) {
  const { theme } = useUnistyles();
  const handleBack = onBack === undefined ? () => router.back() : onBack;

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {handleBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            onPress={handleBack}
            style={styles.back}
          >
            <ChevronLeft size={26} color={theme.colors.text} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.center}>
        {progress ? (
          <ProgressSteps step={progress.step} total={progress.total} />
        ) : title ? (
          <Text variant="heading" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    height: theme.layout.minTapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.space(4),
  },
  side: {
    width: theme.layout.minTapTarget,
  },
  right: {
    alignItems: 'flex-end',
  },
  back: {
    width: theme.layout.minTapTarget,
    height: theme.layout.minTapTarget,
    justifyContent: 'center',
    marginLeft: -theme.space(2),
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
}));
