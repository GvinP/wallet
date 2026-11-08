import { Redirect, router } from 'expo-router';
import { TriangleExclamationPoint } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { shortenAddress } from '@/core/wallet';
import { sensitiveGrants, sessionStore, walletStore } from '@/stores';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/** Spec §6.8: deletion only after the PIN (grant) and an explicit confirmation. */
export default function DeleteWalletScreen() {
  const { theme } = useUnistyles();
  const [allowed] = useState(() => sensitiveGrants.consume('deleteWallet'));
  const [backedUp, setBackedUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!allowed) return <Redirect href="/settings" />;

  const remove = async () => {
    setBusy(true);
    setError(false);
    try {
      // Status → onboarding; the route guards then take us to the welcome screen.
      await sessionStore.resetWallet();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Delete wallet" />
      <View style={styles.center}>
        <View style={styles.icon}>
          <TriangleExclamationPoint size={36} color={theme.colors.dangerText} />
        </View>
        <Text variant="title" align="center" style={styles.title}>
          Remove this wallet?
        </Text>
        <Text color="muted" align="center">
          {walletStore.accountName}
          {walletStore.address ? ` · ${shortenAddress(walletStore.address)}` : ''} and its keys will
          be erased from this device. Your funds stay on the blockchain — you can only get them back
          with your recovery phrase.
        </Text>
      </View>

      <Banner text="Without the recovery phrase this wallet can't be restored. Amethyst has no backup and no way to recover it." />

      <View style={styles.actions}>
        <Checkbox
          checked={backedUp}
          onChange={setBackedUp}
          label="I have my recovery phrase written down"
        />
        {error ? (
          <Text variant="caption" color="dangerText">
            {"Couldn't delete the wallet. Please try again."}
          </Text>
        ) : null}
        <Button
          title="Delete wallet"
          variant="danger"
          disabled={!backedUp}
          loading={busy}
          onPress={remove}
        />
        <Button title="Cancel" variant="outline" disabled={busy} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space(2),
    paddingHorizontal: theme.space(2),
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.warnBg,
  },
  title: {
    marginTop: theme.space(3),
  },
  actions: {
    marginTop: theme.space(5),
    gap: theme.space(3),
  },
}));
