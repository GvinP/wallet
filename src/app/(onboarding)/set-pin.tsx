import { ScreenStub } from '@/ui/ScreenStub';

export default function SetPinScreen() {
  return (
    <ScreenStub
      title="Create a PIN"
      phase={2}
      description="6-digit PIN used to unlock the app and confirm transfers."
      links={[{ title: 'Continue', href: '/confirm-pin' }]}
    />
  );
}
