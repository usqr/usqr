# Makes the data for the two LatoVar figures on /sidequests/lato-var/: src/data/latovar-figures.json.
# 1. Interpolation: the outline of one glyph at three weights, and the on-curve points of the two masters.
# 2. Hinting: FreeType pixels of a sample at 12 px, wght 100, before and after the minimum-distance links.
# The page draws the data as inline SVG, so the figures follow the light and dark themes.
# Run by hand after a LatoVar build: `uv run --no-project --with fonttools --with freetype-py python -I scripts/latovar-figures.py`
import json
import os
import sys
from pathlib import Path

import freetype
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

BUILD = Path(os.environ.get("LATOVAR_BUILD", Path.home() / "_ld_/_use_/261127_lato_var/lato-source/build/LatoVar"))
FINAL = BUILD / "fonts" / "LatoVarLite[wght].ttf"
# The FontLab 9 export before `finalize` adds the minimum-distance links.
FONTLAB = BUILD / "work" / "Upr" / "fl9-vf" / "LatoVar-Upr-Hairline-VF.ttf"
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "latovar-figures.json"

GLYPH = "a"
WEIGHTS = (100, 400, 900)
SAMPLE, PX, WGHT = "Kid bed 3", 12, 100
LEVELS = 8  # opacity steps for the pixel figure


def outline(font, char, weight):
    """SVG path data (y down, baseline at y = 0) and the on-curve points of one glyph at one weight."""
    gs = font.getGlyphSet(location={"wght": weight})
    name = font.getBestCmap()[ord(char)]
    svg = SVGPathPen(gs, ntos=lambda v: str(round(v)))
    gs[name].draw(TransformPen(svg, (1, 0, 0, -1, 0, 0)))
    rec = RecordingPen()
    gs[name].draw(rec)
    points = [(round(args[-1][0]), round(-args[-1][1])) for _op, args in rec.value if args]
    return svg.getCommands(), points, round(gs[name].width)


def interpolation(path):
    font = TTFont(path)
    shapes = {w: outline(font, GLYPH, w) for w in WEIGHTS}
    lo, hi = shapes[WEIGHTS[0]][1], shapes[WEIGHTS[-1]][1]
    if len(lo) != len(hi):
        sys.exit("the masters have a different number of points")
    os2 = font["OS/2"]
    return {
        "glyph": GLYPH,
        "ascender": os2.sTypoAscender,
        "descender": os2.sTypoDescender,
        "xHeight": os2.sxHeight,
        "width": max(s[2] for s in shapes.values()),
        "weights": [{"wght": w, "d": shapes[w][0], "advance": shapes[w][2]} for w in WEIGHTS],
        "moves": [[*a, *b] for a, b in zip(lo, hi)],
    }


def pixels(path):
    """Grayscale coverage of the sample, hinted by FreeType (TrueType bytecode, v40 interpreter)."""
    face = freetype.Face(str(path))
    face.set_pixel_sizes(0, PX)
    face.set_var_design_coords((WGHT,))
    asc = face.size.ascender >> 6
    height = asc - (face.size.descender >> 6)
    grid, pen = {}, 0
    for ch in SAMPLE:
        face.load_char(ch, freetype.FT_LOAD_DEFAULT | freetype.FT_LOAD_RENDER)
        g, bm = face.glyph, face.glyph.bitmap
        for row in range(bm.rows):
            for col in range(bm.width):
                v = bm.buffer[row * bm.pitch + col]
                if v:
                    key = (pen + g.bitmap_left + col, asc - g.bitmap_top + row)
                    grid[key] = max(grid.get(key, 0), v)
        pen += g.advance.x >> 6
    return grid, pen, height


def runs(grid):
    """One SVG path for each opacity level. Pixels of the same level in a row join into one run."""
    levels = {}
    for (x, y), v in sorted(grid.items(), key=lambda kv: (kv[0][1], kv[0][0])):
        cells = levels.setdefault(max(1, round(v / 255 * LEVELS)), [])
        if cells and cells[-1][2] == y and cells[-1][1] == x - 1:
            cells[-1][1] = x
        else:
            cells.append([x, x, y])
    return [
        {"opacity": round(level / LEVELS, 3), "d": "".join(f"M{a} {y}h{b - a + 1}v1h-{b - a + 1}z" for a, b, y in cells)}
        for level, cells in sorted(levels.items())
    ]


def hinting():
    result = {"sample": SAMPLE, "px": PX, "wght": WGHT, "rows": []}
    for label, path in (("FontLab 9 only", FONTLAB), ("With the minimum-distance links", FINAL)):
        grid, width, height = pixels(path)
        result["rows"].append({"label": label, "width": width, "height": height, "ink": sum(grid.values()), "paths": runs(grid)})
    return result


def main():
    for path in (FINAL, FONTLAB):
        if not path.exists():
            sys.exit(f"missing {path}: run the LatoVar pipeline first, or set LATOVAR_BUILD")
    data = {"interpolation": interpolation(FINAL), "hinting": hinting()}
    OUT.write_text(json.dumps(data, separators=(",", ":")) + "\n")
    print(f"{OUT.name}: {OUT.stat().st_size} B")


if __name__ == "__main__":
    main()
