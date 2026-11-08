import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { onboardingDraft } from '@/stores';
import { PinEntryScreen } from '@/ui/PinEntryScreen';

export default function SetPinScreen() {
  const [hasDraft] = useState(() => !!onboardingDraft.mnemonic);
  const [showProgress] = useState(() => onboardingDraft.mode === 'create');
  if (!hasDraft) return <Redirect href="/welcome" />;

  return (
    <PinEntryScreen
      title="Create a PIN"
      subtitle="You'll use this 6-digit PIN to unlock Amethyst and confirm transfers."
      progress={showProgress ? { step: 3, total: 3 } : undefined}
      onComplete={(pin) => {
        onboardingDraft.pin = pin;
        router.push('/confirm-pin');
        return null;
      }}
    />
  );
}
