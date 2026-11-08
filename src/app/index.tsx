import { Redirect } from 'expo-router';
import { observer } from 'mobx-react-lite';

import { sessionStore } from '@/stores';

/**
 * App gate. Also the anchor that Stack.Protected falls back to whenever the session
 * status changes (unlock, auto-lock, onboarding finished).
 */
function Index() {
  switch (sessionStore.status) {
    case 'booting':
      return null;
    case 'onboarding':
      return <Redirect href="/welcome" />;
    case 'locked':
      return <Redirect href="/lock" />;
    case 'unlocked':
      return <Redirect href="/wallet" />;
  }
}

export default observer(Index);
