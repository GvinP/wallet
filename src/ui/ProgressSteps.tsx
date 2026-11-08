import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function ProgressSteps({ step, total }: { step: number; total: number }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step }}
      accessibilityLabel={`Step ${step} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={styles.bar(i + 1 <= step)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.space(1.5),
  },
  bar: (active: boolean) => ({
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: active ? theme.colors.accent : theme.colors.border,
  }),
}));
