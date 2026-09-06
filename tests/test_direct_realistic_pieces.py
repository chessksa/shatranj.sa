from pathlib import Path

# Current approved set: twelve transparent PNG pieces plus the self-contained cm-chessboard sprite.
root = Path('.')
pieces = root / 'assets' / 'pieces'
codes = ('wr','wn','wb','wq','wk','wp','br','bn','bb','bq','bk','bp')

for code in codes:
    p = pieces / f'{code}.png'
    assert p.exists(), f'missing {p}'
    data = p.read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n'), f'{p} is not png'
    assert len(data) > 1000, f'{p} is unexpectedly small'

sprite = pieces / 'shatranj-approved-20260904.svg'
assert sprite.exists(), f'missing {sprite}'
sprite_text = sprite.read_text(encoding='utf-8')
for code in ('wk','wq','wr','wb','wn','wp','bk','bq','br','bb','bn','bp'):
    assert f'id="{code}"' in sprite_text
assert sprite_text.count('data:image/png;base64,') == 12

# Superseded row sprites must stay removed.
for old_name in ('approved-dark-20260904.png', 'approved-light-20260904.png'):
    assert not (pieces / old_name).exists(), f'obsolete piece sprite still exists: {old_name}'

# Live games use the individual approved PNGs; the prematch board uses the approved cm-chessboard sprite.
live_js = (root / 'play-v8.js').read_text(encoding='utf-8')
assert 'assets/pieces/${color}${type}.png?v=20260904-12' in live_js

prematch_js = (root / 'play-v10-match.js').read_text(encoding='utf-8')
assert "pieces:{file:'pieces/shatranj-approved-20260904.svg?v=20260905-3',tileSize:40}" in prematch_js

html = (root / 'play-v10.html').read_text(encoding='utf-8')
assert "s.src='play-v8.js?v=20260905-3'" in html
assert "s.src='play-v10-match.js?v=20260905-3'" in html

print('approved realistic pieces: PASS')
