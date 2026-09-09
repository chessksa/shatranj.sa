from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobilegap2"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


# The visible mobile 2x2 action buttons live in home-theme-base.css,
# not in the older inline .quick-icons block in index.html.
path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important}",
    ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important;gap:2px!important}",
    "mobile visible action grid",
)
text = replace_once(
    text,
    "body.home-signed-in .home-hero .home-board-actions{gap:10px!important}",
    "body.home-signed-in .home-hero .home-board-actions{gap:2px!important}",
    "signed-in mobile action grid",
)
path.write_text(text, encoding="utf-8")

# Bust the imported base stylesheet cache.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
old_import = '@import url("./home-theme-base.css?v=20260906-desktopfit1");'
new_import = f'@import url("./home-theme-base.css?v={VERSION}");'
text = replace_once(text, old_import, new_import, "home theme base cache")
path.write_text(text, encoding="utf-8")

# Bust the top-level home theme cache too so iOS/Safari fetches the new import.
path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
old_link = 'href="home-theme.css?v=2026090806"'
new_link = f'href="home-theme.css?v={VERSION}"'
text = replace_once(text, old_link, new_link, "home theme cache")
path.write_text(text, encoding="utf-8")

print("visible mobile home action gaps set to 2px on both axes with fresh stylesheet cache")
