import { ScreenStub } from '@/ui/ScreenStub';

export default function ActivityScreen() {
  return (
    <ScreenStub
      title="Activity"
      phase={6}
      bottomInset={false}
      description="Full history grouped by day with Pending / Confirmed / Failed statuses."
      links={[{ title: 'Dev: transaction details', href: '/tx/0x0' }]}
    />
  );
}
