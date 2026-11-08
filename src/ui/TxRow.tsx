import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { formatTime, type HistoryItem } from '@/core/chain/history';
import { formatTokenAmount } from '@/core/chain/money';
import { shortenAddress } from '@/core/wallet/format';

import { StatusPill } from './StatusPill';
import { Text } from './Text';

const DECIMALS = { POL: 18, USDT: 6 } as const;

export const openTx = (item: HistoryItem) =>
  router.push({ pathname: '/tx/[hash]', params: { hash: item.hash, token: item.token } });

export function txTitle(item: HistoryItem): string {
  return `${item.direction === 'out' ? 'Sent' : 'Received'} ${item.token}`;
}

export function txAmountText(item: HistoryItem): string {
  const sign = item.direction === 'out' ? '−' : '+';
  const amount = formatTokenAmount(item.amount, DECIMALS[item.token], {
    maxFraction: item.token === 'USDT' ? 2 : 4,
    minFraction: 2,
  });
  return `${sign}${amount} ${item.token}`;
}

type TxRowProps = {
  item: HistoryItem;
  onPress: () => void;
  /** "now"/"Yesterday"-style label instead of the time (home screen). */
  timeLabel?: string;
};

/** Mockup "Recent activity" row: arrow icon · title + counterparty · signed amount + status. */
export function TxRow({ item, onPress, timeLabel }: TxRowProps) {
  const { theme } = useUnistyles();
  const Icon = item.direction === 'out' ? ArrowUpRight : ArrowDownLeft;
  const prefix = item.direction === 'out' ? 'To' : 'From';
  const amountColor =
    item.status === 'failed' ? 'muted' : item.direction === 'in' ? 'okText' : 'text';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${txTitle(item)}, ${txAmountText(item)}, ${item.status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon size={18} color={theme.colors.text} />
      </View>
      <View style={styles.main}>
        <Text variant="label">{txTitle(item)}</Text>
        <Text variant="caption" color="muted" numberOfLines={1}>
          {prefix} {shortenAddress(item.counterparty)} · {timeLabel ?? formatTime(item.timestamp)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text variant="label" color={amountColor} style={item.status === 'failed' && styles.strike}>
          {txAmountText(item)}
        </Text>
        <StatusPill status={item.status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
    minHeight: 60,
    paddingVertical: theme.space(2),
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
}));
