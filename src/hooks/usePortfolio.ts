import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { fetchPrices } from '@/api/prices';
import { queryKeys } from '@/api/queryClient';
import { buildPortfolio, fetchBalances, getPublicClient, NETWORKS } from '@/core/chain';
import { settingsStore, walletStore } from '@/stores';

/** Spec §8: prices cached for 60 s. */
export function usePrices() {
  return useQuery({
    queryKey: queryKeys.prices,
    queryFn: fetchPrices,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

/** Spec §8: refresh on open, pull-to-refresh, and every 30 s on the home screen. */
export function useBalances({ poll = false }: { poll?: boolean } = {}) {
  const networkId = settingsStore.network;
  const address = walletStore.address;
  return useQuery({
    queryKey: queryKeys.balances(networkId, address ?? ''),
    queryFn: () => fetchBalances(getPublicClient(networkId), NETWORKS[networkId], address!),
    enabled: !!address,
    refetchOnMount: 'always',
    refetchInterval: poll ? 30_000 : false,
  });
}

export function usePortfolio(options?: { poll?: boolean }) {
  const network = NETWORKS[settingsStore.network];
  const balances = useBalances(options);
  const prices = usePrices();

  const portfolio = useMemo(
    () => buildPortfolio(network, balances.data, prices.data),
    [network, balances.data, prices.data],
  );

  const refetchBalances = balances.refetch;
  const refetchPrices = prices.refetch;
  const refresh = useCallback(async () => {
    await Promise.all([refetchBalances(), refetchPrices()]);
  }, [refetchBalances, refetchPrices]);

  return {
    network,
    portfolio,
    isLoading: balances.isPending,
    balancesError: balances.isError && !balances.data ? balances.error : null,
    balancesStale: balances.isError && !!balances.data,
    pricesError: prices.isError && !prices.data ? prices.error : null,
    isRefreshing: balances.isRefetching || prices.isRefetching,
    refresh,
  };
}
