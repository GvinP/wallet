# Amethyst

A self-custody wallet for Polygon (POL + USDT), built with Expo and React Native.

> Work in progress. The full README (architecture, security model, screenshots) lands in the final phase.

## Stack

Expo SDK 58 (dev build, New Architecture) · TypeScript strict · expo-router · react-native-unistyles 3 · MobX · TanStack Query · viem · expo-secure-store · react-native-mmkv · Jest

## Getting started

Amethyst uses native modules (Unistyles, MMKV, Nitro), so it **does not run in Expo Go** — you need a development build.

```bash
npm install
cp .env.example .env          # fill in what you need

# Local dev build (needs Xcode / Android Studio)
npm run ios
npm run android

# …or build the dev client in the cloud
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development-simulator --platform ios

# Then start Metro for the installed dev client
npm start
```

## Scripts

| Command                           | What it does                    |
| --------------------------------- | ------------------------------- |
| `npm start`                       | Metro for the dev client        |
| `npm run ios` / `npm run android` | Build and run a local dev build |
| `npm run typecheck`               | `tsc --noEmit`                  |
| `npm run lint`                    | ESLint (expo config + Prettier) |
| `npm test`                        | Jest (unit + component)         |
| `npm run test:integration`        | Live tests against the Amoy RPC |
| `npm run format`                  | Prettier                        |
| `npm run doctor`                  | `expo-doctor`                   |

## Project layout

```
src/
  app/        expo-router routes
  core/       framework-free logic: wallet, chain, security, storage
  stores/     MobX stores
  api/        CoinGecko, Etherscan V2
  hooks/      data hooks (TanStack Query)
  ui/         shared components
  theme/      design tokens + Unistyles config
docs/         decisions log and guides
```
