import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { RefreshControl, SectionList, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { groupByDay } from '@/core/chain/history';
import { useHistory } from '@/hooks/useHistory';
import { useNow } from '@/hooks/useNow';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { NetworkPill } from '@/ui/NetworkPill';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';
import { openTx, TxRow } from '@/ui/TxRow';

function ActivityScreen() {
  const { theme } = useUnistyles();
  const { network, items, missingKey, isLoading, error, isRefreshing, refresh } = useHistory();
  const now = useNow();
  const sections = groupByDay(items, now);

  const header = (
    <View>
      <View style={styles.titleRow}>
        <Text variant="title">Activity</Text>
        <NetworkPill network={network} />
      </View>
      {missingKey ? (
        <View style={styles.notice}>
          <Banner
            tone="info"
            text="Showing only transfers sent from this device. Add an Etherscan API key (EXPO_PUBLIC_ETHERSCAN_KEY) to load the full history."
          />
        </View>
      ) : null}
      {error ? (
        <View style={styles.notice}>
          <Banner tone="danger" text="Couldn't load your history. Check your connection." />
          <Button title="Retry" variant="secondary" onPress={refresh} />
        </View>
      ) : null}
    </View>
  );

  return (
    <SectionList
      style={styles.root}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) => (
        <Text variant="caption" color="muted" style={styles.sectionTitle}>
          {section.title.toUpperCase()}
        </Text>
      )}
      renderItem={({ item }) => <TxRow item={item} onPress={() => openTx(item)} />}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.skeletons}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={52} radius={12} />
            ))}
          </View>
        ) : error ? undefined : (
          <View style={styles.empty}>
            <Text variant="heading" align="center">
              No activity yet
            </Text>
            <Text color="muted" align="center" style={styles.emptyText}>
              Transfers you send or receive on {network.name} will appear here.
            </Text>
            <Button title="Receive" variant="secondary" onPress={() => router.push('/receive')} />
          </View>
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={theme.colors.muted}
          colors={[theme.colors.accent]}
          progressBackgroundColor={theme.colors.surface}
        />
      }
    />
  );
}

export default observer(ActivityScreen);

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    paddingTop: rt.insets.top + theme.space(4),
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.space(8),
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notice: {
    marginTop: theme.space(4),
    gap: theme.space(3),
  },
  sectionTitle: {
    marginTop: theme.space(6),
    marginBottom: theme.space(1),
    letterSpacing: 0.6,
  },
  skeletons: {
    marginTop: theme.space(6),
    gap: theme.space(3),
  },
  empty: {
    marginTop: theme.space(16),
    gap: theme.space(2),
    paddingHorizontal: theme.space(4),
  },
  emptyText: {
    marginBottom: theme.space(4),
  },
}));
