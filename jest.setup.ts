// Unistyles ships official Jest mocks (also mocks react-native-nitro-modules).
// react-native-mmkv switches to an in-memory mock automatically under Jest.
import 'react-native-unistyles/mocks';

// Register our real themes with the mocked StyleSheet so components get proper tokens.
import './src/theme/unistyles';
