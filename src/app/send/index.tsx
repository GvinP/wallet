import { ScreenStub } from '@/ui/ScreenStub';

export default function SendScreen() {
  return (
    <ScreenStub
      title="Send"
      phase={5}
      description="Token → recipient (paste / scan QR) → amount with USD equivalent and Max."
      links={[{ title: 'Review', href: '/send/confirm' }]}
    />
  );
}
