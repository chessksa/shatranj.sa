from pathlib import Path

css = Path('realistic-pieces.css').read_text(encoding='utf-8')
assert '.piece > svg,.piece::before,.piece::after{display:none !important;}' in css
for piece in ('wr','wn','wb','wq','wk','wp','br','bn','bb','bq','bk','bp'):
    assert f'assets/pieces/{piece}.png' in css, piece
assert 'assets/realistic-pieces.png' not in css
print('legacy overlays disabled; canonical PNG art only: PASS')
