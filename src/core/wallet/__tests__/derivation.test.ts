import { bytesToHex, verifyMessage } from 'viem';

import { deriveAccount, deriveAddress, DERIVATION_PATH, mnemonicToSeed, wipeBytes } from '..';

// Public test vectors — never use these phrases for real funds.
const HARDHAT = 'test test test test test test test test test test test junk';
const ABANDON =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('derivation', () => {
  it('uses the MetaMask path for Account 1', () => {
    expect(DERIVATION_PATH).toBe("m/44'/60'/0'/0/0");
  });

  it('spec acceptance: "test … junk" → 0xf39F…2266', async () => {
    const seed = await mnemonicToSeed(HARDHAT);
    expect(deriveAddress(seed)).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  it('matches the BIP39 reference seed and the known ETH address for "abandon … about"', async () => {
    const seed = await mnemonicToSeed(ABANDON);
    expect(bytesToHex(seed)).toBe(
      '0x5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1' +
        '9a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4',
    );
    expect(deriveAddress(seed)).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });

  it('derived account produces signatures that recover to its address', async () => {
    const account = deriveAccount(await mnemonicToSeed(HARDHAT));
    const signature = await account.signMessage({ message: 'amethyst' });
    await expect(
      verifyMessage({ address: account.address, message: 'amethyst', signature }),
    ).resolves.toBe(true);
  });

  it('wipeBytes zeroes a buffer', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    wipeBytes(bytes);
    expect([...bytes]).toEqual([0, 0, 0]);
  });
});
