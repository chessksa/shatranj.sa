from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobilegap3"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")

# The visible play/action tiles use .home-board-actions. Set the mobile/tablet
# spacing itself to 2px so both horizontal and vertical gaps are 2px.
text = replace_once(
    text,
    ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:9px!important}",
    ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:2px!important}",
    "mobile visible action grid gap",
)

# Keep the 2-column phone layout explicitly at the same 2px gap.
phone_grid = ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important;gap:2px!important}"
if phone_grid not in text:
    raise SystemExit("phone visible action grid 2px rule not found")

# Restore the desktop signed-in spacing; the request is mobile only.
text = replace_once(
    text,
    "body.home-signed-in .home-hero .home-board-actions{gap:2px!important}",
    "body.home-signed-in .home-hero .home-board-actions{gap:10px!important}",
    "desktop signed-in action grid gap",
)
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the changed base stylesheet.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-mobilegap2");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

# Force the top-level theme stylesheet to refresh as well.
path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-mobilegap2"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("visible mobile home action gaps set to 2px on both axes; desktop unchanged; caches refreshed")
