import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, FlaskConical, Settings } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { shortTimeLabel } from '@/core/chain/history';
import { formatUsdCents } from '@/core/chain/money';
import { useHistory } from '@/hooks/useHistory';
import { useNow } from '@/hooks/useNow';
import { usePortfolio } from '@/hooks/usePortfolio';
import { sessionStore, walletStore } from '@/stores';
import { AssetRow } from '@/ui/AssetRow';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { CopyAddress } from '@/ui/CopyAddress';
import { NetworkPill } from '@/ui/NetworkPill';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';
import { openTx, TxRow } from '@/ui/TxRow';

function WalletScreen() {
  const { theme } = useUnistyles();
  const {
    network,
    portfolio,
    isLoading,
    balancesError,
    balancesStale,
    pricesError,
    isRefreshing,
    refresh,
  } = usePortfolio({ poll: true });
  const address = walletStore.address;
  const history = useHistory();
  const now = useNow();
  const recent = history.items.slice(0, 3);
  const refreshAll = async () => {
    await Promise.all([refresh(), history.refresh()]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing || history.isRefreshing}
          onRefresh={refreshAll}
          tintColor={theme.colors.muted}
          colors={[theme.colors.accent]}
          progressBackgroundColor={theme.colors.surface}
        />
      }
    >
      {/* Header: avatar · account · network · settings */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="label" color="onAccent">
            A1
          </Text>
        </View>
        <View style={styles.account}>
          <Text variant="label">{walletStore.accountName}</Text>
          {address ? <CopyAddress address={address} /> : null}
        </View>
        <NetworkPill network={network} onPress={() => router.push('/network')} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          style={styles.iconButton}
        >
          <Settings size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      {network.isTestnet ? (
        <View style={styles.testnet}>
          <FlaskConical size={15} color={theme.colors.warnText} />
          <Text variant="caption" style={styles.testnetText}>
            TESTNET · tokens here have no real value
          </Text>
        </View>
      ) : null}

      {/* Total */}
      <View style={styles.total}>
        <Text variant="small" color="muted">
          Total balance
        </Text>
        {portfolio.totalCents !== null ? (
          <Text variant="balance" accessibilityLabel="Total balance">
            {formatUsdCents(portfolio.totalCents)}
            {portfolio.totalIsPartial ? '+' : ''}
          </Text>
        ) : isLoading ? (
          <View style={styles.totalSkeleton}>
            <Skeleton width={180} height={40} radius={10} />
          </View>
        ) : (
          <Text variant="balance" color="muted">
            —
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button title="Send" icon={ArrowUpRight} flex onPress={() => router.push('/send')} />
        <Button
          title="Receive"
          icon={ArrowDownLeft}
          variant="secondary"
          flex
          onPress={() => router.push('/receive')}
        />
      </View>

      {balancesError ? (
        <View style={styles.notice}>
          <Banner tone="danger" text="Couldn't load balances. Check your connection." />
          <Button title="Retry" variant="secondary" onPress={refresh} />
        </View>
      ) : balancesStale ? (
        <View style={styles.notice}>
          <Banner tone="info" text="Showing the last known balances — refresh failed." />
        </View>
      ) : null}
      {pricesError && !balancesError ? (
        <View style={styles.notice}>
          <Banner tone="info" text="Prices are unavailable right now. Balances are up to date." />
        </View>
      ) : null}

      {/* Assets */}
      <Text variant="heading" style={styles.sectionTitle}>
        Assets
      </Text>
      <View style={styles.card}>
        {portfolio.assets.map((asset, i) => (
          <View key={asset.token.symbol}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <AssetRow asset={asset} loading={isLoading} />
          </View>
        ))}
      </View>

      {/* Recent activity: the 3 latest (spec §7) */}
      <View style={styles.sectionHeader}>
        <Text variant="heading">Recent activity</Text>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/activity')}>
          <Text variant="label" color="accentText">
            See all
          </Text>
        </Pressable>
      </View>
      {recent.length > 0 ? (
        <View>
          {recent.map((item) => (
            <TxRow
              key={item.id}
              item={item}
              timeLabel={shortTimeLabel(item.timestamp, now)}
              onPress={() => openTx(item)}
            />
          ))}
        </View>
      ) : history.isLoading ? (
        <View style={styles.recentSkeleton}>
          <Skeleton width="100%" height={48} radius={12} />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text variant="small" color="muted" align="center">
            {history.missingKey
              ? 'Transfers you send will show up here. Full history needs an Etherscan API key.'
              : 'No transactions yet. Received and sent transfers will show up here.'}
          </Text>
        </View>
      )}

      {__DEV__ ? (
        <View style={styles.dev}>
          <Button title="Dev: lock now" variant="outline" onPress={() => sessionStore.lock()} />
        </View>
      ) : null}
    </ScrollView>
  );
}

export default observer(WalletScreen);

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    paddingTop: rt.insets.top + theme.space(3),
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.space(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  account: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: theme.layout.minTapTarget,
    height: theme.layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -theme.space(2),
  },
  testnet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(2),
    marginTop: theme.space(4),
    paddingHorizontal: theme.space(3.5),
    paddingVertical: theme.space(2.5),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.warnBg,
  },
  testnetText: {
    color: theme.colors.warnText,
    fontFamily: theme.fonts.semibold,
  },
  total: {
    marginTop: theme.space(6),
    gap: theme.space(1),
  },
  totalSkeleton: {
    height: 48,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.space(3),
    marginTop: theme.space(5),
  },
  notice: {
    marginTop: theme.space(4),
    gap: theme.space(3),
  },
  sectionTitle: {
    marginTop: theme.space(7),
    marginBottom: theme.space(3),
  },
  card: {
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space(7),
    marginBottom: theme.space(3),
  },
  recentSkeleton: {
    paddingVertical: theme.space(2),
  },
  empty: {
    paddingVertical: theme.space(6),
    paddingHorizontal: theme.space(4),
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  dev: {
    marginTop: theme.space(8),
  },
}));
