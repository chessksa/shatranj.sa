from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

OLD_MARKER = ".cm-board-host .cm-chessboard .marker.marker-frame-last-move{stroke:#ff0000!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,0,0,.75))}"
NEW_MARKER = ".cm-board-host .cm-chessboard .marker.marker-frame-last-move{stroke:#ffb347!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,179,71,.75))}"
OLD_HINT = ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:2px solid #ff0000;box-shadow:none}"
NEW_HINT = ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:2px solid #ffb347;box-shadow:none}"
OLD_SQUARE = '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ff0000;border-radius:50%}'
NEW_SQUARE = '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ffb347;border-radius:50%}'


def ensure_replace(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label}: current style not found')
    return text.replace(old, new)


for filename in ('play-v10.html', 'play.html'):
    path = ROOT / filename
    text = path.read_text(encoding='utf-8')
    text = ensure_replace(text, OLD_SQUARE, NEW_SQUARE, f'{filename} capture square')

    if filename == 'play-v10.html':
        text = ensure_replace(text, OLD_MARKER, NEW_MARKER, 'play-v10.html last-move marker')
        text = ensure_replace(text, OLD_HINT, NEW_HINT, 'play-v10.html capture move hint')

    path.write_text(text, encoding='utf-8')

print('light orange 2px last-move and all capture highlights applied')
