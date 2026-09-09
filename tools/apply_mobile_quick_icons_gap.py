from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-rankingrow35"
SPACING_MARKER = "/* MOBILE ALL INTERFACE SPACING 4PX 20260909 */"
RANKING_MARKER = "/* MOBILE RANKING TITLE + JOINED HEAD 20260909 */"
ROW_MARKER = "/* MOBILE RANKING ROW HEIGHT 35PX 20260909 */"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")
if SPACING_MARKER not in text:
    raise SystemExit("approved 4px mobile spacing block not found")
if RANKING_MARKER not in text:
    raise SystemExit("ranking title/join fix not found")
row_block = f"""

{ROW_MARKER}
@media(max-width:600px){{
  #ranking th,#ranking td{{height:35px!important}}
}}
"""
if ROW_MARKER not in text:
    text = text.rstrip() + row_block + "\n"
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the row-height change.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-rankingtitle1");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-rankingtitle1"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("mobile ranking rows set to 35px; ranking title/join fix and 4px spacing preserved; caches refreshed")
