import { router } from 'expo-router';

import { Button } from '@/ui/Button';
import { ScreenStub } from '@/ui/ScreenStub';

export default function SendStatusScreen() {
  return (
    <ScreenStub
      title="Sending…"
      phase={5}
      description="“Sending…” → “Sent!” or an error, with an explorer link."
    >
      <Button title="Done" variant="secondary" onPress={() => router.dismissAll()} />
    </ScreenStub>
  );
}
