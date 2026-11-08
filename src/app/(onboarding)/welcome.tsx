import { ScreenStub } from '@/ui/ScreenStub';

export default function WelcomeScreen() {
  return (
    <ScreenStub
      title="Amethyst"
      phase={2}
      description="Logo, three benefits, “Create a new wallet” / “I already have a wallet”."
      links={[
        { title: 'Create a new wallet', href: '/create/backup' },
        { title: 'I already have a wallet', href: '/import' },
        { title: 'Dev: skip to wallet', href: '/wallet', replace: true },
      ]}
    />
  );
}
