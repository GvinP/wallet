import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { fetchNormalTxs, fetchTokenTxs, MissingApiKeyError } from '@/api/etherscan';
import { queryKeys } from '@/api/queryClient';
import {
  mergeHistory,
  NETWORKS,
  normalizeNormalTx,
  normalizeTokenTx,
  type HistoryItem,
} from '@/core/chain';
import { env } from '@/core/chain/env';
import { pendingTxStore, settingsStore, walletStore } from '@/stores';

/**
 * Indexed history (Etherscan V2 txlist + tokentx) merged with transfers sent from this device.
 * Without an API key only the local transfers are shown (`missingKey`).
 * Call from an observer component: it reads MobX stores.
 */
export function useHistory() {
  const network = NETWORKS[settingsStore.network];
  const address = walletStore.address;
  const hasKey = !!env.etherscanKey;

  const query = useQuery({
    queryKey: queryKeys.history(network.id, address ?? ''),
    queryFn: async (): Promise<HistoryItem[]> => {
      const self = address!;
      const usdt = network.tokens[1].address;
      const [normal, tokens] = await Promise.all([
        fetchNormalTxs(network.chain.id, self),
        usdt ? fetchTokenTxs(network.chain.id, self, usdt) : Promise.resolve([]),
      ]);
      return [
        ...normal.map((tx) => normalizeNormalTx(tx, self, network)),
        ...tokens.map((tx) => normalizeTokenTx(tx, self, network)),
      ].filter((x): x is HistoryItem => x !== null);
    },
    enabled: !!address && hasKey,
    refetchOnMount: 'always',
    staleTime: 15_000,
  });

  // Reading the store makes the calling observer re-render when a local tx changes.
  // Merging ≤ ~100 rows is cheap, so no memoization is needed.
  const local = pendingTxStore.forNetwork(network.id);
  const indexed = query.data;
  const items = address ? mergeHistory(indexed ?? [], local, address) : [];

  const refetch = query.refetch;
  const refresh = useCallback(async () => {
    if (hasKey) await refetch();
  }, [hasKey, refetch]);

  return {
    network,
    items,
    missingKey: !hasKey || query.error instanceof MissingApiKeyError,
    isLoading: hasKey && query.isPending && local.length === 0,
    error:
      query.isError && !(query.error instanceof MissingApiKeyError) && !indexed
        ? query.error
        : null,
    isRefreshing: query.isRefetching,
    refresh,
  };
}
