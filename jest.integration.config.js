/**
 * Live tests against real public endpoints (Amoy RPC). Not part of `npm test`:
 * jest-expo stubs global fetch, so these run in a plain Node environment.
 *   npm run test:integration
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
  transform: { '\\.[jt]sx?$': 'babel-jest' },
  // babel-preset-expo rewrites process.env.EXPO_PUBLIC_* to an ESM virtual module.
  transformIgnorePatterns: ['/node_modules/(?!expo/virtual/)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testTimeout: 30_000,
};
