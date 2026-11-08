import { FingerprintPattern, ScanFace, type LucideProps } from 'lucide-react-native';

import type { BiometryKind } from '@/core/security';

export function BiometryIcon({ kind, ...props }: LucideProps & { kind: BiometryKind }) {
  return kind === 'faceId' || kind === 'face' ? (
    <ScanFace {...props} />
  ) : (
    <FingerprintPattern {...props} />
  );
}
