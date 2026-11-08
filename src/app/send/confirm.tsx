import { Redirect, router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatTokenAmount, formatUsdMicros, NETWORKS, toUsdMicros } from '@/core/chain';
import { authenticateWithBiometrics } from '@/core/security';
import { shortenAddress } from '@/core/wallet';
import { biometryIcon, useBiometryStatus } from '@/hooks/useBiometryStatus';
import { usePrices } from '@/hooks/usePortfolio';
import { sendDraft, settingsStore, walletStore } from '@/stores';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Header } from '@/ui/Header';
import { NetworkPill } from '@/ui/NetworkPill';
import { PinPromptModal } from '@/ui/PinPromptModal';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { TokenIcon } from '@/ui/TokenIcon';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text variant="small" color="muted">
        {label}
      </Text>
      <View style={styles.rowValue}>{children}</View>
    </View>
  );
}

function ConfirmScreen() {
  const review = sendDraft.review;
  const biometry = useBiometryStatus();
  const prices = usePrices().data;
  const [pinVisible, setPinVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!review || !walletStore.address) return <Redirect href="/send" />;

  const network = NETWORKS[review.networkId];
  const token = network.tokens.find((t) => t.symbol === review.token)!;
  const amountText = formatTokenAmount(review.amount, token.decimals, {
    maxFraction: token.decimals,
    minFraction: 2,
  });
  const tokenPrice = prices?.[token.symbol] ?? null;
  const polPrice = prices?.POL ?? null;
  const biometricsUsable = settingsStore.biometricsEnabled && !!biometry?.available;

  const proceed = () => {
    setPinVisible(false);
    sendDraft.authorize();
    router.replace('/send/status');
  };

  // Spec §6.4: every transfer is confirmed with biometrics, falling back to the PIN.
  const confirm = async () => {
    if (!biometricsUsable || !biometry) {
      setPinVisible(true);
      return;
    }
    setBusy(true);
    const result = await authenticateWithBiometrics(`Send ${amountText} ${token.symbol}`);
    setBusy(false);
    if (result.success) proceed();
    else setPinVisible(true); // cancel → "Use PIN", lockout, unavailable
  };

  return (
    <Screen scroll>
      <Header title="Confirm send" />

      <View style={styles.hero}>
        <TokenIcon symbol={token.symbol} size={52} />
        <Text variant="balance" align="center" style={styles.amount} accessibilityLabel="Amount">
          {amountText} {token.symbol}
        </Text>
        {tokenPrice !== null ? (
          <Text color="muted" align="center">
            ≈ {formatUsdMicros(toUsdMicros(review.amount, token.decimals, tokenPrice))}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Row label="From">
          <Text variant="label">
            {walletStore.accountName} · {shortenAddress(walletStore.address)}
          </Text>
        </Row>
        <View style={styles.divider} />
        <Row label="To">
          <Text variant="label" accessibilityLabel={`To ${review.to}`}>
            {shortenAddress(review.to)}
          </Text>
        </Row>
        <View style={styles.divider} />
        <Row label="Network">
          <NetworkPill network={network} label="full" />
        </Row>
        <View style={styles.divider} />
        <Row label="Network fee">
          <Text variant="label" align="right">
            {formatTokenAmount(review.fee.maxFee, 18, { maxFraction: 6 })} POL
          </Text>
          {polPrice !== null ? (
            <Text variant="caption" color="muted" align="right">
              ≈ {formatUsdMicros(toUsdMicros(review.fee.maxFee, 18, polPrice))}
            </Text>
          ) : null}
        </Row>
      </View>

      <Text variant="caption" color="muted" style={styles.fullAddress} selectable>
        To: {review.to}
      </Text>

      <View style={styles.warning}>
        <Banner text="Check the address carefully. Blockchain transfers can't be reversed." />
      </View>

      <View style={styles.actions}>
        <View style={styles.cancel}>
          <Button title="Cancel" variant="outline" disabled={busy} onPress={() => router.back()} />
        </View>
        <View style={styles.confirm}>
          <Button
            title="Confirm"
            icon={biometricsUsable && biometry ? biometryIcon(biometry.kind) : undefined}
            loading={busy}
            onPress={confirm}
          />
        </View>
      </View>
      <PinPromptModal
        visible={pinVisible}
        title="Confirm transfer"
        subtitle={`Enter your PIN to send ${amountText} ${token.symbol}`}
        onSuccess={proceed}
        onCancel={() => setPinVisible(false)}
      />
    </Screen>
  );
}

export default observer(ConfirmScreen);

const styles = StyleSheet.create((theme) => ({
  hero: {
    alignItems: 'center',
    marginTop: theme.space(2),
    gap: theme.space(1),
  },
  amount: {
    marginTop: theme.space(4),
  },
  card: {
    marginTop: theme.space(6),
    paddingHorizontal: theme.space(4),
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space(3),
    paddingVertical: theme.space(3),
  },
  rowValue: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  fullAddress: {
    marginTop: theme.space(3),
    ...theme.typography.mono,
    fontSize: 12,
  },
  warning: {
    marginTop: theme.space(4),
  },
  actions: {
    flexDirection: 'row',
    gap: theme.space(3),
    marginTop: 'auto',
    paddingTop: theme.space(6),
  },
  cancel: {
    flex: 1,
  },
  confirm: {
    flex: 2,
  },
}));
