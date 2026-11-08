/**
 * Data that only exists between onboarding screens: the phrase being created/imported and the
 * first PIN entry. Plain in-memory object — deliberately NOT a MobX store and never persisted.
 * Cleared as soon as the wallet is committed to SecureStore or the flow is abandoned.
 */
export class OnboardingDraft {
  mode: 'create' | 'import' | null = null;
  mnemonic: string | null = null;
  pin: string | null = null;

  start(mode: 'create' | 'import', mnemonic: string | null = null) {
    this.clear();
    this.mode = mode;
    this.mnemonic = mnemonic;
  }

  clear() {
    this.mode = null;
    this.mnemonic = null;
    this.pin = null;
  }
}
