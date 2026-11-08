import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '@/ui/Button';
import { ScreenStub } from '@/ui/ScreenStub';

export default function WalletScreen() {
  return (
    <ScreenStub
      title="Account 1"
      phase={3}
      bottomInset={false}
      description="Address, network pill, testnet banner, total balance, assets and recent activity."
      links={[{ title: 'Dev: lock screen', href: '/lock' }]}
    >
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
    </ScreenStub>
  );
}

const styles = StyleSheet.create((theme) => ({
  actions: {
    flexDirection: 'row',
    gap: theme.space(3),
    marginTop: theme.space(6),
  },
}));
