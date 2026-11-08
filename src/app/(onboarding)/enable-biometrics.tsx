import { ScreenStub } from '@/ui/ScreenStub';

export default function EnableBiometricsScreen() {
  return (
    <ScreenStub
      title="Unlock faster"
      phase={2}
      description="Offer Face ID / Touch ID / Fingerprint depending on the device."
      links={[{ title: 'Finish', href: '/wallet', replace: true }]}
    />
  );
}
