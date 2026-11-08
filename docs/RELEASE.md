# Releasing an Android build

Public APKs are built by [`.github/workflows/release.yml`](../.github/workflows/release.yml) when a
version tag is pushed, and attached to a GitHub Release. Test APKs from the regular
"Android APK" workflow are deleted right after the E2E run.

## One-time: create your release signing key

Android identifies an app by its package name **and** signing key. Every future update must be
signed with the same key, so create it once and keep it safe (password manager + an offline copy).
It must **never** be committed to the repository.

```bash
keytool -genkeypair -v \
  -keystore amethyst-release.jks \
  -alias amethyst \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -dname "CN=GvinP, O=Amethyst"
# keytool asks for a keystore password (and optionally a separate key password)

base64 -w0 amethyst-release.jks > amethyst-release.jks.b64   # macOS: base64 -i amethyst-release.jks
```

Add these repository **secrets** (Settings → Secrets and variables → Actions → New repository secret):

| Secret                      | Value                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | contents of `amethyst-release.jks.b64`                                 |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password                                                  |
| `ANDROID_KEY_ALIAS`         | `amethyst`                                                             |
| `ANDROID_KEY_PASSWORD`      | the key password (same as the keystore password if you didn't set one) |

Then delete `amethyst-release.jks.b64` from your disk (keep the `.jks` in a safe place).

## Each release

1. Bump `version` in `app.json` (e.g. `0.1.0` → `0.2.0`) and merge to `main`.
2. Tag and push:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. The workflow checks that the tag matches `app.json`, builds the APK **without** developer helpers,
   signs it with your key, verifies the signature and publishes `amethyst-<version>.apk` + its SHA-256
   checksum to GitHub Releases.

## What's public, what isn't

- **Never in the repo:** the keystore, its passwords, `.env`, recovery phrases (even test ones with
  funds — `E2E_FUNDED_PHRASE` lives only in Secrets and is kept out of logs and artifacts).
- **Inside every APK (so effectively public):** `EXPO_PUBLIC_*` values — the Etherscan/CoinGecko API
  keys and RPC URLs. Anything shipped in an app can be extracted; obfuscation only slows that down.
  These are free, rate-limited keys: if one is abused, revoke it and issue a new one. A production
  wallet would put them behind its own proxy (e.g. a small serverless function holding the keys,
  with per-IP rate limits) so the app never contains them.
- **Never anywhere but the user's device:** the user's phrase, seed and PIN (SecureStore).
