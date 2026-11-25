#!/usr/bin/env bash
# SITE SAATHI - export every prototype screen (gallery presets) as PNG, in mr / hi / en.
# Output: design/exports/day05/<slug>_<lang>.png (720 x 1480, 2x).  Usage: bash tools/export-screens.sh [mr hi en]
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
OUT="$ROOT/design/exports/day05"; mkdir -p "$OUT"
TMPP="$(cygpath -m "${TEMP:-/tmp}")/ss_screens_$$"
URL="file:///$(cygpath -m "$ROOT/design/Prototype.html" | sed 's/ /%20/g')"
SLUGS=$(grep -o "\['[a-z0-9-]*', '[a-z]*', {" "$ROOT/design/Prototype.html" | sed "s/\['\([a-z0-9-]*\)'.*/\1/")
LANGS="${*:-mr hi en}"
i=0
for s in $SLUGS; do for l in $LANGS; do
  i=$((i+1))
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$TMPP/$i" --force-device-scale-factor=2 \
    --virtual-time-budget=4000 --window-size=360,740 --screenshot="$(cygpath -m "$OUT/${s}_${l}.png")" "$URL#solo=$s&lang=$l" >/dev/null 2>&1
done; done
rm -rf "$TMPP"
echo "$(ls "$OUT" | wc -l) PNGs in design/exports/day05"
