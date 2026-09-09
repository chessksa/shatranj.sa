from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-playgap1"


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"{label}: expected source not found")
    return text.replace(old, new, 1)


# The visible four play controls on mobile are the three static buttons inside
# #homeBoardActions plus the invite button injected by home-invite.js. The
# effective spacing is controlled by the LAST 60px mobile action-grid rule,
# not by the older generic/mobile rules above it.
path = ROOT / "home-theme-base.css"
text = path.read_text(encoding="utf-8")
start = "/* MOBILE PLAY ACTIONS 60PX 18PX 20260906 */"
end = "/* MOBILE INVITE BUTTON MATCH 20260906 */"
head, sep, rest = text.partition(start)
if not sep:
    raise SystemExit("final mobile play action section not found")
section, sep2, tail = rest.partition(end)
if not sep2:
    raise SystemExit("mobile invite section marker not found")
section = replace_once(
    section,
    "gap:10px!important;",
    "gap:1px!important;",
    "final mobile four-action gap",
)
text = head + sep + section + sep2 + tail
path.write_text(text, encoding="utf-8")

# Force iOS/Safari to fetch the corrected stylesheet.
path = ROOT / "home-theme.css"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '@import url("./home-theme-base.css?v=20260909-featuregap1");',
    f'@import url("./home-theme-base.css?v={VERSION}");',
    "home theme base cache",
)
path.write_text(text, encoding="utf-8")

path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'href="home-theme.css?v=20260909-featuregap1"',
    f'href="home-theme.css?v={VERSION}"',
    "home theme cache",
)
path.write_text(text, encoding="utf-8")

print("final visible mobile four-action grid gap set to 1px on both axes; caches refreshed")
