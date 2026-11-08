import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';

import { kdfBackend, pbkdf2, utf8 } from '../crypto/kdf';

import { FREE_PIN_ATTEMPTS, lockoutDelayMs } from './lockout';
import { SECURE_KEYS, type SecureKeyValueStore } from './secureStore';

export const PIN_LENGTH = 6;

/**
 * PBKDF2-SHA256 work factor, stored per record (raising it rehashes on the next successful unlock).
 *
 * Measured on a mid-range Android (Hermes): 10k iterations in pure JS = 3.0 s per unlock — too slow.
 * With native OpenSSL (react-native-quick-crypto) 100k iterations take tens of milliseconds, so we
 * use 100k there and keep 10k only for the JS fallback.
 *
 * Note: the PIN hash lives in the same Keychain/Keystore as the phrase, so the attempt counter +
 * lockout is the primary defence; the KDF keeps the stored value from being trivially reversible.
 */
export const NATIVE_PIN_ITERATIONS = 100_000;
export const JS_PIN_ITERATIONS = 10_000;
export const DEFAULT_PIN_ITERATIONS =
  kdfBackend === 'native' ? NATIVE_PIN_ITERATIONS : JS_PIN_ITERATIONS;

type PinRecord = {
  v: 1;
  kdf: 'pbkdf2-sha256';
  iterations: number;
  salt: string;
  hash: string;
};

type PinAttempts = {
  failed: number;
  /** Epoch ms until which verification is refused, or null. */
  lockedUntil: number | null;
};

export type PinVerifyResult =
  | { status: 'ok' }
  | { status: 'wrong'; attemptsLeft: number; lockedUntil: number | null }
  | { status: 'locked'; lockedUntil: number };

export type PinLockState = { failedAttempts: number; lockedUntil: number | null };

export class PinFormatError extends Error {
  constructor() {
    super(`PIN must be exactly ${PIN_LENGTH} digits`);
    this.name = 'PinFormatError';
  }
}

export class NoPinError extends Error {
  constructor() {
    super('PIN is not set');
    this.name = 'NoPinError';
  }
}

export function isValidPinFormat(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export async function hashPin(pin: string, salt: Uint8Array, iterations: number) {
  return pbkdf2('sha256', utf8(pin), salt, iterations, 32);
}

/** Constant-time comparison so timing doesn't leak how many bytes matched. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

type PinManagerOptions = {
  iterations?: number;
  now?: () => number;
};

/**
 * PIN hash + attempt counter, both in SecureStore so that killing the app
 * doesn't reset the back-off.
 */
export class PinManager {
  private readonly iterations: number;
  private readonly now: () => number;

  constructor(
    private readonly store: SecureKeyValueStore,
    options: PinManagerOptions = {},
  ) {
    this.iterations = options.iterations ?? DEFAULT_PIN_ITERATIONS;
    this.now = options.now ?? Date.now;
  }

  async hasPin(): Promise<boolean> {
    return (await this.store.get(SECURE_KEYS.pinRecord)) !== null;
  }

  async setPin(pin: string): Promise<void> {
    if (!isValidPinFormat(pin)) throw new PinFormatError();
    const salt = randomBytes(16);
    const hash = await hashPin(pin, salt, this.iterations);
    const record: PinRecord = {
      v: 1,
      kdf: 'pbkdf2-sha256',
      iterations: this.iterations,
      salt: bytesToHex(salt),
      hash: bytesToHex(hash),
    };
    await this.store.set(SECURE_KEYS.pinRecord, JSON.stringify(record));
    await this.writeAttempts({ failed: 0, lockedUntil: null });
  }

  async getLockState(): Promise<PinLockState> {
    const attempts = await this.readAttempts();
    const lockedUntil =
      attempts.lockedUntil !== null && attempts.lockedUntil > this.now()
        ? attempts.lockedUntil
        : null;
    return { failedAttempts: attempts.failed, lockedUntil };
  }

  async verify(pin: string): Promise<PinVerifyResult> {
    const raw = await this.store.get(SECURE_KEYS.pinRecord);
    if (raw === null) throw new NoPinError();

    const attempts = await this.readAttempts();
    if (attempts.lockedUntil !== null && attempts.lockedUntil > this.now()) {
      return { status: 'locked', lockedUntil: attempts.lockedUntil };
    }

    const record = JSON.parse(raw) as PinRecord;
    const matches =
      isValidPinFormat(pin) &&
      constantTimeEqual(
        await hashPin(pin, hexToBytes(record.salt), record.iterations),
        hexToBytes(record.hash),
      );

    if (matches) {
      await this.writeAttempts({ failed: 0, lockedUntil: null });
      // Transparently upgrade old records if we raised the work factor.
      if (record.iterations < this.iterations) await this.setPin(pin);
      return { status: 'ok' };
    }

    const failed = attempts.failed + 1;
    const delay = lockoutDelayMs(failed);
    const lockedUntil = delay > 0 ? this.now() + delay : null;
    await this.writeAttempts({ failed, lockedUntil });
    return {
      status: 'wrong',
      attemptsLeft: Math.max(0, FREE_PIN_ATTEMPTS - failed),
      lockedUntil,
    };
  }

  async clear(): Promise<void> {
    await this.store.delete(SECURE_KEYS.pinRecord);
    await this.store.delete(SECURE_KEYS.pinAttempts);
  }

  private async readAttempts(): Promise<PinAttempts> {
    const raw = await this.store.get(SECURE_KEYS.pinAttempts);
    if (raw === null) return { failed: 0, lockedUntil: null };
    try {
      const parsed = JSON.parse(raw) as PinAttempts;
      return { failed: parsed.failed ?? 0, lockedUntil: parsed.lockedUntil ?? null };
    } catch {
      return { failed: 0, lockedUntil: null };
    }
  }

  private writeAttempts(attempts: PinAttempts): Promise<void> {
    return this.store.set(SECURE_KEYS.pinAttempts, JSON.stringify(attempts));
  }
}
