import { ScreenStub } from '@/ui/ScreenStub';

export default function VerifyScreen() {
  return (
    <ScreenStub
      title="Verify your phrase"
      phase={2}
      description="Pick words #3, #7 and #11 from four options each."
      links={[{ title: 'Continue', href: '/set-pin' }]}
    />
  );
}
