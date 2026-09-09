from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label}: expected source not found')
    return text.replace(old, new, 1)


# Keep the already-deployed double-pawn FEN reconciliation unchanged.
# This pass only adjusts the visual highlight requested by the user.
path = ROOT / 'play-v10.html'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    '.square.capture::after{content:"";position:absolute;inset:2px;border:2px solid #ffa500;border-radius:50%}',
    '.square.capture::after{content:"";position:absolute;inset:5px;border:2px solid #ff7a00;border-radius:50%}',
    'modern balanced capture ring',
)
text = replace_once(
    text,
    '.move-hint.capture::after{width:92%;height:92%;background:transparent;border:2px solid #ffa500;box-shadow:none}',
    '.move-hint.capture::after{width:82%;height:82%;background:transparent;border:2px solid #ff7a00;box-shadow:none}',
    'modern balanced capture hint',
)
text = replace_once(
    text,
    '.cm-chessboard .markers .marker.marker-frame-last-move{stroke:#ffa500!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,165,0,.75))}',
    '.cm-chessboard .markers .marker.marker-frame-last-move{stroke:#ff7a00!important;stroke-width:2px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,122,0,.75))}',
    'modern balanced orange last move',
)
path.write_text(text, encoding='utf-8')

path = ROOT / 'play.html'
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    '.square.capture::after{content:"";position:absolute;inset:2px;border:2px solid #ffa500;border-radius:50%}',
    '.square.capture::after{content:"";position:absolute;inset:5px;border:2px solid #ff7a00;border-radius:50%}',
    'legacy balanced capture ring',
)
path.write_text(text, encoding='utf-8')

# Keep the broader regression suite aligned with the newly approved visual.
path = ROOT / 'tests/test_last_move_highlight.py'
text = path.read_text(encoding='utf-8')
text = text.replace('orange = "#ffa500"', 'orange = "#ff7a00"')
text = text.replace('position:absolute;inset:2px;border:2px solid {orange}', 'position:absolute;inset:5px;border:2px solid {orange}')
path.write_text(text, encoding='utf-8')

# Force a fresh play document from the home page so iOS/Safari cannot reuse
# the previous inline highlight CSS under the old repeated URL.
path = ROOT / 'index.html'
text = path.read_text(encoding='utf-8')
old_ui = 'ui=20260908-red2'
new_ui = 'ui=20260909-orange82'
if new_ui not in text:
    if old_ui not in text:
        raise SystemExit('home play cache key: expected old key not found')
    text = text.replace(old_ui, new_ui)
if old_ui in text:
    raise SystemExit('home play cache key: stale old key still present')
path.write_text(text, encoding='utf-8')

print('balanced orange #ff7a00 highlight, 82% capture ring, and fresh play entry cache applied')
