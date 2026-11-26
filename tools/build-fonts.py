# SITE SAATHI - builds the app font: Noto Sans Devanagari (mr, hi) + Figtree (English), merged into one file.
#
# Why: App Inventor gives each label ONE font file. Noto Sans Devanagari has no Latin letters, so every English
# word fell back to the phone's own system font (on some phones a handwriting style). PRD 14.1 asks for
# "Noto Sans Devanagari (Marathi, Hindi) + a bold sans for English, uploaded as Media" - this makes that one file.
#
#   in : brand/fonts/font_deva.ttf, font_deva_bold.ttf   (Noto Sans Devanagari, OFL)
#        brand/fonts/src/Figtree-VF.ttf                  (Figtree variable font, OFL, from github.com/google/fonts)
#   out: brand/fonts/font_ss.ttf (Regular 400) and font_ss_bold.ttf (Bold 700)  -> bundled by tools/build-app.js
#
# Latin letters, digits and punctuation come from Figtree; Devanagari (and the joiners it needs) from Noto.
# Needs Python with fontTools (part of Anaconda). Run:  python -I tools/build-fonts.py
import os
import sys

try:
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    from fontTools import subset
    from fontTools.merge import Merger, Options as MergeOptions
except ImportError as e:  # clear message instead of a stack trace
    sys.exit("fontTools is missing (%s). It comes with Anaconda; or: python -m pip install fonttools" % e)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FONTS = os.path.join(ROOT, "brand", "fonts")
TMP = os.path.join(FONTS, "src", "_tmp")

# Latin + punctuation used by the app. Leaves out U+200B-U+200F (zero-width joiners: Devanagari shaping needs
# Noto's own) and U+25CC (dotted circle, used by Devanagari shaping).
LATIN = (list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x131, 0x152, 0x153, 0x2C6, 0x2DA, 0x2DC]
         + [0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2022, 0x2026, 0x2032, 0x2033,
            0x2039, 0x203A, 0x2044, 0x20AC, 0x20B9, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x00D7])
NEEDED = [0x2013, 0x2014, 0x2022, 0x2026, 0x00B7, 0x2192]   # characters the app text really uses (checked below)


def subset_font(src_font, out_path, unicodes=None):
    """Drop hinting (different hint programs cannot be merged; Android does not need them) and keep only `unicodes`."""
    opts = subset.Options()
    opts.hinting = False
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.glyph_names = True
    opts.drop_tables += ["DSIG", "STAT", "gasp"]
    sub = subset.Subsetter(opts)
    if unicodes is None:
        unicodes = [cp for t in src_font["cmap"].tables if t.isUnicode() for cp in t.cmap]
    sub.populate(unicodes=unicodes)
    sub.subset(src_font)
    src_font.save(out_path)
    return out_path


def set_names(font, style, weight):
    family = "SiteSaathi Sans"
    full = family + ("" if style == "Regular" else " " + style)
    ps = "SiteSaathiSans-" + style
    name = font["name"]
    # keep the copyright (ID 0) and licence (13, 14) records of the first font; replace the family names
    for rec in list(name.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25):
            name.removeNames(nameID=rec.nameID)
    for nid, val in ((1, family), (2, style), (3, "SITE SAATHI;" + ps), (4, full), (6, ps)):
        name.setName(val, nid, 3, 1, 0x409)
        name.setName(val, nid, 1, 0, 0)
    copyright_ = ("Merged for SITE SAATHI from Noto Sans Devanagari (Copyright 2022 The Noto Project Authors) "
                  "and Figtree (Copyright 2022 The Figtree Project Authors). SIL Open Font License 1.1.")
    name.setName(copyright_, 0, 3, 1, 0x409)
    os2 = font["OS/2"]
    os2.usWeightClass = weight
    bold = weight >= 700
    os2.fsSelection = (os2.fsSelection & ~0b1100001) | (0b100000 if bold else 0b1000000)   # bold / regular bit
    font["head"].macStyle = 1 if bold else 0


def build(style, noto_file, wght):
    os.makedirs(TMP, exist_ok=True)
    vf = TTFont(os.path.join(FONTS, "src", "Figtree-VF.ttf"))
    latin = instancer.instantiateVariableFont(vf, {"wght": wght})
    lat_path = subset_font(latin, os.path.join(TMP, "latin_%s.ttf" % style), LATIN)
    deva_path = subset_font(TTFont(os.path.join(FONTS, noto_file)), os.path.join(TMP, "deva_%s.ttf" % style))
    upm = {TTFont(p)["head"].unitsPerEm for p in (lat_path, deva_path)}
    if len(upm) != 1:
        raise RuntimeError("fonts have different unitsPerEm %s - cannot merge" % upm)
    # first font wins for shared code points (space, digits, punctuation -> Figtree)
    merged = Merger(options=MergeOptions(drop_tables=["vmtx", "vhea", "MATH"])).merge([lat_path, deva_path])
    # line metrics: tall enough for Devanagari marks above and below (never clip matras)
    deva, lat = TTFont(deva_path), TTFont(lat_path)
    hh = merged["hhea"]
    hh.ascent = max(deva["hhea"].ascent, lat["hhea"].ascent)
    hh.descent = min(deva["hhea"].descent, lat["hhea"].descent)
    hh.lineGap = 0
    os2 = merged["OS/2"]
    os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = hh.ascent, hh.descent, 0
    os2.usWinAscent = max(deva["OS/2"].usWinAscent, lat["OS/2"].usWinAscent, hh.ascent)
    os2.usWinDescent = max(deva["OS/2"].usWinDescent, lat["OS/2"].usWinDescent, -hh.descent)
    set_names(merged, style, 700 if style == "Bold" else 400)
    out = os.path.join(FONTS, "font_ss%s.ttf" % ("_bold" if style == "Bold" else ""))
    merged.save(out)
    # check: Latin, digits, Devanagari and the special characters are all in the one file
    cmap = TTFont(out).getBestCmap()
    missing = [hex(c) for c in list(range(0x41, 0x5B)) + list(range(0x61, 0x7B)) + list(range(0x30, 0x3A))
               + list(range(0x905, 0x915)) + [0x200C, 0x200D] + NEEDED if c not in cmap]
    if missing:
        raise RuntimeError("%s is missing %s" % (os.path.basename(out), missing))
    print("%-16s %4d glyphs  %6.0f KB  ascent %d descent %d" % (os.path.basename(out), len(TTFont(out).getGlyphOrder()),
                                                                os.path.getsize(out) / 1024, hh.ascent, hh.descent))


try:
    build("Regular", "font_deva.ttf", 400)
    build("Bold", "font_deva_bold.ttf", 700)
finally:
    import shutil
    shutil.rmtree(TMP, ignore_errors=True)
