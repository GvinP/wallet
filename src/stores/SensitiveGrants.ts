export type SensitiveAction = 'revealPhrase' | 'deleteWallet';

/** A PIN check unlocks one sensitive screen once, for a short time. */
const GRANT_TTL_MS = 30_000;

/**
 * One-time, short-lived permissions issued right after a successful PIN check.
 * Screens that expose or destroy secrets consume a grant on mount, so they can't be reached
 * by navigation alone (deep link `amethyst://recovery-phrase`, back stack, etc.).
 * In-memory only.
 */
export class SensitiveGrants {
  private readonly issued = new Map<SensitiveAction, number>();

  constructor(private readonly now: () => number = Date.now) {}

  grant(action: SensitiveAction) {
    this.issued.set(action, this.now());
  }

  /** true exactly once per grant, and only within the TTL. */
  consume(action: SensitiveAction): boolean {
    const at = this.issued.get(action);
    this.issued.delete(action);
    return at !== undefined && this.now() - at <= GRANT_TTL_MS;
  }

  clear() {
    this.issued.clear();
  }
}
