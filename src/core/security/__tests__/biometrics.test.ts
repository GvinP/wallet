import { AuthenticationType } from 'expo-local-authentication';

import {
  authenticateWithBiometrics,
  biometryLabel,
  getBiometryStatus,
  resolveBiometryKind,
} from '../biometrics';

jest.mock('expo-local-authentication', () => ({
  ...jest.requireActual('expo-local-authentication'),
  authenticateAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
}));

const { FACIAL_RECOGNITION, FINGERPRINT, IRIS } = AuthenticationType;

describe('resolveBiometryKind', () => {
  it.each([
    ['ios', [FACIAL_RECOGNITION], 'faceId', 'Face ID'],
    ['ios', [FINGERPRINT], 'touchId', 'Touch ID'],
    ['ios', [], 'biometrics', 'Biometrics'],
    ['android', [FINGERPRINT], 'fingerprint', 'Fingerprint'],
    ['android', [FACIAL_RECOGNITION], 'face', 'Face unlock'],
    ['android', [IRIS], 'iris', 'Iris'],
    ['android', [FINGERPRINT, FACIAL_RECOGNITION], 'biometrics', 'Biometrics'],
  ] as const)('%s %p → %s', (os, types, kind, label) => {
    const resolved = resolveBiometryKind([...types], os);
    expect(resolved).toBe(kind);
    expect(biometryLabel(resolved)).toBe(label);
  });
});

describe('authenticateWithBiometrics', () => {
  const LA = jest.requireMock('expo-local-authentication') as {
    authenticateAsync: jest.Mock;
  };

  it('uses a biometric-only prompt whose cancel button is our PIN fallback', async () => {
    LA.authenticateAsync.mockResolvedValueOnce({ success: true });
    await expect(authenticateWithBiometrics('Unlock Amethyst')).resolves.toEqual({ success: true });
    expect(LA.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Unlock Amethyst',
      cancelLabel: 'Use PIN',
      fallbackLabel: '',
      disableDeviceFallback: true,
      biometricsSecurityLevel: 'strong',
    });
  });

  it.each([
    ['user_cancel', 'cancelled'],
    ['system_cancel', 'cancelled'],
    ['app_cancel', 'cancelled'],
    ['user_fallback', 'fallback'],
    ['lockout', 'lockout'],
    ['not_enrolled', 'unavailable'],
    ['not_available', 'unavailable'],
    ['passcode_not_set', 'unavailable'],
    ['authentication_failed', 'failed'],
    ['unknown', 'failed'],
  ])('%s → %s', async (error, reason) => {
    LA.authenticateAsync.mockResolvedValueOnce({ success: false, error });
    await expect(authenticateWithBiometrics('x')).resolves.toEqual({ success: false, reason });
  });
});

describe('getBiometryStatus', () => {
  const LA = jest.requireMock('expo-local-authentication') as Record<string, jest.Mock>;

  it('is available only with hardware AND enrolment', async () => {
    LA.hasHardwareAsync!.mockResolvedValueOnce(true);
    LA.isEnrolledAsync!.mockResolvedValueOnce(false);
    LA.supportedAuthenticationTypesAsync!.mockResolvedValueOnce([FINGERPRINT]);
    await expect(getBiometryStatus()).resolves.toMatchObject({ available: false });
  });
});
