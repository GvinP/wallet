import { Eye } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text } from './Text';

type WordGridProps = {
  words: readonly string[];
  /** When false, words are masked and a "Show phrase" button covers the grid. */
  revealed: boolean;
  onReveal: () => void;
};

/** Numbered words in a 2-column grid, row by row like the mockup (1 2 / 3 4 / …). */
export function WordGrid({ words, revealed, onReveal }: WordGridProps) {
  const { theme } = useUnistyles();
  return (
    <View>
      <View style={styles.grid} accessibilityElementsHidden={!revealed}>
        {words.map((word, i) => (
          <View key={i} style={styles.cell}>
            <Text variant="caption" color="muted" style={styles.index}>
              {i + 1}
            </Text>
            <Text variant="bodyMedium">{revealed ? word : '••••••'}</Text>
          </View>
        ))}
      </View>
      {!revealed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show recovery phrase"
          onPress={onReveal}
          style={styles.cover}
        >
          <View style={styles.revealPill}>
            <Eye size={18} color={theme.colors.text} />
            <Text variant="label">Show phrase</Text>
          </View>
          <Text variant="caption" color="muted">
            Make sure no one is watching your screen
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.space(2.5),
  },
  cell: {
    width: '48.5%',
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(2.5),
    paddingHorizontal: theme.space(3.5),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  index: {
    minWidth: 16,
    textAlign: 'right',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space(2),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg + 'E6',
  },
  revealPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(2),
    paddingHorizontal: theme.space(5),
    height: theme.layout.minTapTarget,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
  },
}));
