import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { LocalTxStatus } from '@/core/chain/pendingTx';

import { Text } from './Text';

const LABELS: Record<LocalTxStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  failed: 'Failed',
};

export function StatusPill({ status }: { status: LocalTxStatus }) {
  return (
    <View style={styles.pill(status)}>
      <Text variant="caption" style={styles.text(status)}>
        {LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  pill: (status: LocalTxStatus) => ({
    paddingHorizontal: theme.space(2),
    paddingVertical: 1,
    borderRadius: theme.radius.sm - 4,
    backgroundColor:
      status === 'confirmed'
        ? theme.colors.okBg
        : status === 'pending'
          ? theme.colors.warnBg
          : theme.colors.surface2,
  }),
  text: (status: LocalTxStatus) => ({
    fontSize: 11,
    lineHeight: 15,
    fontFamily: theme.fonts.semibold,
    color:
      status === 'confirmed'
        ? theme.colors.okText
        : status === 'pending'
          ? theme.colors.warnText
          : theme.colors.dangerText,
  }),
}));
