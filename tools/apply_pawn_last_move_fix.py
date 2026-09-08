from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"expected text not found in {path}: {old}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "last-move-highlight.mjs",
    ".split(/\\s+/).slice(0, 4).join(' ')",
    ".split(/\\s+/).slice(0, 3).join(' ')",
)

replace_once(
    "play-v8.js",
    "./last-move-highlight.mjs?v=20260908-1",
    "./last-move-highlight.mjs?v=20260908-2",
)

replace_once(
    "play-computer.js",
    "./last-move-highlight.mjs?v=20260908-1",
    "./last-move-highlight.mjs?v=20260908-2",
)

replace_once(
    "play-v10.html",
    "stroke-width:2px!important",
    "stroke-width:1px!important",
)
replace_once(
    "play-v10.html",
    "play-computer.js?v=20260908-lastmove2",
    "play-computer.js?v=20260908-lastmove3",
)
replace_once(
    "play-v10.html",
    "play-v8.js?v=20260908-lastmove2",
    "play-v8.js?v=20260908-lastmove3",
)

print("pawn last-move inference and 1px marker applied")
