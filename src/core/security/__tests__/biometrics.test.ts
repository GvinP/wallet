import { AuthenticationType } from 'expo-local-authentication';

import { biometryLabel, resolveBiometryKind } from '../biometrics';

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
