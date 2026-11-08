import { ScreenStub } from '@/ui/ScreenStub';

export default function ConfirmPinScreen() {
  return (
    <ScreenStub
      title="Confirm your PIN"
      phase={2}
      links={[{ title: 'Continue', href: '/enable-biometrics' }]}
    />
  );
}
