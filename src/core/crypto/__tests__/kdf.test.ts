import { bytesToHex } from '@noble/hashes/utils';

import { jsPbkdf2, kdfBackend, pbkdf2, utf8 } from '../kdf';

// RFC 7914 §11 / widely published PBKDF2-HMAC-SHA256 vectors.
const VECTORS = [
  {
    hash: 'sha256' as const,
    password: 'password',
    salt: 'salt',
    c: 1,
    dkLen: 32,
    out: '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b',
  },
  {
    hash: 'sha256' as const,
    password: 'password',
    salt: 'salt',
    c: 4096,
    dkLen: 32,
    out: 'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a',
  },
];

describe('PBKDF2 backends', () => {
  it('uses the native backend in the app (mocked by Node OpenSSL under Jest)', () => {
    expect(kdfBackend).toBe('native');
  });

  it.each(VECTORS)('native and JS agree with the reference ($hash, c=$c)', async (v) => {
    const args = [v.hash, utf8(v.password), utf8(v.salt), v.c, v.dkLen] as const;
    expect(bytesToHex(await pbkdf2(...args))).toBe(v.out);
    expect(bytesToHex(await jsPbkdf2(...args))).toBe(v.out);
  });

  it('BIP39-shaped SHA-512 derivation matches between backends', async () => {
    const args = ['sha512', utf8('abandon about'), utf8('mnemonic'), 2048, 64] as const;
    expect(bytesToHex(await pbkdf2(...args))).toBe(bytesToHex(await jsPbkdf2(...args)));
  });
});
