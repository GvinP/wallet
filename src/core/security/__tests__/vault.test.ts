import { createMemorySecureStore, SECURE_KEYS } from '../secureStore';
import { InvalidMnemonicError, NoWalletError, Vault } from '../vault';

const PHRASE = 'test test test test test test test test test test test junk';
const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

describe('Vault', () => {
  it('starts empty', async () => {
    const vault = new Vault(createMemorySecureStore());
    await expect(vault.hasWallet()).resolves.toBe(false);
    await expect(vault.getAddress()).rejects.toBeInstanceOf(NoWalletError);
  });

  it('imports a phrase, stores mnemonic + seed and returns the address', async () => {
    const store = createMemorySecureStore();
    const vault = new Vault(store);

    await expect(vault.importMnemonic(`  ${PHRASE.toUpperCase()} `)).resolves.toEqual({
      address: ADDRESS,
    });
    await expect(vault.hasWallet()).resolves.toBe(true);
    await expect(vault.getAddress()).resolves.toBe(ADDRESS);
    await expect(vault.revealMnemonic()).resolves.toBe(PHRASE);

    const stored = store.dump();
    expect(stored[SECURE_KEYS.mnemonic]).toBe(PHRASE);
    expect(stored[SECURE_KEYS.seed]).toMatch(/^0x[0-9a-f]{128}$/);
  });

  it('rejects an invalid phrase and leaves storage untouched', async () => {
    const store = createMemorySecureStore();
    const vault = new Vault(store);
    await expect(vault.importMnemonic('test test test')).rejects.toBeInstanceOf(
      InvalidMnemonicError,
    );
    expect(store.dump()).toEqual({});
  });

  it('withSigner gives a working account', async () => {
    const vault = new Vault(createMemorySecureStore());
    await vault.importMnemonic(PHRASE);
    const address = await vault.withSigner(async (account) => {
      await account.signMessage({ message: 'hi' });
      return account.address;
    });
    expect(address).toBe(ADDRESS);
  });

  it('treats a half-written wallet (seed without mnemonic) as no wallet', async () => {
    const vault = new Vault(createMemorySecureStore({ [SECURE_KEYS.seed]: '0x00' }));
    await expect(vault.hasWallet()).resolves.toBe(false);
    await expect(vault.withSigner(async () => 1)).rejects.toBeInstanceOf(NoWalletError);
  });

  it('wipe removes all wallet secrets', async () => {
    const store = createMemorySecureStore();
    const vault = new Vault(store);
    await vault.importMnemonic(PHRASE);
    await vault.wipe();
    expect(store.dump()).toEqual({});
    await expect(vault.hasWallet()).resolves.toBe(false);
  });
});
