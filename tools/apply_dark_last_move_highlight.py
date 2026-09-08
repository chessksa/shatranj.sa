from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# cm-chessboard renders markers as <use class="marker ..."> inside
# <g class="markers"> under .cm-chessboard. The old .cm-board-host ancestor
# does not exist in play-v10.html, so that selector never matched the marker.
BAD_MARKER = ".cm-board-host .cm-chessboard .marker.marker-frame-last-move{stroke:#ffb347!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,179,71,.75))}"
GOOD_MARKER = ".cm-chessboard .markers .marker.marker-frame-last-move{stroke:#ffb347!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,179,71,.75))}"

RED_HINT = ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:2px solid #ff0000;box-shadow:none}"
ORANGE_HINT = ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:2px solid #ffb347;box-shadow:none}"
RED_SQUARE = '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ff0000;border-radius:50%}'
ORANGE_SQUARE = '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ffb347;border-radius:50%}'


def ensure_replace(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label}: current style not found')
    return text.replace(old, new)


for filename in ('play-v10.html', 'play.html'):
    path = ROOT / filename
    text = path.read_text(encoding='utf-8')

    # Keep all capture-target rings on the same 2px light-orange color.
    if ORANGE_SQUARE not in text:
        text = ensure_replace(text, RED_SQUARE, ORANGE_SQUARE, f'{filename} capture square')

    if filename == 'play-v10.html':
        # Fix the selector itself, not just the color value.
        text = ensure_replace(text, BAD_MARKER, GOOD_MARKER, 'play-v10.html last-move marker selector')
        if ORANGE_HINT not in text:
            text = ensure_replace(text, RED_HINT, ORANGE_HINT, 'play-v10.html capture move hint')

    path.write_text(text, encoding='utf-8')

print('effective light-orange 2px last-move and capture highlights applied')
