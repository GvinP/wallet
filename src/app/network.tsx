import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { queryClient, queryKeys } from '@/api/queryClient';
import { isNetworkAvailable, NETWORKS, type NetworkId } from '@/core/chain/networks';
import { settingsStore } from '@/stores';
import { Header } from '@/ui/Header';
import { NetworkPill } from '@/ui/NetworkPill';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

const ORDER: NetworkId[] = ['amoy', 'polygon'];

function NetworkScreen() {
  const { theme } = useUnistyles();

  const select = (id: NetworkId) => {
    settingsStore.setNetwork(id);
    // Same address everywhere; balances are keyed by network, refetch them fresh.
    void queryClient.invalidateQueries({ queryKey: queryKeys.balancesRoot });
    router.back();
  };

  return (
    <Screen>
      <Header title="Network" />
      <View style={styles.card} accessibilityRole="radiogroup">
        {ORDER.map((id, i) => {
          const network = NETWORKS[id];
          const selected = settingsStore.network === id;
          const available = isNetworkAvailable(id);
          return (
            <View key={id}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: !available }}
                disabled={!available}
                onPress={() => select(id)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.pressed,
                  !available && styles.disabled,
                ]}
              >
                <NetworkPill network={network} label="full" />
                <View style={styles.rowText}>
                  <Text variant="caption" color="muted">
                    {network.isTestnet
                      ? 'Testnet · free test tokens'
                      : available
                        ? 'Mainnet · real funds'
                        : 'Mainnet · available after testnet testing'}
                  </Text>
                </View>
                {selected ? <Check size={20} color={theme.colors.accentText} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text variant="caption" color="muted" style={styles.note}>
        Your address is the same on every network. Switching only changes which balances and
        transfers you see.
      </Text>
    </Screen>
  );
}

export default observer(NetworkScreen);

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
    paddingHorizontal: theme.space(4),
  },
  rowText: {
    flex: 1,
  },
  pressed: {
    backgroundColor: theme.colors.surface2,
  },
  disabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  note: {
    marginTop: theme.space(4),
  },
}));
