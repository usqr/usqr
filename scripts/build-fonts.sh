#!/usr/bin/env bash
# Subset the self-hosted fonts to WOFF2.
# Method: https://ckeditor.com/blog/optimize-font-size-with-variable-fonts/
#   - subset to the exact characters for English + Polish (not full Unicode blocks);
#   - use a variable font where it is smaller than the static files.
# Sources: LatoVar Lite (OFL, variable, my build: https://github.com/usqr/lato-var)
# and Bitter (OFL, variable, from google/fonts ofl/bitter).
# LatoVar keeps its TrueType hints: they are the point of that build (Windows, 9-16 px), +5 KB a file.
# Bitter has no hints: modern browsers render it well without them, and the files get much smaller.
set -euo pipefail

SRC="${FONTS_SRC:-$HOME/_ld_/fonts}"
# Output: the site fonts. Set FONTS_OUT to write somewhere else.
OUT="${FONTS_OUT:-$(cd "$(dirname "$0")/../src/styles/fonts" && pwd)}"
# LatoVar build output (lato-var: `uv run tools/latovar/pipeline.py all`) and its license.
LATOVAR="${LATOVAR_FONTS:-$HOME/_ld_/_use_/261127_lato_var/lato-source/build/LatoVar/fonts}"
LATOVAR_OFL="${LATOVAR_OFL:-$LATOVAR/../../../LICENSE.txt}"
# Printable ASCII + Polish letters + typographic punctuation. U+00A0 = no-break space.
TEXT=" !\"#\$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–—„”“‘’…€•·×→©"
FEATURES="kern,liga,clig,calt,ccmp,locl,mark,mkmk,lnum,onum,pnum,tnum"

subset() { # $1 = source TTF, $2 = output name, $3 = --hinting or --no-hinting (default)
  uvx -q --from fonttools --with brotli pyftsubset "$1" \
    --output-file="$OUT/$2.woff2" --flavor=woff2 \
    --text="$TEXT" --unicodes=U+00A0 --layout-features="$FEATURES" \
    "${3:---no-hinting}" --desubroutinize
}

rm -f "$OUT"/*.woff2

# LatoVar Lite: one variable file for each style, wght 100-900. The Lite version has the same
# outlines as the full version, with 2 masters instead of 3: its files are smaller.
subset "$LATOVAR/LatoVarLite[wght].ttf"        latovar        --hinting
subset "$LATOVAR/LatoVarLite-Italic[wght].ttf" latovar-italic --hinting

# Static LatoVar instances for the PDF CV only (scripts/cv-pdf-render.mjs). Chromium embeds a variable
# font in a PDF as Type 3 glyph drawings. A static font goes in as a real TrueType font.
PDF_OUT="$(cd "$(dirname "$0")" && pwd)/pdf-fonts"
mkdir -p "$PDF_OUT"
rm -f "$PDF_OUT"/*.woff2
PDF_TMP="$(mktemp -d)"
for w in 300 400 700; do
  uvx -q --from fonttools --with skia-pathops fonttools varLib.instancer -q --remove-overlaps --update-name-table \
    "$LATOVAR/LatoVarLite[wght].ttf" "wght=$w" -o "$PDF_TMP/latovar-$w.ttf"
  OUT="$PDF_OUT" subset "$PDF_TMP/latovar-$w.ttf" "latovar-$w" --hinting
done
rm -rf "$PDF_TMP"

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

rm -f "$OUT/Lato-OFL.txt"
cp "$LATOVAR_OFL" "$OUT/LatoVar-OFL.txt"
# Name the LatoVar files "LatoVar" (not "LatoVar Lite"): the site and the PDF show this name.
for f in "$OUT"/latovar*.woff2 "$PDF_OUT"/latovar-*.woff2; do
  uvx -q --from fonttools --with brotli python -I -c '
import sys
from fontTools.ttLib import TTFont
font = TTFont(sys.argv[1])
for r in font["name"].names:
    r.string = r.toUnicode().replace("LatoVar Lite", "LatoVar").replace("LatoVarLite", "LatoVar")
font.save(sys.argv[1])' "$f"
done
cp "$SRC/Bitter/OFL.txt" "$OUT/Bitter-OFL.txt"
ls -l "$OUT"/*.woff2
