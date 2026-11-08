import { ScreenStub } from '@/ui/ScreenStub';

export default function LockScreen() {
  return (
    <ScreenStub
      title="Unlock Amethyst"
      phase={2}
      description="Biometric prompt starts automatically; “Use PIN” as a fallback."
      links={[{ title: 'Dev: unlock', href: '/wallet', replace: true }]}
    />
  );
}
