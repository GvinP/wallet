import Constants from 'expo-constants';

/** "0.1.0", or "0.1.0 (dev)" in development builds. */
export function appVersion(): string {
  const version = Constants.expoConfig?.version ?? '—';
  return __DEV__ ? `${version} (dev)` : version;
}
