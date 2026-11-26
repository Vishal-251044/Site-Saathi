#!/usr/bin/env bash
# SITE SAATHI - export images with Chrome headless (free, already on the laptop).
#  1) step illustrations  design/illustrations/*.svg -> media/<name>.jpg (1080 x 720)
#  2) UI icons/buttons    design/app-assets/*.svg   -> media/<name>.png (transparent)
# Usage (Git Bash, from the project folder):
#   bash tools/export-media.sh        both
#   bash tools/export-media.sh ui     only the UI pictures (lesson pictures stay byte-identical)
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-all}"
CHROME=""
for c in "/c/Program Files/Google/Chrome/Application/chrome.exe" "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
         "${LOCALAPPDATA:-}/Google/Chrome/Application/chrome.exe" "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"; do
  [ -n "$c" ] && [ -e "$c" ] && { CHROME="$c"; break; }
done
[ -z "$CHROME" ] && { echo "Chrome or Edge not found - install Google Chrome (free)"; exit 1; }
TMPP="$(cygpath -m "${TEMP:-/tmp}")/ss_export_$$"
mkdir -p "$ROOT/media"
shot() { # $1 = source svg, $2 = output file, $3 = WxH, $4 = extra flag, $5 = id
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars $4 --user-data-dir="$TMPP/$5" \
    --window-size="$3" --screenshot="$(cygpath -m "$2")" "file:///$(cygpath -m "$1")" >/dev/null 2>&1
}
i=0
if [ "$MODE" != "ui" ]; then
  for f in "$ROOT"/design/illustrations/*.svg; do
    [ -e "$f" ] || continue
    i=$((i+1)); shot "$f" "$ROOT/media/$(basename "${f%.svg}").jpg" "1080,720" "" "$i"
  done
fi
# UI pictures: 6 at a time
for f in "$ROOT"/design/app-assets/*.svg; do
  [ -e "$f" ] || continue
  i=$((i+1))
  size=$(grep -o 'data-size="[0-9.]*,[0-9.]*"' "$f" | grep -o '[0-9.]*,[0-9.]*' | awk -F, '{printf "%d,%d", $1+0.5, $2+0.5}')
  shot "$f" "$ROOT/media/$(basename "${f%.svg}").png" "${size:-144,144}" "--default-background-color=00000000" "$i" &
  [ $((i % 6)) -eq 0 ] && wait
done
wait
rm -rf "$TMPP"
echo "$(ls "$ROOT/media" | wc -l) files in media/"
