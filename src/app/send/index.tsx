import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ClipboardPaste, ScanLine } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { formatTokenAmount, formatUsdMicros, sanitizeAmountInput } from '@/core/chain';
import { useSendForm } from '@/hooks/useSendForm';
import { sendDraft } from '@/stores';
import { Button } from '@/ui/Button';
import { amountErrorText, fundsErrorText, recipientErrorText } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';
import { TokenIcon } from '@/ui/TokenIcon';

function SendScreen() {
  const { theme } = useUnistyles();
  const form = useSendForm();
  const { token, network } = form;

  // A fresh flow every time the sheet opens; nothing lingers after it closes.
  useEffect(() => {
    if (sendDraft.phase !== 'editing') sendDraft.reset();
    return () => sendDraft.reset();
  }, []);

  const recipientError = !form.recipient.ok ? recipientErrorText(form.recipient.reason) : null;
  const amountError = !form.amount.ok ? amountErrorText(form.amount.reason, token) : null;
  const fundsError = form.funds && !form.funds.ok ? fundsErrorText(form.funds.reason, token) : null;

  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) sendDraft.setRecipient(text.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll>
        <Header title="Send" />

        {/* Token */}
        <Text variant="caption" color="muted" style={styles.label}>
          TOKEN
        </Text>
        <View style={styles.tokens} accessibilityRole="radiogroup">
          {network.tokens.map((t) => {
            const selected = t.symbol === token.symbol;
            const available = t.kind === 'native' || t.address !== undefined;
            const balance = form.balances?.[t.symbol];
            return (
              <Pressable
                key={t.symbol}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: !available }}
                disabled={!available}
                onPress={() => sendDraft.setToken(t.symbol)}
                style={[styles.tokenCard(selected), !available && styles.disabled]}
              >
                <TokenIcon symbol={t.symbol} size={32} />
                <View style={styles.flexShrink}>
                  <Text variant="label">{t.symbol}</Text>
                  {available && balance == null ? (
                    <Skeleton width={56} height={12} />
                  ) : (
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {!available
                        ? 'Not configured'
                        : formatTokenAmount(balance!, t.decimals, { maxFraction: 4 })}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Recipient */}
        <Text variant="caption" color="muted" style={styles.label}>
          TO
        </Text>
        <View style={styles.field(!!recipientError)}>
          <TextInput
            value={sendDraft.recipient}
            onChangeText={(v) => sendDraft.setRecipient(v)}
            placeholder="0x… address"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            multiline
            accessibilityLabel="Recipient address"
            style={styles.addressInput}
          />
          <View style={styles.fieldActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Paste address"
              hitSlop={8}
              onPress={paste}
              style={styles.iconButton}
            >
              <ClipboardPaste size={20} color={theme.colors.accentText} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan QR code"
              hitSlop={8}
              onPress={() => router.push('/send/scan')}
              style={styles.iconButton}
            >
              <ScanLine size={20} color={theme.colors.accentText} />
            </Pressable>
          </View>
        </View>
        {recipientError ? (
          <Text variant="caption" color="dangerText" style={styles.hint}>
            {recipientError}
          </Text>
        ) : null}

        {/* Amount */}
        <Text variant="caption" color="muted" style={styles.label}>
          AMOUNT
        </Text>
        <View style={styles.field(!!amountError || !!fundsError)}>
          <TextInput
            value={sendDraft.amount}
            onChangeText={(v) => sendDraft.setAmount(sanitizeAmountInput(v, token.decimals))}
            placeholder="0"
            placeholderTextColor={theme.colors.muted}
            keyboardType="decimal-pad"
            accessibilityLabel={`Amount in ${token.symbol}`}
            style={styles.amountInput}
          />
          <Text variant="label" color="muted">
            {token.symbol}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use maximum amount"
            disabled={!form.max}
            onPress={form.useMax}
            style={[styles.maxButton, !form.max && styles.disabled]}
          >
            <Text variant="label" color="accentText">
              Max
            </Text>
          </Pressable>
        </View>
        <View style={styles.amountMeta}>
          <Text variant="caption" color="muted">
            {form.amountUsdMicros !== null ? `≈ ${formatUsdMicros(form.amountUsdMicros)}` : ' '}
          </Text>
          <Text variant="caption" color="muted">
            {form.tokenBalance !== null
              ? `Available: ${formatTokenAmount(form.tokenBalance, token.decimals, { maxFraction: 6 })} ${token.symbol}`
              : ''}
          </Text>
        </View>
        {amountError || fundsError ? (
          <Text variant="caption" color="dangerText" style={styles.hint}>
            {amountError ?? fundsError}
          </Text>
        ) : null}

        {/* Fee */}
        <View style={styles.feeRow}>
          <Text variant="small" color="muted">
            Network fee
          </Text>
          {form.feeLoading ? (
            <ActivityIndicator size="small" color={theme.colors.muted} />
          ) : form.feeError ? (
            <Pressable accessibilityRole="button" onPress={form.retryFee} hitSlop={8}>
              <Text variant="small" color="dangerText">
                {"Couldn't estimate · Retry"}
              </Text>
            </Pressable>
          ) : form.fee ? (
            <Text variant="small">
              ≈ {formatTokenAmount(form.fee.maxFee, 18, { maxFraction: 6 })} POL
              {form.feeUsdMicros !== null ? ` (${formatUsdMicros(form.feeUsdMicros)})` : ''}
            </Text>
          ) : (
            <Text variant="small" color="muted">
              —
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Button title="Review" disabled={!form.canReview} onPress={form.review} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export default observer(SendScreen);

const styles = StyleSheet.create((theme) => ({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  flexShrink: {
    flexShrink: 1,
  },
  label: {
    marginTop: theme.space(5),
    marginBottom: theme.space(2),
    letterSpacing: 0.6,
  },
  tokens: {
    flexDirection: 'row',
    gap: theme.space(3),
  },
  tokenCard: (selected: boolean) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
    padding: theme.space(3),
    borderRadius: theme.radius.card,
    borderWidth: 1.5,
    borderColor: selected ? theme.colors.accent : theme.colors.border,
    backgroundColor: theme.colors.surface,
  }),
  disabled: {
    opacity: 0.45,
  },
  field: (hasError: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(2),
    minHeight: 56,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(2),
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: hasError ? theme.colors.dangerText : theme.colors.border,
    backgroundColor: theme.colors.surface,
  }),
  addressInput: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.mono,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: theme.space(1),
  },
  iconButton: {
    width: theme.layout.minTapTarget,
    height: theme.layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.heading,
    fontSize: 22,
    lineHeight: 28,
  },
  maxButton: {
    height: 32,
    paddingHorizontal: theme.space(3),
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  amountMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.space(2),
  },
  hint: {
    marginTop: theme.space(2),
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space(6),
    paddingVertical: theme.space(3),
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.space(6),
  },
}));
