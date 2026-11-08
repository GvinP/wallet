import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatTokenAmount, formatUsdCents, formatUsdPrice } from '@/core/chain/money';
import type { AssetView } from '@/core/chain/portfolio';

import { Skeleton } from './Skeleton';
import { Text } from './Text';
import { TokenIcon } from './TokenIcon';

type AssetRowProps = { asset: AssetView; loading: boolean };

export function AssetRow({ asset, loading }: AssetRowProps) {
  const { token, amount, priceUsd, valueCents, configured } = asset;
  const amountText =
    amount !== null
      ? `${formatTokenAmount(amount, token.decimals, {
          maxFraction: token.symbol === 'USDT' ? 2 : 4,
          minFraction: 2,
        })} ${token.symbol}`
      : null;

  return (
    <View style={styles.row}>
      <TokenIcon symbol={token.symbol} />
      <View style={styles.main}>
        <Text variant="label">{token.name}</Text>
        {!configured ? (
          <Text variant="caption" color="muted">
            Not configured on this network
          </Text>
        ) : loading && amountText === null ? (
          <Skeleton width={80} height={12} />
        ) : (
          <Text variant="caption" color="muted">
            {amountText ?? '—'}
          </Text>
        )}
      </View>
      <View style={styles.values}>
        {loading && valueCents === null && configured ? (
          <Skeleton width={56} height={16} />
        ) : (
          <Text variant="label">{valueCents !== null ? formatUsdCents(valueCents) : '—'}</Text>
        )}
        <Text variant="caption" color="muted">
          {priceUsd !== null ? formatUsdPrice(priceUsd) : ' '}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
    minHeight: 64,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  main: {
    flex: 1,
    gap: 2,
  },
  values: {
    alignItems: 'flex-end',
    gap: 2,
  },
}));
