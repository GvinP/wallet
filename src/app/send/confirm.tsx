import { ScreenStub } from '@/ui/ScreenStub';

export default function ConfirmSendScreen() {
  return (
    <ScreenStub
      title="Confirm send"
      phase={5}
      description="Amount, From, To, Network, Network fee, irreversibility warning, Cancel / Confirm."
      links={[{ title: 'Confirm', href: '/send/status', replace: true }]}
    />
  );
}
