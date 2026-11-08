# Decisions log

Agreed deviations from / clarifications of the original spec. Newest last.

## Phase 0 — before kickoff

| #   | Topic                | Decision                                                                                                                                                                                                                                                                                                                                                                       |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Extra dependencies   | Approved: `react-native-nitro-modules` (required by Unistyles 3 and MMKV 4, pinned to an exact version as Unistyles recommends), `lucide-react-native` + `react-native-svg` (icons), `expo-system-ui` (makes `userInterfaceStyle: automatic` work on Android). `react-native-edge-to-edge` is **not** needed: it is deprecated and Expo SDK 54+ enables edge-to-edge natively. |
| 2   | Tooling deps         | `babel-preset-expo` is listed explicitly because `babel.config.js` (needed for the Unistyles Babel plugin) references it. `react-dom` is pinned to match `react`, because expo-router pulls it in transitively for web and npm otherwise resolves a mismatched version.                                                                                                        |
| 3   | Secret storage       | SecureStore holds **both** the mnemonic and the 64-byte BIP39 seed. Signing derives the private key from the seed (fast BIP32 path `m/44'/60'/0'/0/0`) and drops it right after. PBKDF2 (mnemonic → seed) runs only once, at create/import.                                                                                                                                    |
| 4   | PBKDF2 speed         | Measure first with plain viem / `@scure/bip39` in phase 1. Add native crypto (`react-native-quick-crypto`) only if create/import is too slow on Android.                                                                                                                                                                                                                       |
| 5   | Public address       | Cached in MMKV (not secret) so lock and home screens never touch the mnemonic.                                                                                                                                                                                                                                                                                                 |
| 6   | PIN                  | Slow KDF (PBKDF2-SHA256, high iteration count, random salt) via `@noble/hashes` (already a viem dependency). Attempt counter and lockout deadline stored in SecureStore so restarting the app doesn't reset the back-off.                                                                                                                                                      |
| 7   | App switcher privacy | A full-screen cover is shown on every screen whenever `AppState` leaves `active` — hides the seed phrase and balances in the iOS/Android app switcher.                                                                                                                                                                                                                         |
| 8   | Welcome copy         | The biometrics benefit is device-specific: Face ID / Touch ID / Fingerprint / Biometrics.                                                                                                                                                                                                                                                                                      |
| 9   | Max for POL          | `balance − gasLimit × maxFeePerGas × buffer`, so a "Max" transfer can't fail with insufficient funds when the base fee moves.                                                                                                                                                                                                                                                  |

## Phase 0 — implementation notes

- **Expo SDK 58** (RN 0.88, React 19.3, New Architecture only).
- **Theme switching.** Unistyles forbids combining `adaptiveThemes` with `initialTheme`, so the stored preference (`system` / `dark` / `light`, in MMKV) picks one of them at `StyleSheet.configure` time. Afterwards we toggle via `UnistylesRuntime.setAdaptiveThemes` / `setTheme`. A manual choice is also pushed to `Appearance.setColorScheme` so native UI (keyboard, alerts) matches.
- **Entry order** (`index.ts`): `react-native-get-random-values` → Unistyles config → `expo-router/entry`.
- **Lint rule** `no-console` (only `warn`/`error` allowed) — a cheap guard against logging secrets.
- **Bundle IDs**: `com.gvinp.amethyst` on both platforms (change before publishing if needed).

## Phase 1 — wallet core

- **`@scure/bip39` and `@noble/hashes` as direct deps**, pinned to exactly the versions viem already ships (deduped — no extra bundle code). viem doesn't re-export `validateMnemonic` / `mnemonicToSeed`, and PBKDF2 for the PIN comes from `@noble/hashes` (decision 6).
- **PIN work factor revised (supersedes the "slow KDF" part of decision 6).** Measured 100k PBKDF2-SHA256 iterations at ~7.5 s on a JIT-less interpreter (Hermes has no JIT). The PIN hash sits in the same Keychain/Keystore as the mnemonic, so an attacker who can extract it already has the phrase — heavy stretching buys almost nothing. The real defence is the persisted attempt counter + growing lockout. Default is **10k iterations**, stored per record; raising it later rehashes on the next successful unlock. Final value to be tuned on a low-end Android via the dev benchmark.
  - Possible future hardening (out of MVP scope): encrypt the seed with a PIN-derived key and keep a second copy of that key behind an OS biometric-bound Keychain item — then the KDF becomes meaningful.
- **Lockout schedule:** 4 free mistakes; from the 5th: 30 s → 1 min → 5 min → 15 min → 1 h (repeats). Counter + deadline live in SecureStore. Note: based on the device clock.
- **SecureStore options:** `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (no migration to other devices); `requireAuthentication` is _not_ used because app access is gated by our own biometrics-with-PIN-fallback lock.
- **Biometric prompt:** `disableDeviceFallback: true` (fallback is our PIN, not the OS passcode), Android `biometricsSecurityLevel: 'strong'` (Class 3 only).
- **Dev benchmark:** `/dev/benchmark` (dev builds only, link in Settings) times mnemonic generation, mnemonic → seed, seed → account and the PIN hash on the device, using the public test phrase.

| Step (Node 22, x86) | With JIT | `--jitless` |
| ------------------- | -------- | ----------- |
| Mnemonic → seed     | ~8 ms    | ~550 ms     |
| Seed → account      | ~3 ms    | ~7 ms       |
| PIN hash ×100k      | ~150 ms  | ~7 500 ms   |

## Phase 2 — onboarding + lock

- **Routing:** session status (`booting → onboarding | locked | unlocked`) drives `Stack.Protected` groups in the root layout; `src/app/index.tsx` is the always-available anchor that redirects by status. Locking drops the navigation history of the unlocked area (after unlock you land on the Wallet tab).
- **Write order on wallet creation:** PIN first, then mnemonic + seed. `bootstrap()` repairs either half-finished state (PIN without wallet → cleared; wallet without PIN → wiped, since it could never be unlocked).
- **iOS reinstall:** the Keychain may survive an uninstall while MMKV doesn't. We keep the wallet (lock screen, old PIN) and re-derive the cached address from the seed.
- **Onboarding draft** (phrase + first PIN entry) is a plain in-memory object, not MobX and never persisted; cleared right after the wallet is committed.
- **Auto-lock** counts only time in `background` (> 60 s). `inactive` alone (Face ID prompt, Control Centre) never locks, but does show the privacy cover.
- **Biometric unlock** never resets the PIN attempt counter; only a correct PIN does.
- **PIN entry** uses our own keypad — the system keyboard (and its learning/clipboard features) never sees the PIN.
- **Phrase input on Android** uses `keyboardType="visible-password"` to disable suggestions/learning; autocorrect, autofill and spell-check are off on both platforms.
- **Screen capture** is blocked on backup, verify and import (`usePreventScreenCapture`; iOS 13+ blocks screenshots too).
- **Not done (yet):** "Forgot PIN?" (reset by re-importing the phrase) — candidate for phase 7. Clearing the clipboard after a pasted import was skipped: reading the clipboard again triggers the iOS paste-permission prompt.

## Phase 3 — home screen

- **Mainnet behind a flag.** Spec §9 puts the network switch in phase 3, while §11 forbids touching mainnet until phase 5 is done. Both networks are configured, the switcher works, but `MAINNET_ENABLED = false` keeps Polygon visible-but-disabled. Flip after phase 5 acceptance + USDT address re-verification.
- **Default RPCs:** viem's chain defaults are now `polygon-amoy.drpc.org` / `polygon.drpc.org` (the old `rpc-amoy.polygon.technology` timed out from the dev container). Overridable via `EXPO_PUBLIC_RPC_*`.
- **CoinGecko ids verified** (2026-11-08): `polygon-ecosystem-token` (POL), `tether`. The keyless API returns 429 from shared IPs, so an optional free demo key `EXPO_PUBLIC_COINGECKO_KEY` was added (sent as `x-cg-demo-api-key`). No new dependency.
- **Integer money math:** USD values are bigint cents = amount × price-as-8-decimal-fixed-point. Token amounts are truncated for display (never shown higher than held); dust shows as `<0.0001`.
- **Total with missing prices:** sums what's priced and appends "+" when a held asset has no price.
- **Query keys** include network id and address; no global `placeholderData` so a network switch can never show the other network's balances. A failed refetch keeps the last data and shows an info banner.
- **Focus refetch:** TanStack `focusManager` is wired to `AppState`.
- **Integration tests** (`npm run test:integration`) hit the live Amoy RPC in a plain Node Jest config — jest-expo stubs global `fetch`.
- **Recent activity** on the home screen is an empty state until phase 6.

## Phase 4 — receive

- **QR payload = bare checksummed address** (not an EIP-681 `ethereum:0x…@80002` URI). It's what MetaMask itself shows and every wallet/exchange scanner accepts; chain-id URIs are parsed inconsistently by other apps. The network is communicated by the pill and the warning instead.
- **QR is always black on white** (ECL M) regardless of theme — inverted codes fail on many scanners.
- Warning text follows the spec/mockup, with the network name substituted (e.g. "…on the Polygon Amoy network…").
- `react-native-qrcode-svg` (spec dependency) pulls in `text-encoding`, which npm flags as deprecated; harmless (used only for non-ASCII payloads), noted for the README.
