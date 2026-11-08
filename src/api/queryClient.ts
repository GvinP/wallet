import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15_000,
      // No global placeholderData: after a network switch we must never show the previous
      // network's balances. A failed refetch keeps the last data for the same key anyway.
    },
  },
});

/** React Native has no window focus: map it to AppState so queries refetch on return. */
export function subscribeAppFocus(): () => void {
  if (Platform.OS === 'web') return () => {};
  const sub = AppState.addEventListener('change', (status) =>
    focusManager.setFocused(status === 'active'),
  );
  return () => sub.remove();
}

export const queryKeys = {
  prices: ['prices'] as const,
  balancesRoot: ['balances'] as const,
  balances: (networkId: string, address: string) => ['balances', networkId, address] as const,
  historyRoot: ['history'] as const,
  history: (networkId: string, address: string) => ['history', networkId, address] as const,
};
