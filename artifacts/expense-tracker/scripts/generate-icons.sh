#!/usr/bin/env bash
# Generates PWA icons: solid indigo background, white ₹ glyph centered
# OS/launcher applies the corner radius — we fill the full square.
# Usage: bash scripts/generate-icons.sh (run from artifacts/expense-tracker/)

set -e

OUTDIR="public/icons"
mkdir -p "$OUTDIR"

generate_icon() {
  local SIZE=$1
  local FONT_SIZE=$2
  local OUT="${OUTDIR}/icon-${SIZE}.png"

  magick -size "${SIZE}x${SIZE}" xc:'#6366F1' \
    -font DejaVu-Sans-Bold -pointsize "${FONT_SIZE}" -fill white \
    -gravity center -annotate "+0+0" $'\xe2\x82\xb9' \
    "$OUT"

  echo "Generated: $OUT (${SIZE}x${SIZE})"
}

generate_icon 512 260
magick "${OUTDIR}/icon-512.png" -resize 192x192 "${OUTDIR}/icon-192.png"
echo "Generated: ${OUTDIR}/icon-192.png (192x192)"
echo "Done."
