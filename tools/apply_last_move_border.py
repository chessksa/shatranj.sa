from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "play-v10.html"
text = path.read_text(encoding="utf-8")
old = ".last-move-highlight{position:absolute;width:12.5%;height:12.5%;background:rgba(240,196,93,.18);box-shadow:inset 0 0 0 1px rgba(240,196,93,.22);pointer-events:none;z-index:0}"
new = ".last-move-highlight{position:absolute;width:12.5%;height:12.5%;background:rgba(255,180,90,.10);box-shadow:inset 0 0 0 3px rgba(255,180,90,.95),inset 0 0 10px rgba(255,180,90,.18);pointer-events:none;z-index:0}"
if new in text:
    raise SystemExit(0)
if old not in text:
    raise SystemExit("current last-move highlight style not found")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("light-orange last-move border applied")
