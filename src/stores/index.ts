import { queryClient, queryKeys } from '@/api/queryClient';
import { getPublicClient } from '@/core/chain/clients';
import { pinManager, vault } from '@/core/security';

import { OnboardingDraft } from './OnboardingDraft';
import { PendingTxStore } from './PendingTxStore';
import { SendDraft } from './SendDraft';
import { SessionStore } from './SessionStore';
import { SettingsStore } from './SettingsStore';
import { WalletStore } from './WalletStore';

// App-wide singletons.
export const settingsStore = new SettingsStore();
export const walletStore = new WalletStore();
export const sessionStore = new SessionStore({ vault, pinManager, wallet: walletStore });
export const onboardingDraft = new OnboardingDraft();
export const sendDraft = new SendDraft();
export const pendingTxStore = new PendingTxStore({
  getClient: getPublicClient,
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.balancesRoot });
    // The indexer may lag a few seconds behind the receipt; refetch now and once more shortly.
    void queryClient.invalidateQueries({ queryKey: queryKeys.historyRoot });
    setTimeout(
      () => void queryClient.invalidateQueries({ queryKey: queryKeys.historyRoot }),
      8_000,
    );
  },
});
