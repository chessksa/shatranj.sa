from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobileallspace4"
OLD_MARKER = "/* MOBILE ALL INTERFACE GAPS 3PX 20260909 */"
MARKER = "/* MOBILE ALL INTERFACE SPACING 4PX 20260909 */"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


# The theme contains many historical mobile spacing rules. Replace the prior
# final override with one authoritative 4px system at the very end so older
# 1/3/5/6/8/10px declarations cannot win the cascade. This changes external
# spacing/gaps only; card sizes and internal padding remain otherwise intact.
path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")
block = f"""{MARKER}
@media(max-width:900px){{
  .hero-live-stats{{column-gap:4px!important;row-gap:4px!important}}
  .home-feature-grid{{column-gap:4px!important;row-gap:4px!important}}
  .quick-icons{{column-gap:4px!important;row-gap:4px!important}}
  .header-live{{column-gap:4px!important;row-gap:4px!important}}
  #ranking .ranking-filters{{column-gap:4px!important;row-gap:4px!important}}
  .auth-tabs,.auth-form,.account-card,.account-actions,.filters{{column-gap:4px!important;row-gap:4px!important}}
}}
@media(max-width:700px){{
  .home-hero .home-board-actions{{column-gap:4px!important;row-gap:4px!important}}
}}
@media(max-width:600px){{
  .compact-member-nav .nav-user{{column-gap:4px!important;row-gap:4px!important}}
  body.home-signed-in .compact-member-nav .nav-user{{column-gap:4px!important;row-gap:4px!important}}
  .home-header .compact-member-nav{{padding-block:4px!important}}
  .welcome-ticker{{margin-block:4px 0!important}}
  .home-hero{{padding:4px 0 0!important}}
  .hero-kicker{{margin:0 0 4px!important}}
  .home-hero h1{{margin:0 0 4px!important}}
  .home-hero p{{margin:0 0 4px!important}}
  .hero-live-stats{{margin:0 0 4px!important}}
  #ranking{{padding:4px 7px 0!important}}
  #ranking .head{{margin:0 0 4px!important}}
  .home-features{{padding:4px 0 0!important}}
  #register{{padding:4px 0!important}}
  footer{{margin-top:4px!important}}
}}
"""
if MARKER not in text:
    if OLD_MARKER not in text:
        raise SystemExit("previous final mobile spacing marker not found")
    text = text.split(OLD_MARKER, 1)[0].rstrip() + "\n\n" + block + "\n"
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the new spacing system.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-mobileallgap3");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-mobileallgap3"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("all mobile interface gaps and outer section spacing unified to 4px; caches refreshed")
