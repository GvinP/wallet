import QuickCrypto from 'react-native-quick-crypto';

import type { Pbkdf2Fn } from './kdf';

function load(): Pbkdf2Fn | null {
  try {
    if (typeof QuickCrypto?.pbkdf2 !== 'function') return null;
    return (hash, password, salt, iterations, dkLen) =>
      new Promise((resolve, reject) => {
        QuickCrypto.pbkdf2(password, salt, iterations, dkLen, hash, (error, key) => {
          if (error || !key) reject(error ?? new Error('pbkdf2 failed'));
          else resolve(new Uint8Array(key.buffer, key.byteOffset, key.byteLength).slice());
        });
      });
  } catch {
    return null; // e.g. Expo Go without the native module — JS fallback
  }
}

/** iOS/Android: PBKDF2 in native OpenSSL (react-native-quick-crypto, Nitro). */
export const nativePbkdf2: Pbkdf2Fn | null = load();
