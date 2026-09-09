from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobileallgap3"
MARKER = "/* MOBILE ALL INTERFACE GAPS 3PX 20260909 */"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


# Put one final mobile override at the end of the theme. This is intentional:
# the stylesheet has several historical mobile rules with different gaps, so
# a final authoritative block prevents any older 1/6/8/10px rule winning the
# cascade. Only spacing between interface groups changes; card/icon sizes stay.
path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")
block = f"""

{MARKER}
@media(max-width:900px){{
  .hero-live-stats{{column-gap:3px!important;row-gap:3px!important}}
  .home-feature-grid{{column-gap:3px!important;row-gap:3px!important}}
  .quick-icons{{column-gap:3px!important;row-gap:3px!important}}
  .header-live{{column-gap:3px!important;row-gap:3px!important}}
}}
@media(max-width:700px){{
  .home-hero .home-board-actions{{column-gap:3px!important;row-gap:3px!important}}
}}
@media(max-width:600px){{
  .compact-member-nav .nav-user{{column-gap:3px!important;row-gap:3px!important}}
  body.home-signed-in .compact-member-nav .nav-user{{column-gap:3px!important;row-gap:3px!important}}
}}
"""
if MARKER not in text:
    text = text.rstrip() + block + "\n"
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the unified stylesheet.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-playgap1");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-playgap1"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("all mobile interface group gaps unified to 3px on both axes; sizes unchanged; caches refreshed")
