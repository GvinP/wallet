import { Gem } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export function Logo({ size = 88 }: { size?: number }) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.tile(size)} accessibilityLabel="Amethyst logo">
      <Gem size={size * 0.46} color={theme.colors.onAccent} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: (size: number) => ({
    width: size,
    height: size,
    borderRadius: size * 0.27,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  }),
}));
