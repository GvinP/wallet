import { useEffect, useState } from 'react';
import { Animated, type DimensionValue } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** Pulsing placeholder block for loading states. */
export function Skeleton({
  width,
  height,
  radius = 6,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
}) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[styles.block, { width, height, borderRadius: radius, opacity }]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  block: {
    backgroundColor: theme.colors.surface2,
  },
}));
