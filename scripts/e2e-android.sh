#!/usr/bin/env bash
# Runs the Maestro suite against an installed Amethyst APK on a connected device/emulator.
#   scripts/e2e-android.sh path/to/app.apk
# Optional: E2E_FUNDED_PHRASE="…" also runs the real Amoy transfer flow (tag "funded").
set -euo pipefail

APK="${1:?usage: scripts/e2e-android.sh path/to/app.apk}"
MAESTRO="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
OUT="${E2E_OUTPUT:-e2e-output}"
mkdir -p "$OUT"

adb wait-for-device
adb install -r "$APK"

status=0
"$MAESTRO" test .maestro \
  --format junit --output "$OUT/report.xml" \
  --debug-output "$OUT/debug" || status=$?

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
