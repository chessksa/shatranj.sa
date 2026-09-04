from pathlib import Path

# The approved 2026-09-04 set is deployed as exactly two transparent row sprites.
for name in ('approved-dark-20260904.png', 'approved-light-20260904.png'):
    p = Path('assets/pieces') / name
    assert p.exists(), f'missing {p}'
    data = p.read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n'), f'{p} is not png'
    assert len(data) > 500, f'{p} is unexpectedly small'

# No previous chess-piece assets may remain.
old = [
    *(Path('assets/pieces') / f'{color}{piece}.png' for color in 'wb' for piece in 'kqbnrp'),
    Path('assets/pieces/shatranj-3d-staunton.svg'),
    Path('assets/pieces/shatranj-3d-staunton-v2.svg'),
    Path('assets/pieces/shatranj-3d-staunton-v3.svg'),
    Path('assets/pieces/shatranj-approved.svg'),
    Path('assets/realistic-pieces.png'),
    *(Path('assets/pieces/v3') / f'{color}{piece}.png' for color in 'wb' for piece in 'kqbnrp'),
]
for p in old:
    assert not p.exists(), f'old piece asset still exists: {p}'

js = Path('play-live.js').read_text(encoding='utf-8')
assert 'piece-image piece-${color}${type}' in js
assert 'assets/pieces/${color}${type}.png' not in js

css = Path('realistic-pieces.css').read_text(encoding='utf-8')
assert 'approved-dark-20260904.png?v=20260904-1' in css
assert 'approved-light-20260904.png?v=20260904-1' in css
assert 'background-size:600% 100%' in css
for pos in ('0%', '20%', '40%', '60%', '80%', '100%'):
    assert f'background-position-x:{pos}' in css

html = Path('play.html').read_text(encoding='utf-8')
assert "PLAY_CACHE_RESET_VERSION = '20260904-1'" in html
assert 'realistic-pieces.css?v=20260904-1' in html
assert 'play-live.js?v=20260904-1' in html

print('approved realistic pieces: PASS')
