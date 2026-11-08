import { ScreenStub } from '@/ui/ScreenStub';

export default function ImportScreen() {
  return (
    <ScreenStub
      title="Import wallet"
      phase={2}
      description="Enter a 12 or 24 word phrase — validated against the BIP39 wordlist and checksum."
      links={[{ title: 'Continue', href: '/set-pin' }]}
    />
  );
}
