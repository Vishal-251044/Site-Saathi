#!/usr/bin/env bash
# SITE SAATHI - export images with Chrome headless (free, already on the laptop).
#  1) step illustrations  design/illustrations/*.svg -> media/<name>.jpg (1080 x 720)
#  2) UI icons/buttons    design/app-assets/*.svg   -> media/<name>.png (transparent)
# Usage (Git Bash, from the project folder):  bash tools/export-media.sh
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
TMPP="$(cygpath -m "${TEMP:-/tmp}")/ss_export_$$"
mkdir -p "$ROOT/media"
i=0
shot() { # $1 = source svg, $2 = output file, $3 = WxH, $4 = extra flags
  i=$((i+1))
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars $4 --user-data-dir="$TMPP/$i" \
    --window-size="$3" --screenshot="$(cygpath -m "$2")" "file:///$(cygpath -m "$1")" >/dev/null 2>&1
}
for f in "$ROOT"/design/illustrations/*.svg; do
  [ -e "$f" ] || continue
  shot "$f" "$ROOT/media/$(basename "${f%.svg}").jpg" "1080,720" ""
done
for f in "$ROOT"/design/app-assets/*.svg; do
  [ -e "$f" ] || continue
  size=$(grep -o 'data-size="[0-9]*,[0-9]*"' "$f" | grep -o '[0-9]*,[0-9]*')
  shot "$f" "$ROOT/media/$(basename "${f%.svg}").png" "${size:-144,144}" "--default-background-color=00000000"
done
rm -rf "$TMPP"
ls "$ROOT/media"
