import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ScreenProps = {
  children: ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Pad for the bottom safe-area inset (off inside tabs — the tab bar handles it). */
  bottomInset?: boolean;
};

/** Screen container: theme background, safe-area insets and the standard 20pt gutter. */
export function Screen({ children, scroll = false, bottomInset = true }: ScreenProps) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, styles.insets(bottomInset)]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.root, styles.content, styles.insets(bottomInset)]}>{children}</View>;
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.screenPadding,
  },
  insets: (bottomInset: boolean) => ({
    paddingTop: rt.insets.top + theme.space(4),
    paddingBottom: (bottomInset ? rt.insets.bottom : 0) + theme.space(4),
  }),
}));
