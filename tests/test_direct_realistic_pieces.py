from pathlib import Path

names = 'kqbnrp'
for color in 'wb':
    for name in names:
        p = Path(f'assets/pieces/{color}{name}.png')
        assert p.exists(), f'missing {p}'
        data = p.read_bytes()
        assert data.startswith(b'\x89PNG\r\n\x1a\n'), f'{p} is not png'
        assert len(data) > 500, f'{p} is unexpectedly small'

js = Path('play-live.js').read_text(encoding='utf-8')
assert 'class="piece-image"' in js
assert 'assets/pieces/${color}${type}.png?v=20260903-4' in js

css = Path('realistic-pieces.css').read_text(encoding='utf-8')
assert '.piece-image{' in css
assert 'background-image:url("assets/realistic-pieces.png' not in css

html = Path('play.html').read_text(encoding='utf-8')
assert 'realistic-pieces.css?v=20260903-4' in html
assert 'play-live.js?v=20260903-5' in html

print('direct realistic pieces: PASS')
