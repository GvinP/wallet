import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';

import { sessionStore } from '@/stores';
import { Banner } from '@/ui/Banner';
import { PrivacyCover } from '@/ui/PrivacyCover';
import { Screen } from '@/ui/Screen';

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { theme } = useUnistyles();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [bootError, setBootError] = useState(false);
  const { status } = sessionStore;

  useEffect(() => {
    sessionStore.bootstrap().catch(() => setBootError(true));
    const sub = AppState.addEventListener('change', (s) => sessionStore.handleAppStateChange(s));
    return () => sub.remove();
  }, []);

  // Keep the native root view in sync so screen transitions never flash a wrong color.
  useEffect(() => {
    UnistylesRuntime.setRootViewBackgroundColor(theme.colors.bg);
  }, [theme.colors.bg]);

  // If fonts fail to load we still render with the system font rather than hang on the splash.
  const ready = (fontsLoaded || !!fontError) && (status !== 'booting' || bootError);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (bootError) {
    return (
      <Screen>
        <Banner
          tone="danger"
          text="Amethyst couldn't read its secure storage. Restart the app; if this keeps happening, make sure the device has a screen lock set."
        />
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'locked'}>
          <Stack.Screen name="lock" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'unlocked'}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="receive" options={{ presentation: 'modal' }} />
          <Stack.Screen name="send" options={{ presentation: 'modal' }} />
          <Stack.Screen name="tx/[hash]" />
          <Stack.Screen name="dev/benchmark" />
        </Stack.Protected>
      </Stack>
      <PrivacyCover />
    </>
  );
}

export default observer(RootLayout);
