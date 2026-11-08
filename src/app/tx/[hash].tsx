import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Check, Copy, ExternalLink } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { explorerTxUrl, formatDateTime, formatTokenAmount } from '@/core/chain';
import { shortenAddress } from '@/core/wallet';
import { useHistory } from '@/hooks/useHistory';
import { walletStore } from '@/stores';
import { Button } from '@/ui/Button';
import { Header } from '@/ui/Header';
import { NetworkPill } from '@/ui/NetworkPill';
import { Screen } from '@/ui/Screen';
import { StatusPill } from '@/ui/StatusPill';
import { Text } from '@/ui/Text';
import { TokenIcon } from '@/ui/TokenIcon';
import { txAmountText, txTitle } from '@/ui/TxRow';

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

function CopyHash({ hash }: { hash: string }) {
  const { theme } = useUnistyles();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Hash copied' : 'Copy transaction hash'}
      hitSlop={8}
      onPress={async () => {
        await Clipboard.setStringAsync(hash);
        setCopied(true);
      }}
      style={styles.copy}
    >
      <Text variant="label">{shortenAddress(hash, 6)}</Text>
      {copied ? (
        <Check size={14} color={theme.colors.okText} />
      ) : (
        <Copy size={14} color={theme.colors.muted} />
      )}
    </Pressable>
  );
}

function TransactionDetailsScreen() {
  const { theme } = useUnistyles();
  const { hash, token } = useLocalSearchParams<{ hash: string; token?: string }>();
  const { network, items } = useHistory();
  const item =
    items.find(
      (i) => i.hash.toLowerCase() === hash?.toLowerCase() && (!token || i.token === token),
    ) ?? items.find((i) => i.hash.toLowerCase() === hash?.toLowerCase());

  const openExplorer = () => void Linking.openURL(explorerTxUrl(network, hash));

  if (!item) {
    // Not in the loaded history (e.g. not indexed yet): still offer the explorer.
    return (
      <Screen>
        <Header title="Transaction" />
        <Text color="muted">{"Details for this transaction aren't loaded yet."}</Text>
        <View style={styles.card}>
          <Row label="Hash">
            <CopyHash hash={hash} />
          </Row>
        </View>
        <View style={styles.footer}>
          <Button title="View on explorer" icon={ExternalLink} onPress={openExplorer} />
        </View>
      </Screen>
    );
  }

  const decimals = item.token === 'USDT' ? 6 : 18;
  const own = walletStore.address;
  const label = (address: string) =>
    own && address.toLowerCase() === own.toLowerCase()
      ? `${walletStore.accountName} · ${shortenAddress(address)}`
      : shortenAddress(address);

  return (
    <Screen scroll>
      <Header title={txTitle(item)} />

      <View style={styles.hero}>
        <TokenIcon symbol={item.token} size={52} />
        <Text
          variant="balance"
          align="center"
          color={item.direction === 'in' && item.status !== 'failed' ? 'okText' : 'text'}
          style={styles.amount}
        >
          {txAmountText(item)}
        </Text>
        <StatusPill status={item.status} />
        {item.status === 'failed' ? (
          <Text variant="caption" color="muted" align="center" style={styles.failedNote}>
            The transaction was included but reverted: no tokens moved, the network fee was spent.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Row label="Date">
          <Text variant="label">{formatDateTime(item.timestamp)}</Text>
        </Row>
        <View style={styles.divider} />
        <Row label="From">
          <Text variant="label" selectable>
            {label(item.from)}
          </Text>
        </Row>
        <View style={styles.divider} />
        <Row label="To">
          <Text variant="label" selectable>
            {label(item.to)}
          </Text>
        </Row>
        <View style={styles.divider} />
        <Row label="Network">
          <NetworkPill network={network} label="full" />
        </Row>
        {item.direction === 'out' ? (
          <>
            <View style={styles.divider} />
            <Row label="Network fee">
              <Text variant="label">
                {item.fee !== null
                  ? `${formatTokenAmount(item.fee, 18, { maxFraction: 6 })} POL`
                  : item.status === 'pending'
                    ? 'Pending'
                    : '—'}
              </Text>
            </Row>
          </>
        ) : null}
        <View style={styles.divider} />
        <Row label="Amount">
          <Text variant="label">
            {formatTokenAmount(item.amount, decimals, { maxFraction: decimals })} {item.token}
          </Text>
        </Row>
        <View style={styles.divider} />
        <Row label="Hash">
          <CopyHash hash={item.hash} />
        </Row>
      </View>

      <View style={styles.footer}>
        <Button
          title="View on explorer"
          icon={ExternalLink}
          variant="secondary"
          onPress={openExplorer}
        />
        <Text variant="caption" color="muted" align="center" style={styles.explorerHint}>
          Opens {network.explorerUrl.replace('https://', '')}
        </Text>
      </View>
      <View style={{ height: theme.space(2) }} />
    </Screen>
  );
}

export default observer(TransactionDetailsScreen);

const styles = StyleSheet.create((theme) => ({
  hero: {
    alignItems: 'center',
    gap: theme.space(2),
  },
  amount: {
    marginTop: theme.space(3),
    fontSize: 34,
    lineHeight: 42,
  },
  failedNote: {
    paddingHorizontal: theme.space(6),
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
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space(3),
    paddingVertical: theme.space(2.5),
  },
  rowValue: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(1.5),
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.space(6),
    gap: theme.space(2),
  },
  explorerHint: {
    marginTop: theme.space(1),
  },
}));
