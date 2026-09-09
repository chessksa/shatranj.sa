from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label}: expected source not found')
    return text.replace(old, new, 1)


# Live player/spectator game: compare meaningful board-state keys instead of the
# full FEN. A two-square pawn move can be normalized by the server only in the
# en-passant field, which must not erase the already-known last move.
path = ROOT / 'play-v8.js'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "import { inferLastMoveFromFens, latestMoveFromServerMoves } from './last-move-highlight.mjs?v=20260908-3';",
    "import { fenPositionKey, inferLastMoveFromFens, latestMoveFromServerMoves } from './last-move-highlight.mjs?v=20260909-pawnhighlight1';",
    'play-v8 helper import',
)
text = replace_once(
    text,
    "const fenChanged=Boolean(previousFen && previousFen!==row.fen);",
    "const fenChanged=Boolean(previousFen && fenPositionKey(previousFen)!==fenPositionKey(row.fen));",
    'play-v8 meaningful fen comparison',
)
path.write_text(text, encoding='utf-8')

# Rated computer game has the same reconciliation pattern and the same
# en-passant-only normalization edge case.
path = ROOT / 'play-computer.js'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "import { inferLastMoveFromFens } from './last-move-highlight.mjs?v=20260908-2';",
    "import { fenPositionKey, inferLastMoveFromFens } from './last-move-highlight.mjs?v=20260909-pawnhighlight1';",
    'computer helper import',
)
text = replace_once(
    text,
    "const fenChanged = Boolean(previousFen && previousFen !== fen);",
    "const fenChanged = Boolean(previousFen && fenPositionKey(previousFen) !== fenPositionKey(fen));",
    'computer meaningful fen comparison',
)
path.write_text(text, encoding='utf-8')

# Standard orange (#FFA500), 2px. The capture ring is enlarged to 92% so it
# visibly surrounds/covers the target piece instead of sitting inside it.
path = ROOT / 'play-v10.html'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ff8a24;border-radius:50%}',
    '.square.capture::after{content:"";position:absolute;inset:2px;border:2px solid #ffa500;border-radius:50%}',
    'modern square capture standard orange',
)
text = replace_once(
    text,
    '.move-hint.capture::after{width:68%;height:68%;background:transparent;border:2px solid #ff8a24;box-shadow:none}',
    '.move-hint.capture::after{width:92%;height:92%;background:transparent;border:2px solid #ffa500;box-shadow:none}',
    'modern large capture ring',
)
text = replace_once(
    text,
    '.cm-chessboard .markers .marker.marker-frame-last-move{stroke:#ff8a24!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,138,36,.75))}',
    '.cm-chessboard .markers .marker.marker-frame-last-move{stroke:#ffa500!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,165,0,.75))}',
    'modern last move standard orange',
)
path.write_text(text, encoding='utf-8')

# Legacy page capture indicator follows the same color and enlarged radius.
path = ROOT / 'play.html'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ff8a24;border-radius:50%}',
    '.square.capture::after{content:"";position:absolute;inset:2px;border:2px solid #ffa500;border-radius:50%}',
    'legacy large capture ring',
)
path.write_text(text, encoding='utf-8')

# Keep existing regression suites aligned with the approved standard orange.
path = ROOT / 'tests/test_last_move_highlight.py'
text = path.read_text(encoding='utf-8')
text = text.replace('orange = "#ff8a24"', 'orange = "#ffa500"')
text = text.replace('position:absolute;inset:8px;border:2px solid {orange}', 'position:absolute;inset:2px;border:2px solid {orange}')
path.write_text(text, encoding='utf-8')

print('standard orange 2px highlight and enlarged capture ring applied')
