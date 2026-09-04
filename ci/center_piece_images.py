from pathlib import Path
from PIL import Image

PIECES = [f'{color}{piece}.png' for color in 'wb' for piece in 'kqbnrp']
ALPHA_THRESHOLD = 8


def visual_bbox(image: Image.Image):
    alpha = image.getchannel('A')
    visible = alpha.point(lambda value: 255 if value >= ALPHA_THRESHOLD else 0)
    return visible.getbbox()


def center_piece(path: Path) -> tuple[int, int]:
    image = Image.open(path).convert('RGBA')
    bbox = visual_bbox(image)
    if bbox is None:
        raise RuntimeError(f'empty piece image: {path}')

    left, top, right, bottom = bbox
    visual_cx = (left + right) / 2
    visual_cy = (top + bottom) / 2
    shift_x = round(image.width / 2 - visual_cx)
    shift_y = round(image.height / 2 - visual_cy)

    if shift_x == 0 and shift_y == 0:
        return 0, 0

    canvas = Image.new('RGBA', image.size, (0, 0, 0, 0))
    canvas.alpha_composite(image, (shift_x, shift_y))
    canvas.save(path, optimize=True)
    return shift_x, shift_y


def main():
    root = Path('assets/pieces')
    for name in PIECES:
        path = root / name
        if not path.exists():
            raise FileNotFoundError(path)
        dx, dy = center_piece(path)
        print(f'{name}: shifted ({dx:+d},{dy:+d})')


if __name__ == '__main__':
    main()
