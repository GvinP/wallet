import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { authenticateWithBiometrics, PIN_LENGTH, pinManager } from '@/core/security';
import { sessionStore, settingsStore } from '@/stores';

import { useBiometryStatus } from './useBiometryStatus';

/**
 * Lock-screen logic: auto biometric prompt (only while the app is in the foreground),
 * PIN entry with the persisted lockout, countdown while locked out.
 */
export function useUnlock() {
  const biometry = useBiometryStatus();
  const [pin, setPinState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const prompted = useRef(false);
  const mounted = useRef(true);

  const biometricsUsable = settingsStore.biometricsEnabled && !!biometry?.available;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const promptBiometrics = useCallback(async () => {
    if (!biometricsUsable || !biometry) return;
    const result = await authenticateWithBiometrics('Unlock Amethyst');
    if (result.success) sessionStore.unlock();
    else if (result.reason === 'lockout' && mounted.current) {
      setError(`${biometry.label} is locked. Use your PIN.`);
    }
  }, [biometricsUsable, biometry]);

  // Restore an active lockout (survives restarts).
  useEffect(() => {
    pinManager
      .getLockState()
      .then((s) => {
        if (!mounted.current) return;
        setNow(Date.now());
        setLockedUntil(s.lockedUntil);
      })
      .catch(() => {});
  }, []);

  // Auto-prompt once, as soon as we're in the foreground (never from the background).
  useEffect(() => {
    if (!biometricsUsable) return;
    const tryPrompt = () => {
      if (prompted.current || AppState.currentState !== 'active') return;
      prompted.current = true;
      void promptBiometrics();
    };
    tryPrompt();
    const sub = AppState.addEventListener('change', tryPrompt);
    return () => sub.remove();
  }, [biometricsUsable, promptBiometrics]);

  // Countdown tick while locked out.
  useEffect(() => {
    if (lockedUntil === null) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) {
        setLockedUntil(null);
        setError(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const verify = async (value: string) => {
    setBusy(true);
    try {
      const result = await pinManager.verify(value);
      if (result.status === 'ok') {
        sessionStore.unlock();
        return;
      }
      if (!mounted.current) return;
      setPinState('');
      setNow(Date.now());
      setLockedUntil(result.lockedUntil);
      setError(
        result.status === 'wrong' && result.lockedUntil === null
          ? `Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'attempt' : 'attempts'} left before a temporary lock.`
          : null,
      );
    } catch {
      if (!mounted.current) return;
      setPinState('');
      setError("Couldn't check the PIN. Please try again.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const setPin = (value: string) => {
    setError(null);
    setPinState(value);
    if (value.length === PIN_LENGTH) void verify(value);
  };

  const lockedFor = lockedUntil !== null ? Math.max(0, lockedUntil - now) : 0;

  return { biometry, biometricsUsable, promptBiometrics, pin, setPin, error, busy, lockedFor };
}
