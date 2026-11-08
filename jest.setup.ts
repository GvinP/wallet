// Unistyles ships official Jest mocks (also mocks react-native-nitro-modules).
// react-native-mmkv switches to an in-memory mock automatically under Jest.
import 'react-native-unistyles/mocks';

// Register our real themes with the mocked StyleSheet so components get proper tokens.
import './src/theme/unistyles';

// react-native-quick-crypto is native (Nitro/OpenSSL). Under Jest we back it with Node's own
// OpenSSL PBKDF2, so tests exercise the same code path as the device ("native" backend).
jest.mock('react-native-quick-crypto', () => {
  const { pbkdf2 } = jest.requireActual('crypto') as { pbkdf2: unknown };
  return { __esModule: true, default: { pbkdf2 } };
});
