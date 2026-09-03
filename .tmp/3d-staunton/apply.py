from pathlib import Path
import base64
import io
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / '.tmp' / '3d-staunton'

# Rebuild the compact WebP bundle uploaded in text chunks.
b64 = ''.join(p.read_text(encoding='utf-8').strip() for p in sorted(TMP.glob('chunk*.b64')))
zip_bytes = base64.b64decode(b64)
with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
    pieces = {Path(name).stem: zf.read(name) for name in zf.namelist() if name.endswith('.webp')}

codes = ('wk','wq','wr','wb','wn','wp','bk','bq','br','bb','bn','bp')
missing = [code for code in codes if code not in pieces]
if missing:
    raise RuntimeError(f'Missing 3D pieces: {missing}')

# Package the 12 transparent WebP renders into one cm-chessboard SVG sprite.
lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">',
    '  <title>Shatranj Saudi Arabia 3D Staunton brown and ivory pieces</title>',
]
for code in codes:
    data = base64.b64encode(pieces[code]).decode('ascii')
    lines.append(
        f'  <g id="{code}"><image href="data:image/webp;base64,{data}" '
        'x="0" y="0" width="40" height="40" preserveAspectRatio="xMidYMid meet"/></g>'
    )
lines.append('</svg>')
(ROOT / 'assets/pieces/shatranj-3d-staunton.svg').write_text('\n'.join(lines) + '\n', encoding='utf-8')

# Use the new sprite both before matchmaking and during live games.
for filename in ('play-v8.js', 'play-v10-match.js'):
    p = ROOT / filename
    text = p.read_text(encoding='utf-8')
    text = text.replace('pieces/shatranj-approved.svg', 'pieces/shatranj-3d-staunton.svg')
    p.write_text(text, encoding='utf-8')

# Bust browser caches for the JS modules that select the sprite.
p = ROOT / 'play-v10.html'
text = p.read_text(encoding='utf-8')
text = text.replace('play-v8.js?v=20260903-13', 'play-v8.js?v=20260904-1')
text = text.replace('play-v10-match.js?v=20260903-14', 'play-v10-match.js?v=20260904-1')
p.write_text(text, encoding='utf-8')

p = ROOT / 'play-v8.html'
text = p.read_text(encoding='utf-8').replace('play-v8.js?v=20260903-10', 'play-v8.js?v=20260904-1')
p.write_text(text, encoding='utf-8')

# Regression tests for the approved 3D set.
(ROOT / 'tests/test_approved_piece_sprite.py').write_text('''from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cm_chessboard_uses_3d_staunton_piece_sprite_everywhere():
    live = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    prematch = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    expected = "pieces/shatranj-3d-staunton.svg"
    assert expected in live
    assert expected in prematch
    assert "pieces/shatranj-approved.svg" not in live
    assert "pieces/shatranj-approved.svg" not in prematch


def test_3d_staunton_sprite_maps_all_twelve_embedded_webp_pieces():
    sprite = (ROOT / "assets" / "pieces" / "shatranj-3d-staunton.svg").read_text(encoding="utf-8")
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
    assert sprite.count("data:image/webp;base64,") == 12


def test_board_theme_keeps_approved_cream_and_petrol_colors():
    css = (ROOT / "cm-chessboard-shatranj.css").read_text(encoding="utf-8")
    assert "fill:#d6cfbf" in css.replace(" ", "")
    assert "fill:#0b4850" in css.replace(" ", "")


def test_board_colors_are_forced_inline_on_svg_squares():
    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        assert "function forceBoardSquareColors" in js
        assert "style.setProperty('fill','#d6cfbf','important')" in js.replace(" ", "")
        assert "style.setProperty('fill','#0b4850','important')" in js.replace(" ", "")
        assert "MutationObserver" in js
''', encoding='utf-8')

p = ROOT / 'tests/test_play_v10_cm_preview.py'
text = p.read_text(encoding='utf-8').replace('play-v10-match.js?v=20260903-14', 'play-v10-match.js?v=20260904-1')
p.write_text(text, encoding='utf-8')

# Verify before any commit is made.
subprocess.run(['python', '-m', 'pytest', '-q',
                'tests/test_approved_piece_sprite.py',
                'tests/test_play_v10_cm_preview.py',
                'tests/test_cm_chessboard_integration.py'], cwd=ROOT, check=True)
subprocess.run(['node', '--check', 'play-v8.js'], cwd=ROOT, check=True)
subprocess.run(['node', '--check', 'play-v10-match.js'], cwd=ROOT, check=True)

sprite = (ROOT / 'assets/pieces/shatranj-3d-staunton.svg').read_text(encoding='utf-8')
assert sprite.count('data:image/webp;base64,') == 12
print('3D Staunton integration verified successfully.')
