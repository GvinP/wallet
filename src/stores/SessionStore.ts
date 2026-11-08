import { makeAutoObservable, runInAction } from 'mobx';
import type { AppStateStatus } from 'react-native';

import type { PinManager, Vault } from '@/core/security';

import type { WalletStore } from './WalletStore';

/** Spec: lock when the app was in the background for longer than 1 minute. */
export const AUTO_LOCK_AFTER_MS = 60_000;

export type SessionStatus = 'booting' | 'onboarding' | 'locked' | 'unlocked';

type Deps = {
  vault: Vault;
  pinManager: PinManager;
  wallet: WalletStore;
  now?: () => number;
};

/** App lifecycle: is there a wallet, is it locked, auto-lock on background. */
export class SessionStore {
  status: SessionStatus = 'booting';
  private backgroundedAt: number | null = null;

  private readonly vault: Vault;
  private readonly pinManager: PinManager;
  private readonly wallet: WalletStore;
  private readonly now: () => number;

  constructor({ vault, pinManager, wallet, now = Date.now }: Deps) {
    this.vault = vault;
    this.pinManager = pinManager;
    this.wallet = wallet;
    this.now = now;
    makeAutoObservable<this, 'vault' | 'pinManager' | 'wallet' | 'now'>(this, {
      vault: false,
      pinManager: false,
      wallet: false,
      now: false,
    });
  }

  /**
   * Decides where the app starts. Also repairs half-finished setups:
   * a PIN without a wallet, or a wallet without a PIN (which could never be unlocked).
   */
  async bootstrap(): Promise<void> {
    const [hasWallet, hasPin] = await Promise.all([
      this.vault.hasWallet(),
      this.pinManager.hasPin(),
    ]);

    if (hasWallet && hasPin) {
      // e.g. iOS reinstall: Keychain survives, MMKV doesn't.
      if (!this.wallet.address) this.wallet.setAddress(await this.vault.getAddress());
      runInAction(() => (this.status = 'locked'));
      return;
    }

    await this.vault.wipe();
    await this.pinManager.clear();
    this.wallet.clear();
    runInAction(() => (this.status = 'onboarding'));
  }

  /**
   * Commits a new wallet. PIN goes first: if the app dies in between we end up with
   * "PIN but no wallet", which bootstrap() cleans up — never with an unlockable wallet.
   */
  async createWallet(mnemonic: string, pin: string): Promise<void> {
    await this.pinManager.setPin(pin);
    try {
      const { address } = await this.vault.importMnemonic(mnemonic);
      this.wallet.setAddress(address);
    } catch (error) {
      await this.pinManager.clear();
      throw error;
    }
  }

  /** Last onboarding step (after the optional biometrics offer). */
  finishOnboarding() {
    this.status = 'unlocked';
  }

  unlock() {
    if (this.status === 'locked') this.status = 'unlocked';
  }

  lock() {
    if (this.status === 'unlocked') this.status = 'locked';
  }

  handleAppStateChange(next: AppStateStatus) {
    if (next === 'background') {
      this.backgroundedAt ??= this.now();
      return;
    }
    if (next === 'active') {
      const since = this.backgroundedAt;
      this.backgroundedAt = null;
      if (since !== null && this.now() - since > AUTO_LOCK_AFTER_MS) this.lock();
    }
  }
}
