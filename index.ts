// Entry point. Import order matters:
// 1. Polyfills first — viem and @scure/bip39 need crypto.getRandomValues.
// 2. Unistyles must be configured before any StyleSheet.create() runs.
// 3. expo-router/entry last — it registers the root component.
import 'react-native-get-random-values';
import './src/theme/unistyles';
import 'expo-router/entry';
