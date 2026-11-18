#!/usr/bin/env bash
# Subset the self-hosted fonts to WOFF2.
# Method: https://ckeditor.com/blog/optimize-font-size-with-variable-fonts/
#   - subset to the exact characters for English + Polish (not full Unicode blocks);
#   - use a variable font where it is smaller than the static files.
# Source: local Lato 2 (OFL, static only) and Bitter (OFL, variable, from google/fonts ofl/bitter).
# Hinting removed: modern browsers render well without it, and the files get much smaller.
set -euo pipefail

SRC="${FONTS_SRC:-$HOME/_ld_/fonts}"
# Output: the site fonts. Set FONTS_OUT to write somewhere else.
OUT="${FONTS_OUT:-$(cd "$(dirname "$0")/../src/styles/fonts" && pwd)}"
# Printable ASCII + Polish letters + typographic punctuation. U+00A0 = no-break space.
TEXT=" !\"#\$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–—„”“‘’…€•·×→©"
FEATURES="kern,liga,clig,calt,ccmp,locl,mark,mkmk,lnum,onum,pnum,tnum"

subset() { # $1 = source TTF, $2 = output name
  uvx -q --from fonttools --with brotli pyftsubset "$1" \
    --output-file="$OUT/$2.woff2" --flavor=woff2 \
    --text="$TEXT" --unicodes=U+00A0 --layout-features="$FEATURES" \
    --no-hinting --desubroutinize
}

rm -f "$OUT"/*.woff2

# Lato has no variable version: static files, one for each weight.
subset "$SRC/Lato2OFL/Lato-Light.ttf"    lato-300
subset "$SRC/Lato2OFL/Lato-Regular.ttf"  lato-400
subset "$SRC/Lato2OFL/Lato-Italic.ttf"   lato-400-italic
subset "$SRC/Lato2OFL/Lato-Medium.ttf"   lato-500
subset "$SRC/Lato2OFL/Lato-Semibold.ttf" lato-600
subset "$SRC/Lato2OFL/Lato-Bold.ttf"     lato-700

# Bitter: one variable file, weight axis limited to 400..720.
# The site uses 485 and 715: these match Roboto Slab 400 and 700 (ink density in Chromium).
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
uvx -q --from fonttools fonttools varLib.instancer -q \
  "$SRC/Bitter/Bitter-VariableFont_wght.ttf" "wght=400:720" -o "$TMP/bitter.ttf"
subset "$TMP/bitter.ttf" bitter-var

# Outlined years: static weight 485, digits only, overlaps removed (skia-pathops).
# A variable font has overlapping contours, and -webkit-text-stroke shows them.
uvx -q --from fonttools --with skia-pathops fonttools varLib.instancer -q --remove-overlaps \
  "$SRC/Bitter/Bitter-VariableFont_wght.ttf" "wght=485" -o "$TMP/bitter-485.ttf"
uvx -q --from fonttools --with brotli pyftsubset "$TMP/bitter-485.ttf" \
  --output-file="$OUT/bitter-outline.woff2" --flavor=woff2 \
  --text="0123456789" --layout-features="kern,lnum,onum,pnum,tnum" --no-hinting --desubroutinize

# Name the instances. The instancer keeps the name of the default instance ("Bitter Thin"),
# and the PDF and the browser show that name. Bitter has no STAT value for 485, so --update-name-table fails.
rename() { # $1 = woff2 file, $2 = family, $3 = PostScript name
  uvx -q --from fonttools --with brotli python -I -c '
import sys
from fontTools.ttLib import TTFont
path, family, ps = sys.argv[1:4]
font = TTFont(path)
name = font["name"]
for nid in (16, 17, 25):
    name.removeNames(nameID=nid)
for nid, value in ((1, family), (2, "Regular"), (3, ps), (4, family), (6, ps)):
    name.setName(value, nid, 3, 1, 0x409)
    name.setName(value, nid, 1, 0, 0)
font.save(path)' "$1" "$2" "$3"
}
rename "$OUT/bitter-var.woff2" "Bitter" "Bitter-Regular"
rename "$OUT/bitter-outline.woff2" "Bitter Outline" "BitterOutline-Regular"

cp "$SRC/Lato2OFL/OFL.txt" "$OUT/Lato-OFL.txt"
cp "$SRC/Bitter/OFL.txt" "$OUT/Bitter-OFL.txt"
ls -l "$OUT"/*.woff2
