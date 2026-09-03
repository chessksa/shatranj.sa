from pathlib import Path
import hashlib
import struct

EXPECTED_REFERENCE_SHA256 = '474936e87262b937c3b82559b8335feefd23ccef73f9dcf4e68e12a2bfb12104'


def png_info(path: Path):
    data = path.read_bytes()
    assert data.startswith(b'\x89PNG\r\n\x1a\n'), f'{path} is not a PNG'
    width, height, bit_depth, color_type = struct.unpack('>IIBB', data[16:26])
    return data, width, height, bit_depth, color_type


reference = Path('assets/exact-board/reference.png')
assert reference.exists(), 'exact approved reference image is missing'
assert hashlib.sha256(reference.read_bytes()).hexdigest() == EXPECTED_REFERENCE_SHA256, 'reference image is not the exact approved upload'

for texture in ('light.png', 'dark.png'):
    path = Path('assets/exact-board') / texture
    assert path.exists(), f'missing square texture: {path}'
    data, width, height, bit_depth, color_type = png_info(path)
    assert width == height and width >= 128, f'{path} must be a square texture'
    assert len(data) > 1000, f'{path} is unexpectedly small'

for color in 'wb':
    for piece in 'kqbnrp':
        path = Path(f'assets/exact-board/pieces/{color}{piece}.png')
        assert path.exists(), f'missing extracted piece: {path}'
        data, width, height, bit_depth, color_type = png_info(path)
        assert width == height and width >= 192, f'{path} must be a square sprite'
        assert color_type in (4, 6), f'{path} must preserve transparency'
        assert len(data) > 3000, f'{path} is unexpectedly small'

css = Path('exact-board-v14.css').read_text(encoding='utf-8')
assert 'assets/exact-board/reference.png' in css
assert 'assets/exact-board/light.png' in css
assert 'assets/exact-board/dark.png' in css
assert '.exact-board-preview' not in css

for js_name in ('play-v10-match.js', 'play-v8.js'):
    js = Path(js_name).read_text(encoding='utf-8')
    assert 'assets/exact-board/pieces/${color}${type}.png?v=20260903-14' in js, f'{js_name} does not use exact-board pieces'

html = Path('play-v10.html').read_text(encoding='utf-8')
assert 'exact-board-v14.css?v=20260903-14' in html
assert 'exact-board-v13.js' not in html

print('exact board v14 assets: PASS')
