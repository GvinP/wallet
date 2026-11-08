import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useRef } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { parseAddressInput } from '@/core/chain';
import { sendDraft } from '@/stores';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function ScanScreen() {
  const { theme } = useUnistyles();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (handled.current) return;
    const candidate = parseAddressInput(data);
    if (!/^0x[0-9a-fA-F]{40}$/.test(candidate.address)) return; // not an address QR — keep scanning
    handled.current = true;
    // Keep the raw value so the form can also reject a wrong-chain EIP-681 URI.
    sendDraft.setRecipient(data.trim());
    router.back();
  };

  if (!permission) return <Screen>{null}</Screen>;

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text variant="title" align="center">
            Camera access
          </Text>
          <Text color="muted" align="center" style={styles.text}>
            Amethyst needs the camera to scan an address QR code. Nothing is recorded or stored.
          </Text>
        </View>
        <View style={styles.actions}>
          {permission.canAskAgain ? (
            <Button title="Allow camera" onPress={requestPermission} />
          ) : (
            <Button title="Open Settings" onPress={() => Linking.openSettings()} />
          )}
          <Button title="Cancel" variant="outline" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          onPress={() => router.back()}
          style={styles.close}
        >
          <X size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.frame} />
        <Text align="center" style={styles.hintText}>
          Point the camera at a wallet address QR code
        </Text>
        <View style={{ height: theme.space(10) }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rt.insets.top + theme.space(3),
    paddingBottom: rt.insets.bottom + theme.space(6),
  },
  close: {
    alignSelf: 'flex-end',
    marginRight: theme.space(4),
    width: theme.layout.minTapTarget,
    height: theme.layout.minTapTarget,
    borderRadius: theme.layout.minTapTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  hintText: {
    color: '#FFFFFF',
    paddingHorizontal: theme.space(8),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    marginTop: theme.space(3),
  },
  actions: {
    gap: theme.space(3),
  },
}));
