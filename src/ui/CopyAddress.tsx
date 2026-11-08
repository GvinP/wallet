import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { shortenAddress } from '@/core/wallet/format';

import { Text } from './Text';

/** Shortened address that copies the full one on tap; the icon turns into a check for a moment. */
export function CopyAddress({ address }: { address: string }) {
  const { theme } = useUnistyles();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
  };

  const Icon = copied ? Check : Copy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Address copied' : `Copy address ${address}`}
      hitSlop={10}
      onPress={copy}
      style={styles.row}
    >
      <Text variant="caption" color="muted">
        {copied ? 'Copied' : shortenAddress(address)}
      </Text>
      <Icon size={13} color={copied ? theme.colors.okText : theme.colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(1.5),
  },
}));
