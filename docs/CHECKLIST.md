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
