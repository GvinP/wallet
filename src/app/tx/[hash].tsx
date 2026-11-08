import { useLocalSearchParams } from 'expo-router';

import { ScreenStub } from '@/ui/ScreenStub';

export default function TransactionDetailsScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  return (
    <ScreenStub
      title="Transaction"
      phase={6}
      description={`Details and explorer link for ${hash}.`}
    />
  );
}
