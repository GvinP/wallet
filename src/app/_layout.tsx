import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { theme } = useUnistyles();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Keep the native root view in sync so screen transitions never flash a wrong color.
  useEffect(() => {
    UnistylesRuntime.setRootViewBackgroundColor(theme.colors.bg);
  }, [theme.colors.bg]);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // If fonts fail to load we still render with the system font rather than hang on the splash.
  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="lock" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="receive" options={{ presentation: 'modal' }} />
        <Stack.Screen name="send" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
