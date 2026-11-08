#!/usr/bin/env bash
# Runs the Maestro suite against an installed Amethyst APK on a connected device/emulator.
#   scripts/e2e-android.sh path/to/app.apk
# Optional: E2E_FUNDED_PHRASE="…" also runs the real Amoy transfer flow (tag "funded").
set -euo pipefail

APK="${1:?usage: scripts/e2e-android.sh path/to/app.apk}"
APP_ID="com.gvinp.amethyst"
MAESTRO="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
OUT="${E2E_OUTPUT:-e2e-output}"
mkdir -p "$OUT"

adb wait-for-device
# A freshly booted emulator can still be settling (launcher, system dialogs).
until [ "$(adb shell getprop init.svc.bootanim 2>/dev/null | tr -d '\r')" = "stopped" ]; do sleep 2; done
adb shell input keyevent 82 || true # dismiss the lock screen / any system overlay
adb install -r "$APK"

# Warm-up launch: first start of a release RN app (Hermes bytecode, native modules) is the
# slowest; also proves the app starts at all before the suite runs.
adb logcat -c || true
adb shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
for _ in $(seq 1 30); do
  if adb shell pidof "$APP_ID" >/dev/null 2>&1; then break; fi
  sleep 1
done
sleep 10
if ! adb shell pidof "$APP_ID" >/dev/null 2>&1; then
  echo "::warning::$APP_ID is not running after the warm-up launch (crash on start?)"
fi
adb exec-out screencap -p > "$OUT/warmup.png" || true
adb shell am force-stop "$APP_ID" || true

collect_diagnostics() {
  echo "Collecting diagnostics into $OUT/"
  adb exec-out screencap -p > "$OUT/after-failure.png" || true
  adb logcat -d -b crash > "$OUT/logcat-crash.txt" 2>&1 || true
  # Only the app's own process + ReactNative/Hermes tags (no secrets are ever logged by the app).
  adb logcat -d -s ReactNative:V ReactNativeJS:V AndroidRuntime:E ActivityManager:I \
    > "$OUT/logcat-app.txt" 2>&1 || true
  adb shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp" > "$OUT/window-focus.txt" 2>&1 || true
}

status=0
"$MAESTRO" test .maestro \
  --format junit --output "$OUT/report.xml" \
  --debug-output "$OUT/debug" || status=$?

if [ "$status" -ne 0 ]; then collect_diagnostics; fi

if [ -n "${E2E_FUNDED_PHRASE:-}" ]; then
  # Nothing from this run goes under $OUT (uploaded as a public artifact): Maestro's logs,
  # screenshots and even JUnit failure messages can contain the phrase typed by inputText.
  FUNDED_TMP="$(mktemp -d)"
  funded=0
  "$MAESTRO" test .maestro --include-tags funded \
    -e E2E_FUNDED_PHRASE="$E2E_FUNDED_PHRASE" \
    --format junit --output "$FUNDED_TMP/report.xml" \
    --debug-output "$FUNDED_TMP/debug" >/dev/null 2>&1 || funded=$?
  rm -rf "$FUNDED_TMP" "$HOME/.maestro/tests"
  echo "Funded Amoy transfer flow: $([ "$funded" -eq 0 ] && echo PASSED || echo FAILED) (details intentionally not logged)"
  [ "$funded" -eq 0 ] || status=$funded
else
  echo "E2E_FUNDED_PHRASE not set — skipping the real Amoy transfer flow."
fi

exit $status
