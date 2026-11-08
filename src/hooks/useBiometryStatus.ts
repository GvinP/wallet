import { FingerprintPattern, ScanFace, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { getBiometryStatus, type BiometryKind, type BiometryStatus } from '@/core/security';

export function biometryIcon(kind: BiometryKind): LucideIcon {
  return kind === 'faceId' || kind === 'face' ? ScanFace : FingerprintPattern;
}

/** null while loading. Treats any error as "no biometrics" — the PIN always works. */
export function useBiometryStatus(): BiometryStatus | null {
  const [status, setStatus] = useState<BiometryStatus | null>(null);
  useEffect(() => {
    let alive = true;
    getBiometryStatus()
      .catch((): BiometryStatus => ({ available: false, kind: 'biometrics', label: 'Biometrics' }))
      .then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}
