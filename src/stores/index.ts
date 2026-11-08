import { pinManager, vault } from '@/core/security';

import { OnboardingDraft } from './OnboardingDraft';
import { SessionStore } from './SessionStore';
import { SettingsStore } from './SettingsStore';
import { WalletStore } from './WalletStore';

// App-wide singletons. PendingTxStore arrives in phase 5.
export const settingsStore = new SettingsStore();
export const walletStore = new WalletStore();
export const sessionStore = new SessionStore({ vault, pinManager, wallet: walletStore });
export const onboardingDraft = new OnboardingDraft();
