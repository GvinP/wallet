import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { Network } from '@/core/chain/networks';

import { Text } from './Text';

type NetworkPillProps = {
  network: Network;
  /** "short" → "Amoy", "full" → "Polygon Amoy". */
  label?: 'short' | 'full';
  onPress?: () => void;
};

/** Amoy — orange dot, Polygon — green dot (spec §7). */
export function NetworkPill({ network, label = 'short', onPress }: NetworkPillProps) {
  const text = label === 'short' ? network.shortName : network.name;
  const content = (
    <>
      <View style={styles.dot(network.isTestnet)} />
      <Text variant="caption" style={styles.text}>
        {text}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.pill} accessibilityLabel={`Network: ${network.name}`}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Network: ${network.name}. Change network`}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(1.5),
    height: 30,
    paddingHorizontal: theme.space(3),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
  },
  pressed: {
    opacity: 0.7,
  },
  dot: (testnet: boolean) => ({
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: testnet ? theme.colors.networkTestnet : theme.colors.networkMainnet,
  }),
  text: {
    fontFamily: theme.fonts.semibold,
  },
}));
