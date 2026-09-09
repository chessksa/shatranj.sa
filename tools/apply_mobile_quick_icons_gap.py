from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobilegap4"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")

# Visible mobile/tablet action grid: 1px in both horizontal and vertical axes.
text = replace_once(
    text,
    ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:2px!important}",
    ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:1px!important}",
    "mobile visible action grid gap",
)
text = replace_once(
    text,
    ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important;gap:2px!important}",
    ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important;gap:1px!important}",
    "phone visible action grid gap",
)

# Desktop spacing must stay unchanged.
if "body.home-signed-in .home-hero .home-board-actions{gap:10px!important}" not in text:
    raise SystemExit("desktop signed-in action grid gap changed unexpectedly")
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the changed base stylesheet.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-mobilegap3");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

# Force the top-level theme stylesheet to refresh too.
path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-mobilegap3"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("visible mobile home action gaps set to 1px on both axes; desktop unchanged; caches refreshed")
