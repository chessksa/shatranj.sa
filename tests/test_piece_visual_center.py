from pathlib import Path
from PIL import Image

PIECES = [f'{color}{piece}.png' for color in 'wb' for piece in 'kqbnrp']
TOLERANCE_PX = 2.0

for name in PIECES:
    path = Path('assets/pieces') / name
    assert path.exists(), f'missing piece image: {path}'

    image = Image.open(path).convert('RGBA')
    alpha = image.getchannel('A')
    # Ignore near-transparent antialiasing specks when measuring the visible piece.
    visible = alpha.point(lambda value: 255 if value >= 8 else 0)
    bbox = visible.getbbox()
    assert bbox is not None, f'empty piece image: {path}'

    left, top, right, bottom = bbox
    visual_cx = (left + right) / 2
    visual_cy = (top + bottom) / 2
    canvas_cx = image.width / 2
    canvas_cy = image.height / 2
    dx = visual_cx - canvas_cx
    dy = visual_cy - canvas_cy

    print(f'{name}: bbox={bbox} offset=({dx:.1f},{dy:.1f})')
    assert abs(dx) <= TOLERANCE_PX, f'{name} is horizontally off-center by {dx:.1f}px'
    assert abs(dy) <= TOLERANCE_PX, f'{name} is vertically off-center by {dy:.1f}px'

print('piece visual centering: PASS')
