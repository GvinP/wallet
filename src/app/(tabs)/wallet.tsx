import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { sessionStore, walletStore } from '@/stores';
import { Button } from '@/ui/Button';
import { ScreenStub } from '@/ui/ScreenStub';
import { Text } from '@/ui/Text';

function WalletScreen() {
  return (
    <ScreenStub
      title={walletStore.accountName}
      phase={3}
      bottomInset={false}
      description="Address pill, network pill, testnet banner, total balance, assets and recent activity."
    >
      <View style={styles.card}>
        <Text variant="caption" color="muted">
          ADDRESS
        </Text>
        <Text variant="mono" selectable>
          {walletStore.address ?? '—'}
        </Text>
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

      {__DEV__ ? (
        <View style={styles.dev}>
          <Button title="Dev: lock now" variant="outline" onPress={() => sessionStore.lock()} />
        </View>
      ) : null}
    </ScreenStub>
  );
}

export default observer(WalletScreen);

const styles = StyleSheet.create((theme) => ({
  card: {
    marginTop: theme.space(6),
    padding: theme.space(4),
    gap: theme.space(1),
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.space(3),
    marginTop: theme.space(6),
  },
  dev: {
    marginTop: theme.space(6),
  },
}));
