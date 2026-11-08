import { PinManager } from '@/core/security/pin';
import { createMemorySecureStore, SECURE_KEYS } from '@/core/security/secureStore';
import { Vault } from '@/core/security/vault';
import { storage } from '@/core/storage/mmkv';

import { AUTO_LOCK_AFTER_MS, SessionStore } from '../SessionStore';
import { WalletStore } from '../WalletStore';

const PHRASE = 'test test test test test test test test test test test junk';
const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

function setup(initial: Record<string, string> = {}) {
  let now = 1_000_000;
  const store = createMemorySecureStore(initial);
  const vault = new Vault(store);
  const pinManager = new PinManager(store, { iterations: 1_000, now: () => now });
  const wallet = new WalletStore();
  const session = new SessionStore({ vault, pinManager, wallet, now: () => now });
  return {
    store,
    vault,
    pinManager,
    wallet,
    session,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

beforeEach(() => storage.clearAll());

describe('SessionStore.bootstrap', () => {
  it('goes to onboarding when there is no wallet', async () => {
    const { session } = setup();
    expect(session.status).toBe('booting');
    await session.bootstrap();
    expect(session.status).toBe('onboarding');
  });

  it('goes to the lock screen when a wallet and PIN exist', async () => {
    const { session, store } = setup();
    await session.createWallet(PHRASE, '123456');

    // App restart: fresh stores over the same SecureStore + MMKV contents.
    const restarted = setup(store.dump());
    await restarted.session.bootstrap();
    expect(restarted.session.status).toBe('locked');
    expect(restarted.wallet.address).toBe(ADDRESS);
  });

  it('restores the cached address from the seed if MMKV was wiped (iOS reinstall)', async () => {
    const { session, store } = setup();
    await session.createWallet(PHRASE, '123456');
    storage.clearAll();

    const reinstalled = setup(store.dump());
    expect(reinstalled.wallet.address).toBeNull();
    await reinstalled.session.bootstrap();
    expect(reinstalled.session.status).toBe('locked');
    expect(reinstalled.wallet.address).toBe(ADDRESS);
  });

  it('cleans up a PIN left without a wallet', async () => {
    const { session, pinManager, store } = setup();
    await pinManager.setPin('123456');
    await session.bootstrap();
    expect(session.status).toBe('onboarding');
    expect(store.dump()).toEqual({});
  });

  it('wipes a wallet left without a PIN (it could never be unlocked)', async () => {
    const { vault, store } = setup();
    await vault.importMnemonic(PHRASE);

    const next = setup(store.dump());
    await next.session.bootstrap();
    expect(next.session.status).toBe('onboarding');
    expect(next.store.dump()).toEqual({});
  });
});

describe('SessionStore.createWallet', () => {
  it('stores PIN + wallet and caches the address', async () => {
    const { session, wallet, store } = setup();
    await session.createWallet(PHRASE, '123456');
    expect(wallet.address).toBe(ADDRESS);
    expect(storage.getString('wallet.address')).toBe(ADDRESS);
    expect(Object.keys(store.dump()).sort()).toEqual(
      [
        SECURE_KEYS.mnemonic,
        SECURE_KEYS.pinAttempts,
        SECURE_KEYS.pinRecord,
        SECURE_KEYS.seed,
      ].sort(),
    );
  });

  it('rolls back the PIN if saving the wallet fails', async () => {
    const { session, store } = setup();
    await expect(session.createWallet('not a phrase', '123456')).rejects.toThrow();
    expect(store.dump()).toEqual({});
  });
});

describe('SessionStore auto-lock', () => {
  async function unlocked() {
    const ctx = setup();
    await ctx.session.createWallet(PHRASE, '123456');
    await ctx.session.bootstrap();
    ctx.session.unlock();
    expect(ctx.session.status).toBe('unlocked');
    return ctx;
  }

  it('stays unlocked after a short trip to the background', async () => {
    const { session, advance } = await unlocked();
    session.handleAppStateChange('background');
    advance(AUTO_LOCK_AFTER_MS);
    session.handleAppStateChange('active');
    expect(session.status).toBe('unlocked');
  });

  it('locks after more than a minute in the background', async () => {
    const { session, advance } = await unlocked();
    session.handleAppStateChange('inactive');
    session.handleAppStateChange('background');
    advance(AUTO_LOCK_AFTER_MS + 1);
    session.handleAppStateChange('active');
    expect(session.status).toBe('locked');
  });

  it('ignores "inactive" alone (Face ID prompt, notification centre)', async () => {
    const { session, advance } = await unlocked();
    session.handleAppStateChange('inactive');
    advance(5 * AUTO_LOCK_AFTER_MS);
    session.handleAppStateChange('active');
    expect(session.status).toBe('unlocked');
  });

  it('never "unlocks" from onboarding and lock() is a no-op there', async () => {
    const { session } = setup();
    await session.bootstrap();
    session.unlock();
    session.lock();
    expect(session.status).toBe('onboarding');
  });
});
