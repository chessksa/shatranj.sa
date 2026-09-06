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

# Superseded row sprites and legacy generated sets must not be referenced by the live board.
for old_name in ('approved-dark-20260904.png', 'approved-light-20260904.png'):
    assert not (pieces / old_name).exists(), f'obsolete piece sprite still exists: {old_name}'

cache = '20260904-12'
expected = f'pieces/shatranj-approved-20260904.svg?v={cache}'
for filename in ('play-v8.js', 'play-v10-match.js'):
    js = (root / filename).read_text(encoding='utf-8')
    assert expected in js

html = (root / 'play-v10.html').read_text(encoding='utf-8')
assert f'play-v8.js?v={cache}' in html
assert f'play-v10-match.js?v={cache}' in html

print('approved realistic pieces: PASS')
