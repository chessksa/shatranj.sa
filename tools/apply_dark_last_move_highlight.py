from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'play-v10.html'

OLD_MARKER = ".cm-board-host .cm-chessboard .marker.marker-frame-last-move{stroke:#b3262e!important;stroke-width:1px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(179,38,46,.75))}"
NEW_MARKER = ".cm-board-host .cm-chessboard .marker.marker-frame-last-move{stroke:#ff0000!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,0,0,.75))}"
OLD_CAPTURE = ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:4px solid rgba(117,45,36,.58);box-shadow:none}"
NEW_CAPTURE = ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:2px solid #ff0000;box-shadow:none}"

text = path.read_text(encoding='utf-8')

if NEW_MARKER not in text:
    if OLD_MARKER not in text:
        raise SystemExit('play-v10.html: current last-move marker style not found')
    text = text.replace(OLD_MARKER, NEW_MARKER)

if NEW_CAPTURE not in text:
    if OLD_CAPTURE not in text:
        raise SystemExit('play-v10.html: current capture hint style not found')
    text = text.replace(OLD_CAPTURE, NEW_CAPTURE)

path.write_text(text, encoding='utf-8')
print('red 2px last-move and capture highlights applied')
