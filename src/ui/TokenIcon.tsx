import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { TokenSymbol } from '@/core/chain/networks';

import { Text } from './Text';

/** Letter-in-a-circle token icon (spec §10: P on accent, T on #1F7A63 — no third-party logos). */
export function TokenIcon({ symbol, size = 40 }: { symbol: TokenSymbol; size?: number }) {
  return (
    <View style={styles.circle(symbol, size)} accessibilityElementsHidden>
      <Text variant="label" color="onAccent" style={styles.letter(size)}>
        {symbol[0]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  circle: (symbol: TokenSymbol, size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: symbol === 'POL' ? theme.colors.tokenPol : theme.colors.tokenUsdt,
  }),
  letter: (size: number) => ({
    fontSize: size * 0.42,
    lineHeight: size * 0.5,
  }),
}));
