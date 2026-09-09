from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-rankingtitle1"
SPACING_MARKER = "/* MOBILE ALL INTERFACE SPACING 4PX 20260909 */"
RANKING_MARKER = "/* MOBILE RANKING TITLE + JOINED HEAD 20260909 */"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


# Keep the approved 4px mobile spacing system intact, then add one final
# ranking-specific override. The earlier title rule uses overflow:hidden with
# a tight line-height, which clips Arabic descenders. The previous global 4px
# spacing also introduced an unwanted 4px gap between the ranking head and the
# table card; this pair must remain visually joined.
path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")
if SPACING_MARKER not in text:
    raise SystemExit("approved 4px mobile spacing block not found")
ranking_block = f"""

{RANKING_MARKER}
@media(max-width:600px){{
  #rankingTitle{{overflow:visible!important;text-overflow:clip!important;line-height:1.45!important;padding-block:2px!important}}
  #ranking .head{{margin:0!important}}
  #ranking .table-card{{margin-top:0!important}}
}}
"""
if RANKING_MARKER not in text:
    text = text.rstrip() + ranking_block + "\n"
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the corrected ranking styles.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-mobileallspace4");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-mobileallspace4"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("mobile ranking title unclipped; ranking head attached to table; approved 4px spacing preserved; caches refreshed")
