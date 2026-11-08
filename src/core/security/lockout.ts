/** Wrong PINs allowed before any delay kicks in (spec: "after 5 wrong attempts"). */
export const FREE_PIN_ATTEMPTS = 5;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** Delay after the 5th, 6th, 7th… consecutive wrong PIN. The last value repeats. */
export const LOCKOUT_STEPS_MS = [30 * SECOND, MINUTE, 5 * MINUTE, 15 * MINUTE, 60 * MINUTE];

/** How long to lock after `failedAttempts` consecutive wrong PINs (0 = no lock). */
export function lockoutDelayMs(failedAttempts: number): number {
  if (failedAttempts < FREE_PIN_ATTEMPTS) return 0;
  const step = Math.min(failedAttempts - FREE_PIN_ATTEMPTS, LOCKOUT_STEPS_MS.length - 1);
  return LOCKOUT_STEPS_MS[step]!;
}
