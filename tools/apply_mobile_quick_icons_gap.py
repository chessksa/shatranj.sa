from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-featuregap1"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")

# Undo the earlier change to the play/action buttons. Those are not the four
# interface icon cards the user is referring to.
text = replace_once(
    text,
    ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:1px!important}",
    ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:9px!important}",
    "restore mobile play action gap",
)
text = replace_once(
    text,
    ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important;gap:1px!important}",
    ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important}",
    "restore phone play action gap inheritance",
)

# The four visible interface icon cards are .home-feature-grid. Change only
# the mobile/tablet rule, leaving the desktop feature grid untouched.
mobile_marker = "/* Mobile/tablet: hero first, leaderboard immediately after it. */"
head, sep, tail = text.partition(mobile_marker)
if not sep:
    raise SystemExit("mobile/tablet stylesheet section not found")
old_feature = ".home-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}"
new_feature = ".home-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1px!important}"
if new_feature not in tail:
    if old_feature not in tail:
        raise SystemExit("mobile feature icon grid 10px rule not found")
    tail = tail.replace(old_feature, new_feature, 1)
text = head + sep + tail

# Desktop signed-in play spacing remains unchanged.
if "body.home-signed-in .home-hero .home-board-actions{gap:10px!important}" not in text:
    raise SystemExit("desktop signed-in action grid gap changed unexpectedly")
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the corrected stylesheet.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-mobilegap4");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-mobilegap4"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("actual mobile feature icon grid gap set to 1px on both axes; play action spacing restored; caches refreshed")
