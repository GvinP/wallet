import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

export default function SendLayout() {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="status" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
