import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Share as ShareIcon } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet } from 'react-native-unistyles';

import { NETWORKS } from '@/core/chain/networks';
import { receiveQrValue, receiveShareMessage, receiveWarning } from '@/core/chain/receive';
import { settingsStore, walletStore } from '@/stores';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Header } from '@/ui/Header';
import { NetworkPill } from '@/ui/NetworkPill';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

const QR_SIZE = 220;

function ReceiveScreen() {
  const network = NETWORKS[settingsStore.network];
  const address = walletStore.address;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!address) return null; // guarded by the session; never happens when unlocked

  const copy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
  };

  const share = () => {
    void Share.share({ message: receiveShareMessage(network, address) }).catch(() => {});
  };

  return (
    <Screen scroll>
      <Header title="Receive" />

      <View style={styles.center}>
        <NetworkPill network={network} label="full" />

        <View style={styles.qrCard} accessibilityLabel="QR code with your address">
          {/* Always dark-on-white: inverted QR codes fail on many scanners. */}
          <QRCode
            value={receiveQrValue(address)}
            size={QR_SIZE}
            color="#000000"
            backgroundColor="#FFFFFF"
            ecl="M"
            testID="receive-qr"
          />
        </View>

        <Text variant="label" align="center" style={styles.account}>
          {walletStore.accountName}
        </Text>
        <Text
          variant="mono"
          color="muted"
          align="center"
          selectable
          style={styles.address}
          accessibilityLabel={`Address ${address}`}
        >
          {address}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title={copied ? 'Copied' : 'Copy'}
          icon={copied ? Check : Copy}
          flex
          onPress={copy}
        />
        <Button title="Share" icon={ShareIcon} variant="secondary" flex onPress={share} />
      </View>

      <View style={styles.warning}>
        <Banner tone="warn" text={receiveWarning(network)} />
      </View>
    </Screen>
  );
}

export default observer(ReceiveScreen);

const styles = StyleSheet.create((theme) => ({
  center: {
    alignItems: 'center',
  },
  qrCard: {
    marginTop: theme.space(5),
    padding: theme.space(4),
    borderRadius: theme.radius.card + 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  account: {
    marginTop: theme.space(6),
  },
  address: {
    marginTop: theme.space(2),
    maxWidth: 300,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.space(3),
    marginTop: theme.space(6),
  },
  warning: {
    marginTop: 'auto',
    paddingTop: theme.space(6),
  },
}));
