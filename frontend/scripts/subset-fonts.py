#!/usr/bin/env python3
"""
Subset the self-hosted webfonts to the Latin character set the site actually
uses. Re-runnable and idempotent: it always subsets from `_original/`, so
running it twice does not compound losses.

    python3 scripts/subset-fonts.py            # subset in place
    python3 scripts/subset-fonts.py --restore  # put the originals back

Variable-font axes (Inter Tight 300..700, Poppins 500..600) are PRESERVED —
this only drops unused glyphs, never weights. Requires: fonttools, brotli.
"""
import sys, shutil, unicodedata
from pathlib import Path
from fontTools.subset import main as ft_subset
from fontTools.ttLib import TTFont

FONTS_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "fonts"
ORIG_DIR = FONTS_DIR / "_original"

# Latin-1 + Latin Extended-A cover every European language the site may quote,
# plus the typographic punctuation this design leans on (curly quotes, en/em
# dashes, ellipsis, bullets, arrows, the numero and section marks).
UNICODES = (
    "U+0020-007E,"      # basic latin
    "U+00A0-00FF,"      # latin-1 supplement (accents)
    "U+0100-017F,"      # latin extended-A
    "U+2010-2015,"      # hyphens & dashes
    "U+2018,U+2019,U+201C,U+201D,U+201A,U+201E,"   # curly quotes
    "U+2020,U+2021,U+2022,U+2026,U+2030,"           # dagger, bullet, ellipsis
    "U+2039,U+203A,U+2044,U+20B9,U+20AC,U+00A3,"    # guillemets, fraction, ₹ € £
    "U+2122,U+00AE,U+00A9,"                          # ™ ® ©
    "U+2190-2193,U+2196-2199,"                       # arrows
    "U+2212,U+00D7,U+00F7,U+00B1,"                   # math signs
    "U+2116,U+00A7,U+00B0,U+00B7,"                   # № § ° ·
    "U+2713,U+2714,U+2717,U+2726,U+2727,U+2726,"     # checks & the ✦ used in eyebrows
    "U+FEFF,U+FFFD"
)

LAYOUT_FEATURES = "kern,liga,clig,calt,tnum,onum,frac,ccmp,locl,mark,mkmk,rlig,ss01,ss02"


def ensure_originals():
    ORIG_DIR.mkdir(exist_ok=True)
    for f in sorted(FONTS_DIR.glob("*.woff2")):
        backup = ORIG_DIR / f.name
        if not backup.exists():
            shutil.copy2(f, backup)


def restore():
    if not ORIG_DIR.exists():
        print("No _original/ directory — nothing to restore.")
        return
    for f in sorted(ORIG_DIR.glob("*.woff2")):
        shutil.copy2(f, FONTS_DIR / f.name)
        print(f"restored  {f.name}")


def axes_of(path: Path) -> str:
    try:
        font = TTFont(path)
        if "fvar" not in font:
            return "static"
        return ", ".join(
            f"{a.axisTag} {a.minValue:g}..{a.maxValue:g}" for a in font["fvar"].axes
        )
    except Exception:
        return "?"


def main():
    if "--restore" in sys.argv:
        restore()
        return

    ensure_originals()
    total_before = total_after = 0
    print(f"{'font':34} {'before':>9} {'after':>9} {'saved':>7}   axes")
    print("-" * 88)

    for src in sorted(ORIG_DIR.glob("*.woff2")):
        dest = FONTS_DIR / src.name
        before = src.stat().st_size

        argv = [
            str(src),
            f"--unicodes={UNICODES}",
            f"--layout-features={LAYOUT_FEATURES}",
            "--flavor=woff2",
            "--no-hinting",
            "--desubroutinize",
            "--name-IDs=0,1,2,3,4,5,6,25",
            "--drop-tables+=DSIG",
            f"--output-file={dest}",
        ]
        ft_subset(argv)

        after = dest.stat().st_size
        total_before += before
        total_after += after
        pct = (1 - after / before) * 100
        print(f"{src.name:34} {before/1024:8.1f}K {after/1024:8.1f}K {pct:6.1f}%   {axes_of(dest)}")

    print("-" * 88)
    print(f"{'TOTAL':34} {total_before/1024:8.1f}K {total_after/1024:8.1f}K "
          f"{(1-total_after/total_before)*100:6.1f}%")


if __name__ == "__main__":
    main()
