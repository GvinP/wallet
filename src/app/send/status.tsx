import { Redirect, router } from 'expo-router';
import { CircleCheck, CircleX, ExternalLink } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
  classifySendError,
  explorerTxUrl,
  formatTokenAmount,
  NETWORKS,
  SEND_ERROR_TEXT,
  sendTransfer,
} from '@/core/chain';
import { vault } from '@/core/security';
import { shortenAddress } from '@/core/wallet';
import { pendingTxStore, sendDraft, walletStore } from '@/stores';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

async function runSend() {
  const review = sendDraft.consumeAuthorization();
  if (!review) return; // nothing authorized (or already sent): never send twice
  const network = NETWORKS[review.networkId];
  const token = network.tokens.find((t) => t.symbol === review.token)!;
  try {
    const hash = await vault.withSigner((account) =>
      sendTransfer(network, account, { token, to: review.to, amount: review.amount }, review.fee),
    );
    // Spec §7: appears in history as Pending right away; tracked until it settles.
    pendingTxStore.add({
      hash,
      networkId: network.id,
      from: walletStore.address!,
      to: review.to,
      token: token.symbol,
      amount: review.amount.toString(),
    });
    sendDraft.markSent(hash);
  } catch (error) {
    sendDraft.markFailed(classifySendError(error));
  }
}

function SendStatusScreen() {
  const { theme } = useUnistyles();
  const { review, phase, hash, errorKind } = sendDraft;

  useEffect(() => {
    void runSend();
  }, []);

  // While sending, hardware back must not leave a half-finished screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => phase === 'sending');
    return () => sub.remove();
  }, [phase]);

  if (!review || phase === 'editing') return <Redirect href="/send" />;

  const network = NETWORKS[review.networkId];
  const token = network.tokens.find((t) => t.symbol === review.token)!;
  const amountText = `${formatTokenAmount(review.amount, token.decimals, { maxFraction: token.decimals })} ${token.symbol}`;
  const tracked = hash ? pendingTxStore.items.find((t) => t.hash === hash) : undefined;
  const done = () => router.dismissAll();

  if (phase === 'authorized' || phase === 'sending') {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accentText} />
          <Text variant="title" align="center" style={styles.title}>
            Sending…
          </Text>
          <Text color="muted" align="center">
            {amountText} to {shortenAddress(review.to)}
          </Text>
        </View>
      </Screen>
    );
  }

  if (phase === 'error') {
    return (
      <Screen>
        <View style={styles.center}>
          <CircleX size={64} color={theme.colors.dangerText} strokeWidth={1.5} />
          <Text variant="title" align="center" style={styles.title}>
            {"Couldn't send"}
          </Text>
          <Text color="muted" align="center">
            {SEND_ERROR_TEXT[errorKind ?? 'unknown']}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button title="Review again" onPress={() => router.replace('/send/confirm')} />
          <Button title="Close" variant="outline" onPress={done} />
        </View>
      </Screen>
    );
  }

  // phase === 'sent'
  const status = tracked?.status ?? 'pending';
  return (
    <Screen>
      <View style={styles.center}>
        <CircleCheck size={64} color={theme.colors.okText} strokeWidth={1.5} />
        <Text variant="title" align="center" style={styles.title}>
          Sent!
        </Text>
        <Text color="muted" align="center">
          {amountText} to {shortenAddress(review.to)}
        </Text>

        <View style={styles.statusPill(status)}>
          {status === 'pending' ? (
            <ActivityIndicator size="small" color={theme.colors.warnText} />
          ) : null}
          <Text variant="caption" style={styles.statusText(status)}>
            {status === 'pending'
              ? 'Pending · waiting for confirmation'
              : status === 'confirmed'
                ? `Confirmed on ${network.name}`
                : 'Failed on-chain · the fee was spent, tokens were not moved'}
          </Text>
        </View>

        {hash ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(explorerTxUrl(network, hash))}
            hitSlop={8}
            style={styles.link}
          >
            <Text variant="label" color="accentText">
              View on explorer
            </Text>
            <ExternalLink size={16} color={theme.colors.accentText} />
          </Pressable>
        ) : null}
      </View>
      <Button title="Done" onPress={done} />
    </Screen>
  );
}

export default observer(SendStatusScreen);

type Status = 'pending' | 'confirmed' | 'failed';

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space(2),
    paddingHorizontal: theme.space(2),
  },
  title: {
    marginTop: theme.space(4),
  },
  statusPill: (status: Status) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(2),
    marginTop: theme.space(5),
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(1.5),
    borderRadius: theme.radius.pill,
    backgroundColor: status === 'confirmed' ? theme.colors.okBg : theme.colors.warnBg,
  }),
  statusText: (status: Status) => ({
    color: status === 'confirmed' ? theme.colors.okText : theme.colors.warnText,
    fontFamily: theme.fonts.semibold,
  }),
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(1.5),
    marginTop: theme.space(4),
    minHeight: theme.layout.minTapTarget,
  },
  actions: {
    gap: theme.space(3),
  },
}));
