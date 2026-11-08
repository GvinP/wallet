# Device verification checklist

Everything that can't be verified in CI / the cloud container and must be checked on real
devices. Grouped by phase; tick items off during the joint review.

Legend: 🤖 Android · 🍏 iOS · 📱 both

## Phase 0 — scaffold

- [ ] 📱 Dev build compiles and launches (`npm run android` / `npm run ios` or EAS `development` profile)
- [ ] 📱 Inter is rendered (titles look bold/semibold, not the system font)
- [ ] 📱 Settings → Appearance: System / Dark / Light switch the theme instantly
- [ ] 📱 Manual theme survives an app restart; "System" follows the OS dark-mode toggle live
- [ ] 📱 No white flash between screens in dark mode; status bar icons readable in both themes
- [ ] 📱 Splash screen uses the dark background in dark mode
- [ ] 📱 Tab bar icons (lucide) and colors match the mockups

## Phase 1 — wallet core

- [ ] 🤖 Settings → "Dev: crypto benchmark" → Run on a low/mid-range Android. Record:
  - mnemonic → seed: ____ ms (spec threshold: discuss if > 1.5 s)
  - seed → account: ____ ms
  - PIN hash (10k): ____ ms (target ≤ ~300 ms; adjust `DEFAULT_PIN_ITERATIONS`)
- [ ] 🍏 Same benchmark on iOS (for the README)

## Phase 2 — onboarding + lock

Create flow

- [ ] 📱 Welcome matches the mockup; the third benefit says "Face ID and PIN" / "Touch ID and PIN" / "Fingerprint and PIN" depending on the device ("PIN protection" without biometrics)
- [ ] 📱 Backup: words hidden until "Show phrase"; checkbox disabled until revealed; Continue disabled until checked
- [ ] 🍏 Backup / verify / import: taking a screenshot is blocked (or produces a blank image); screen recording shows black
- [ ] 🤖 Backup / verify / import: screenshot blocked; app preview in Recents is blank
- [ ] 📱 Verify: words #3, #7, #11 with 4 options; wrong choice shows a red hint; Continue only when all 3 are right
- [ ] 📱 "Show the phrase again" goes back to the same 12 words
- [ ] 📱 PIN: custom keypad (system keyboard never appears); mismatch on confirm shows "PINs don't match"
- [ ] 📱 "Securing your wallet…" spinner is visible while the wallet is saved (note how long it takes on Android: ____ s)
- [ ] 📱 Biometrics offer appears only if the device has biometrics enrolled; "Enable" shows the system prompt; "Not now" skips
- [ ] 🤖 Hardware back on the biometrics offer finishes onboarding (doesn't return to the PIN screens)
- [ ] 🍏 Face ID permission prompt shows the text "Amethyst uses Face ID to unlock the app and confirm transfers."

Import flow

- [ ] 📱 Import `test test test test test test test test test test test junk` → home shows `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- [ ] 📱 **Acceptance:** import your own MetaMask phrase (a test account!) → the address on the home screen equals MetaMask "Account 1"
- [ ] 📱 Errors: wrong word count, misspelled word (shows which one), bad checksum (swap two words)
- [ ] 📱 Paste button inserts the clipboard; on 🤖 the keyboard shows no suggestions in the phrase field

Lock

- [ ] 📱 **Acceptance:** kill the app and relaunch → lock screen (not onboarding)
- [ ] 📱 With biometrics on: the prompt appears automatically; its cancel button says "Use PIN" and leads to the keypad
- [ ] 📱 Biometric button on the keypad (bottom-left) re-opens the prompt
- [ ] 📱 Wrong PIN shows attempts left; after 5 wrong PINs the keypad is disabled with a countdown (0:30), then 1:00, 5:00…
- [ ] 📱 The lockout countdown survives killing and relaunching the app
- [ ] 📱 Background the app for < 1 min → still unlocked; for > 1 min → lock screen on return
- [ ] 📱 App switcher shows the logo cover, not the screen content (any screen)
- [ ] 🍏 Face ID prompt on the lock screen doesn't cause a lock loop (cover appears during the prompt, then disappears)
- [ ] 📱 "Dev: lock now" on the home stub locks immediately

## Phase 3 — home screen

Setup: copy `.env.example` → `.env`; optionally set `EXPO_PUBLIC_COINGECKO_KEY` (free demo key) if prices show "unavailable" (HTTP 429).

- [ ] 📱 **Acceptance:** POL balance on the home screen equals amoy.polygonscan.com for your address (Amoy faucet: https://faucet.polygon.technology)
- [ ] 📱 Sanity: importing `test … junk` shows ≈0.3525 POL on Amoy (value read from the live RPC on 2026-11-08; may change)
- [ ] 📱 USDT row says "Not configured on this network" until `EXPO_PUBLIC_USDT_AMOY` is set (phase 5)
- [ ] 📱 Total = Σ(amount × price); POL price looks right vs coingecko.com
- [ ] 📱 Header: avatar "A1", "Account 1", short address; tap copies the full address (icon turns into a check, "Copied")
- [ ] 📱 Orange "Amoy" pill + yellow TESTNET banner; tapping the pill opens the network sheet
- [ ] 📱 Network sheet: Polygon mainnet is visible but disabled ("available after testnet testing")
- [ ] 📱 Pull-to-refresh spins and updates; balances auto-refresh every ~30 s (send POL from another wallet and wait)
- [ ] 📱 Airplane mode on a fresh launch → "Couldn't load balances" + Retry works after reconnecting
- [ ] 📱 Airplane mode after data loaded → last values stay, info banner "Showing the last known balances"
- [ ] 📱 Skeletons while loading (first launch / after switching networks)
- [ ] 📱 Gear icon opens Settings; "See all" opens Activity

Before enabling mainnet (after phase 5)

- [ ] Verify the Polygon USDT contract on polygonscan — CoinGecko's `tether` entry no longer lists a polygon-pos address (Tether migrated to USDT0); decide which contract/symbol to show

## Phase 4 — receive

(Automated: the QR payload generated by the same `qrcode` library, ECL M, was decoded by an independent decoder (jsQR) back to the exact checksummed address.)

- [ ] 📱 **Acceptance:** scan the QR with MetaMask mobile (Send → scan) → it fills in exactly the address shown in Amethyst
- [ ] 📱 Also scans with the plain iOS/Android camera (shows the 0x… text)
- [ ] 📱 QR is black-on-white in both themes and readable from ~30 cm; the white card has rounded corners
- [ ] 📱 Pill shows "Polygon Amoy" with the orange dot; account name + full address in monospace below
- [ ] 📱 Copy → the button turns into "Copied ✓" for 2 s; pasting elsewhere gives the full address
- [ ] 📱 Share → system share sheet with "My Polygon Amoy address (POL and USDT):" + address
- [ ] 📱 Warning banner at the bottom; on small phones the page scrolls instead of overlapping
- [ ] 📱 Opens as a modal from Home → Receive; swipe down / back closes it

## Phase 5 — sending (Amoy)

(Automated: the full send pipeline — Vault → fee estimate → sign → broadcast → receipt — passed for POL and
USDT on a local chain-80002 EVM with the real MockUSDT, including Max, an on-chain failure and
"insufficient funds". See `src/core/chain/__tests__/send.localevm.integration.test.ts`.)

Setup

- [ ] Deploy MockUSDT on Amoy following `docs/MOCK_USDT.md`; set `EXPO_PUBLIC_USDT_AMOY`; restart Metro with `--clear`
- [ ] Fund the app wallet: some POL from the faucet + mint ~1,000 USDT to it

**Acceptance — transfers go through and are visible in the explorer**

- [ ] 📱 Send 0.01 POL to another address → "Sending…" → "Sent!" → "Pending" → "Confirmed on Polygon Amoy"; "View on explorer" opens amoy.polygonscan.com/tx/… with status Success
- [ ] 📱 Send 5 USDT → same flow; the explorer shows an ERC-20 transfer of 5 USDT
- [ ] 📱 Home balances update after confirmation (without pulling to refresh)
- [ ] 📱 Kill the app right after "Sent!" → relaunch, unlock → the transfer still settles (pending survives restart; visible in Activity in phase 6)

**Acceptance — errors are handled**

- [ ] 📱 Invalid address (`0x123`) → "That's not a valid Polygon address."
- [ ] 📱 Mixed-case address with one letter's case flipped → checksum error
- [ ] 📱 Your own address → blocked with an explanation
- [ ] 📱 Amount above the balance → "Not enough POL/USDT"; Review stays disabled
- [ ] 📱 USDT with 0 POL in the wallet → "Not enough POL to pay the network fee"
- [ ] 📱 Too many decimals (e.g. 0.0000001 USDT) can't be typed (input caps at 6)
- [ ] 📱 Airplane mode on the confirm screen → Confirm → "Couldn't reach the network…" with "Review again"

Form & confirm

- [ ] 📱 Token cards show balances; USDT card disabled when not configured
- [ ] 📱 Paste fills the address; Scan opens the camera (permission prompt text: "Amethyst uses the camera to scan wallet address QR codes.")
- [ ] 📱 Scanning the Receive QR of another Amethyst/MetaMask wallet fills its address; a non-address QR is ignored
- [ ] 📱 Camera permission denied → "Open Settings"
- [ ] 📱 USD equivalent under the amount; fee line "≈ 0.00xx POL ($0.00xx)", refreshes ~every 20 s
- [ ] 📱 Max (POL): the amount is balance minus fee; sending it succeeds and leaves dust ≥ 0
- [ ] 📱 Max (USDT): the whole USDT balance
- [ ] 📱 Comma decimal keyboards: typing "1,5" becomes "1.5"
- [ ] 📱 Confirm screen matches the mockup (token icon, big amount, ≈ USD, From/To/Network/Fee, warning, Cancel/Confirm with the biometry icon)
- [ ] 📱 Confirm → Face ID / fingerprint prompt; cancel ("Use PIN") → PIN sheet; correct PIN sends, wrong PIN counts toward the lockout
- [ ] 📱 Biometrics disabled → Confirm goes straight to the PIN sheet
- [ ] 📱 Can't swipe back from "Sending…"; Done closes the whole send sheet; reopening Send starts empty
- [ ] 📱 Note the fee shown vs. the fee actually paid on polygonscan (shown is an upper bound): ____ / ____
