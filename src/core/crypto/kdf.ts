import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';

import { nativePbkdf2 } from './nativePbkdf2';

export type Pbkdf2Hash = 'sha256' | 'sha512';
export type Pbkdf2Fn = (
  hash: Pbkdf2Hash,
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  dkLen: number,
) => Promise<Uint8Array>;

/** Pure-JS PBKDF2 (@noble/hashes). Correct everywhere, but slow on Hermes (no JIT). */
export const jsPbkdf2: Pbkdf2Fn = (hash, password, salt, iterations, dkLen) =>
  pbkdf2Async(hash === 'sha256' ? sha256 : sha512, password, salt, { c: iterations, dkLen });

/**
 * PBKDF2 used by the whole app (BIP39 seed, PIN hash).
 * On iOS/Android this is native OpenSSL via react-native-quick-crypto (~100× faster than JS on
 * Hermes — measured 4.2 s for a BIP39 seed in JS on a mid-range Android); in Node/Jest it is JS.
 */
export const pbkdf2: Pbkdf2Fn = nativePbkdf2 ?? jsPbkdf2;

export const kdfBackend: 'native' | 'js' = nativePbkdf2 ? 'native' : 'js';

const encoder = new TextEncoder();
export const utf8 = (text: string) => encoder.encode(text);
