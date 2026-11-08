import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometryKind = 'faceId' | 'touchId' | 'fingerprint' | 'face' | 'iris' | 'biometrics';

export type BiometryStatus = {
  /** Hardware present AND something enrolled. */
  available: boolean;
  kind: BiometryKind;
  /** Human label for UI copy, e.g. "Face ID", "Fingerprint". */
  label: string;
};

const LABELS: Record<BiometryKind, string> = {
  faceId: 'Face ID',
  touchId: 'Touch ID',
  fingerprint: 'Fingerprint',
  face: 'Face unlock',
  iris: 'Iris',
  biometrics: 'Biometrics',
};

export function biometryLabel(kind: BiometryKind): string {
  return LABELS[kind];
}

/** Maps supported types to a single kind. Several types on Android → generic "Biometrics". */
export function resolveBiometryKind(
  types: LocalAuthentication.AuthenticationType[],
  os: typeof Platform.OS,
): BiometryKind {
  const { FACIAL_RECOGNITION, FINGERPRINT, IRIS } = LocalAuthentication.AuthenticationType;
  if (os === 'ios') {
    if (types.includes(FACIAL_RECOGNITION)) return 'faceId';
    if (types.includes(FINGERPRINT)) return 'touchId';
    return 'biometrics';
  }
  if (types.length !== 1) return 'biometrics';
  if (types[0] === FINGERPRINT) return 'fingerprint';
  if (types[0] === FACIAL_RECOGNITION) return 'face';
  if (types[0] === IRIS) return 'iris';
  return 'biometrics';
}

export async function getBiometryStatus(): Promise<BiometryStatus> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  const kind = resolveBiometryKind(types, Platform.OS);
  return { available: hasHardware && isEnrolled, kind, label: biometryLabel(kind) };
}

export type BiometricResult =
  | { success: true }
  | { success: false; reason: 'cancelled' | 'fallback' | 'lockout' | 'unavailable' | 'failed' };

/**
 * Biometric-only prompt. The OS passcode fallback is disabled on purpose: our fallback is the
 * app PIN, so the "Use PIN" button (cancel) returns `cancelled`/`fallback` and the UI shows the PIN pad.
 */
export async function authenticateWithBiometrics(promptMessage: string): Promise<BiometricResult> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Use PIN',
    fallbackLabel: '',
    disableDeviceFallback: true,
    biometricsSecurityLevel: 'strong',
  });
  if (result.success) return { success: true };

  switch (result.error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return { success: false, reason: 'cancelled' };
    case 'user_fallback':
      return { success: false, reason: 'fallback' };
    case 'lockout':
      return { success: false, reason: 'lockout' };
    case 'not_enrolled':
    case 'not_available':
    case 'passcode_not_set':
      return { success: false, reason: 'unavailable' };
    default:
      return { success: false, reason: 'failed' };
  }
}
