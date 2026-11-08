import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { getBiometryStatus } from '@/core/security';
import { onboardingDraft, sessionStore } from '@/stores';
import { PinEntryScreen } from '@/ui/PinEntryScreen';

export default function ConfirmPinScreen() {
  // Checked once: the draft is cleared on success, before the guard navigates away.
  const [hasDraft] = useState(() => !!onboardingDraft.mnemonic && !!onboardingDraft.pin);
  const [showProgress] = useState(() => onboardingDraft.mode === 'create');
  if (!hasDraft) return <Redirect href="/welcome" />;

  const onComplete = async (pin: string) => {
    if (pin !== onboardingDraft.pin) return "PINs don't match. Try again.";

    const { mnemonic } = onboardingDraft;
    try {
      await sessionStore.createWallet(mnemonic!, pin);
    } catch {
      return "Couldn't save your wallet. Please try again.";
    }
    onboardingDraft.clear();

    const biometry = await getBiometryStatus().catch(() => null);
    if (biometry?.available) {
      router.replace('/enable-biometrics');
    } else {
      sessionStore.finishOnboarding();
    }
    return null;
  };

  return (
    <PinEntryScreen
      title="Confirm your PIN"
      subtitle="Enter the same 6 digits again."
      progress={showProgress ? { step: 3, total: 3 } : undefined}
      busyText="Securing your wallet…"
      onComplete={onComplete}
    />
  );
}
