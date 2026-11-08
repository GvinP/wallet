import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { formatUnits } from 'viem';

import {
  checkFunds,
  checkRecipient,
  estimateTransferFee,
  getPublicClient,
  maxSendable,
  NETWORKS,
  parseAmount,
  toUsdMicros,
} from '@/core/chain';
import { sendDraft, settingsStore, walletStore } from '@/stores';

import { useDebounced } from './useDebounced';
import { useBalances, usePrices } from './usePortfolio';

/** Everything the Send form needs, derived from the draft + live balances, prices and fees. */
export function useSendForm() {
  const network = NETWORKS[settingsStore.network];
  const token = network.tokens.find((t) => t.symbol === sendDraft.token) ?? network.tokens[0];
  const self = walletStore.address!;
  const configured = token.kind === 'native' || token.address !== undefined;

  const balancesQuery = useBalances();
  const prices = usePrices().data;
  const balances = balancesQuery.data;
  const polBalance = balances?.POL ?? null;
  const tokenBalance = balances?.[token.symbol] ?? null;

  const recipient = checkRecipient(sendDraft.recipient, { self, chainId: network.chain.id });
  const amount = parseAmount(sendDraft.amount, token.decimals);

  // Estimate with the real recipient/amount when known. Amounts we can't afford would make
  // the estimate revert, so fall back to 0 there (the funds check reports the real problem).
  const typedAmount = useDebounced(amount.ok ? amount.amount : null, 400);
  const affordable = token.kind === 'native' ? polBalance : tokenBalance;
  const estimateAmount =
    typedAmount !== null && affordable !== null && typedAmount <= affordable ? typedAmount : 0n;
  const estimateTo = recipient.ok ? recipient.address : self;

  const feeQuery = useQuery({
    queryKey: ['fee', network.id, token.symbol, self, estimateTo, estimateAmount.toString()],
    queryFn: () =>
      estimateTransferFee(getPublicClient(network.id), {
        token,
        from: self,
        to: estimateTo,
        amount: estimateAmount,
      }),
    enabled: configured && !!balances,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
  const fee = feeQuery.data ?? null;

  const funds =
    amount.ok && fee && polBalance !== null && tokenBalance !== null
      ? checkFunds(token, amount.amount, { token: tokenBalance, pol: polBalance }, fee)
      : null;

  const max =
    polBalance !== null && tokenBalance !== null
      ? maxSendable(token, { token: tokenBalance, pol: polBalance }, fee)
      : null;

  const tokenPrice = prices?.[token.symbol] ?? null;
  const polPrice = prices?.POL ?? null;

  // The fee must have been estimated for exactly the amount and recipient on screen.
  const feeIsCurrent =
    amount.ok && typedAmount === amount.amount && feeQuery.isSuccess && !feeQuery.isPlaceholderData;
  const canReview =
    configured && recipient.ok && amount.ok && !!fee && funds?.ok === true && feeIsCurrent;

  return {
    network,
    token,
    configured,
    balances,
    balancesLoading: balancesQuery.isPending,
    tokenBalance,
    polBalance,
    recipient,
    amount,
    fee,
    feeLoading: feeQuery.isPending && configured,
    feeError: feeQuery.isError && !fee,
    retryFee: () => void feeQuery.refetch(),
    funds,
    max,
    amountUsdMicros:
      amount.ok && tokenPrice !== null
        ? toUsdMicros(amount.amount, token.decimals, tokenPrice)
        : null,
    feeUsdMicros: fee && polPrice !== null ? toUsdMicros(fee.maxFee, 18, polPrice) : null,
    canReview,
    useMax: () => {
      if (max !== null && max > 0n) sendDraft.setAmount(formatUnits(max, token.decimals));
    },
    review: () => {
      if (!canReview || !recipient.ok || !amount.ok || !fee) return;
      sendDraft.setReview({
        networkId: network.id,
        token: token.symbol,
        to: recipient.address,
        amount: amount.amount,
        fee,
      });
      router.push('/send/confirm');
    },
  };
}
