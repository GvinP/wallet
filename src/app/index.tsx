import { Redirect } from 'expo-router';

// Phase 2 turns this into the app gate: no wallet → onboarding, wallet exists → lock screen.
export default function Index() {
  return <Redirect href="/welcome" />;
}
