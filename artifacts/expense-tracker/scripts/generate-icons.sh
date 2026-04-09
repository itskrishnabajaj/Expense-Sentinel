#!/usr/bin/env bash
# Generates premium PWA icons using ImageMagick (v7+)
# Design: #0D0D0D background, indigo rounded-rectangle, white ₹ glyph
# Usage: bash scripts/generate-icons.sh (run from artifacts/expense-tracker/)

set -e

OUTDIR="public/icons"
mkdir -p "$OUTDIR"

generate_icon() {
  local SIZE=$1
  local RECT_INSET=$2
  local FONT_SIZE=$3
  local OFFSET=$4
  local CORNER=$5
  local HILIGHT_END=$6
  local OUT="${OUTDIR}/icon-${SIZE}.png"

  magick -size "${SIZE}x${SIZE}" xc:#0D0D0D \
    \( -size "${SIZE}x${SIZE}" xc:none -fill '#5A5CF0' \
       -draw "roundrectangle $((RECT_INSET+2)),$((RECT_INSET+2)) $((SIZE-RECT_INSET-2)),$((SIZE-RECT_INSET-2)) $((CORNER+4)),$((CORNER+4))" \) \
    -composite \
    \( -size "${SIZE}x${SIZE}" xc:none -fill '#6366F1' \
       -draw "roundrectangle ${RECT_INSET},${RECT_INSET} $((SIZE-RECT_INSET)),$((SIZE-RECT_INSET)) ${CORNER},${CORNER}" \) \
    -composite \
    \( -size "${SIZE}x${SIZE}" xc:none -fill '#818CF8' \
       -draw "roundrectangle ${RECT_INSET},${RECT_INSET} ${HILIGHT_END},$((SIZE/2+30)) ${CORNER},${CORNER}" \) \
    -composite \
    -font DejaVu-Sans-Bold -pointsize "${FONT_SIZE}" -fill white \
    -gravity center -annotate "+0+${OFFSET}" $'\xe2\x82\xb9' \
    "$OUT"

  echo "Generated: $OUT (${SIZE}x${SIZE})"
}

generate_icon 512 60 260 10 92 260
magick "${OUTDIR}/icon-512.png" -resize 192x192 "${OUTDIR}/icon-192.png"
echo "Generated: ${OUTDIR}/icon-192.png (192x192)"
echo "Done."
