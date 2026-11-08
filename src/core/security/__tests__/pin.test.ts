import { FREE_PIN_ATTEMPTS, lockoutDelayMs } from '../lockout';
import { isValidPinFormat, NoPinError, PinFormatError, PinManager } from '../pin';
import { createMemorySecureStore, SECURE_KEYS } from '../secureStore';

// Low work factor keeps tests fast; production uses DEFAULT_PIN_ITERATIONS.
const FAST = 1_000;

function setup(startAt = 1_000_000) {
  let now = startAt;
  const store = createMemorySecureStore();
  const make = () => new PinManager(store, { iterations: FAST, now: () => now });
  return {
    store,
    pins: make(),
    make,
    advance: (ms: number) => {
      now += ms;
    },
    now: () => now,
  };
}

describe('PIN format', () => {
  it.each([
    ['123456', true],
    ['000000', true],
    ['12345', false],
    ['1234567', false],
    ['12a456', false],
    [' 123456', false],
  ])('%p → %p', (pin, valid) => {
    expect(isValidPinFormat(pin)).toBe(valid);
  });
});

describe('lockoutDelayMs', () => {
  it('allows 4 free mistakes, then grows and caps at 1 hour', () => {
    expect(FREE_PIN_ATTEMPTS).toBe(5);
    expect([1, 2, 3, 4].map(lockoutDelayMs)).toEqual([0, 0, 0, 0]);
    expect(lockoutDelayMs(5)).toBe(30_000);
    expect(lockoutDelayMs(6)).toBe(60_000);
    expect(lockoutDelayMs(7)).toBe(300_000);
    expect(lockoutDelayMs(8)).toBe(900_000);
    expect(lockoutDelayMs(9)).toBe(3_600_000);
    expect(lockoutDelayMs(50)).toBe(3_600_000);
  });
});

describe('PinManager', () => {
  it('stores a salted hash, never the PIN itself', async () => {
    const { pins, store } = setup();
    await pins.setPin('482915');
    const raw = store.dump()[SECURE_KEYS.pinRecord]!;
    expect(raw).not.toContain('482915');
    const record = JSON.parse(raw);
    expect(record).toMatchObject({ v: 1, kdf: 'pbkdf2-sha256', iterations: FAST });
    expect(record.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(record.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('uses a fresh salt each time', async () => {
    const { pins, store } = setup();
    await pins.setPin('111111');
    const first = JSON.parse(store.dump()[SECURE_KEYS.pinRecord]!);
    await pins.setPin('111111');
    const second = JSON.parse(store.dump()[SECURE_KEYS.pinRecord]!);
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });

  it('rejects malformed PINs on set', async () => {
    await expect(setup().pins.setPin('12345')).rejects.toBeInstanceOf(PinFormatError);
  });

  it('throws when no PIN is set', async () => {
    await expect(setup().pins.verify('123456')).rejects.toBeInstanceOf(NoPinError);
  });

  it('accepts the right PIN and rejects a wrong one', async () => {
    const { pins } = setup();
    await pins.setPin('123456');
    await expect(pins.verify('123456')).resolves.toEqual({ status: 'ok' });
    await expect(pins.verify('654321')).resolves.toEqual({
      status: 'wrong',
      attemptsLeft: 4,
      lockedUntil: null,
    });
  });

  it('locks after 5 wrong attempts and grows the delay', async () => {
    const { pins, advance, now } = setup();
    await pins.setPin('123456');

    for (let i = 0; i < 4; i++) await pins.verify('000000');
    const fifth = await pins.verify('000000');
    expect(fifth).toEqual({ status: 'wrong', attemptsLeft: 0, lockedUntil: now() + 30_000 });

    // Even the right PIN is refused while locked.
    await expect(pins.verify('123456')).resolves.toEqual({
      status: 'locked',
      lockedUntil: now() + 30_000,
    });

    advance(30_000);
    const sixth = await pins.verify('000000');
    expect(sixth).toEqual({ status: 'wrong', attemptsLeft: 0, lockedUntil: now() + 60_000 });
  });

  it('keeps the lockout across app restarts (new instance, same storage)', async () => {
    const { pins, make, now } = setup();
    await pins.setPin('123456');
    for (let i = 0; i < 5; i++) await pins.verify('000000');

    const restarted = make();
    await expect(restarted.getLockState()).resolves.toEqual({
      failedAttempts: 5,
      lockedUntil: now() + 30_000,
    });
    await expect(restarted.verify('123456')).resolves.toMatchObject({ status: 'locked' });
  });

  it('resets the counter after a successful PIN', async () => {
    const { pins } = setup();
    await pins.setPin('123456');
    for (let i = 0; i < 3; i++) await pins.verify('000000');
    await pins.verify('123456');
    await expect(pins.getLockState()).resolves.toEqual({ failedAttempts: 0, lockedUntil: null });
  });

  it('rehashes with a higher work factor after a successful unlock', async () => {
    const store = createMemorySecureStore();
    await new PinManager(store, { iterations: FAST }).setPin('123456');
    const upgraded = new PinManager(store, { iterations: FAST * 2 });
    await expect(upgraded.verify('123456')).resolves.toEqual({ status: 'ok' });
    expect(JSON.parse(store.dump()[SECURE_KEYS.pinRecord]!).iterations).toBe(FAST * 2);
  });

  it('clear removes the PIN and the counter', async () => {
    const { pins, store } = setup();
    await pins.setPin('123456');
    await pins.clear();
    expect(store.dump()).toEqual({});
  });
});
