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
  "$MAESTRO" test .maestro --include-tags funded \
    -e E2E_FUNDED_PHRASE="$E2E_FUNDED_PHRASE" \
    --format junit --output "$OUT/report-funded.xml" \
    --debug-output "$OUT/debug-funded" || status=$?
else
  echo "E2E_FUNDED_PHRASE not set — skipping the real Amoy transfer flow."
fi

exit $status
