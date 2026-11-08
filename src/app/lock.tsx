import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { shortenAddress } from '@/core/wallet';
import { biometryIcon } from '@/hooks/useBiometryStatus';
import { useUnlock } from '@/hooks/useUnlock';
import { walletStore } from '@/stores';
import { formatCountdown } from '@/ui/copy';
import { Logo } from '@/ui/Logo';
import { Keypad, PinDots } from '@/ui/PinPad';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

function LockScreen() {
  const { biometry, biometricsUsable, promptBiometrics, pin, setPin, error, busy, lockedFor } =
    useUnlock();
  const lockedOut = lockedFor > 0;

  return (
    <Screen>
      <View style={styles.top}>
        <Logo size={64} />
        <Text variant="title" align="center" style={styles.title}>
          Welcome back
        </Text>
        {walletStore.address ? (
          <Text variant="small" color="muted" align="center">
            {walletStore.accountName} · {shortenAddress(walletStore.address)}
          </Text>
        ) : null}
      </View>

      <View style={styles.middle}>
        <PinDots length={pin.length} error={!!error && pin.length === 0} />
        <View style={styles.message}>
          {lockedOut ? (
            <Text variant="small" color="dangerText" align="center">
              Too many wrong attempts. Try again in {formatCountdown(lockedFor)}.
            </Text>
          ) : error ? (
            <Text variant="small" color="dangerText" align="center">
              {error}
            </Text>
          ) : (
            <Text variant="small" color="muted" align="center">
              Enter your PIN
            </Text>
          )}
        </View>
      </View>

      <Keypad
        value={pin}
        onChange={setPin}
        disabled={busy || lockedOut}
        extraKey={
          biometricsUsable && biometry
            ? {
                icon: biometryIcon(biometry.kind),
                label: `Unlock with ${biometry.label}`,
                onPress: promptBiometrics,
              }
            : undefined
        }
      />
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push('/forgot-pin')}
        style={styles.forgot}
      >
        <Text variant="label" color="accentText" align="center">
          Forgot PIN?
        </Text>
      </Pressable>
    </Screen>
  );
}

export default observer(LockScreen);

const styles = StyleSheet.create((theme) => ({
  top: {
    alignItems: 'center',
    marginTop: theme.space(10),
    gap: theme.space(2),
  },
  title: {
    marginTop: theme.space(4),
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
  },
  forgot: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: theme.space(2),
  },
  message: {
    minHeight: 48,
    marginTop: theme.space(5),
    paddingHorizontal: theme.space(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
