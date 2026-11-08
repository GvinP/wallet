import { ScreenStub } from '@/ui/ScreenStub';

export default function BackupScreen() {
  return (
    <ScreenStub
      title="Back up your recovery phrase"
      phase={2}
      description="12 words in a 2×6 grid, warning, “I've written it down” checkbox. Screenshots blocked."
      links={[{ title: 'Continue', href: '/create/verify' }]}
    />
  );
}
