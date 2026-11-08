import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Logo } from './Logo';

/**
 * Covers the whole app whenever it isn't in the foreground, so the app-switcher snapshot
 * never shows a recovery phrase, balances or addresses (DECISIONS #7).
 */
export function PrivacyCover() {
  const [visible, setVisible] = useState(AppState.currentState !== 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setVisible(state !== 'active'));
    return () => sub.remove();
  }, []);

  if (!visible) return null;
  return (
    <View style={styles.cover} pointerEvents="none">
      <Logo size={72} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  cover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
}));
