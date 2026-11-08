import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

export default function OnboardingLayout() {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    />
  );
}
