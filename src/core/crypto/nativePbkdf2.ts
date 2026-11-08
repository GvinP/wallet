import type { Pbkdf2Fn } from './kdf';

/** Node / Jest / web: no native module — callers fall back to the JS implementation. */
export const nativePbkdf2: Pbkdf2Fn | null = null;
