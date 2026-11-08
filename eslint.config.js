// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  { ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*', 'coverage/*'] },
  expoConfig,
  prettier,
  {
    rules: {
      // Wallet rule: never log anything by accident (mnemonics, keys, PINs).
      // Use console.warn / console.error deliberately and never with secrets.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
]);
