from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SOURCE = Path('assets/approved-board-v13.webp')
OUT = Path('assets/exact-board')
PIECES = OUT / 'pieces'
SIZE = 256

# The approved source image is an AI mockup with 8 files but only 7 visible ranks.
# We preserve its exact visual language and extract reusable assets from it so the
# actual game can remain a legal 8x8 interactive board.
X_NORM = [59, 205, 346, 486, 625, 766, 904, 1044, 1195]
Y_NORM = [53, 239, 394, 540, 690, 839, 998, 1192]
BASE = 1254.0


def scaled_bounds(values, extent):
    return [round(v / BASE * extent) for v in values]


def crop_cell(image, xb, yb, row, col):
    return image.crop((xb[col], yb[row], xb[col + 1], yb[row + 1]))


def generic_piece(image, xb, yb, row, col):
    crop = crop_cell(image, xb, yb, row, col).resize((SIZE, SIZE), Image.Resampling.LANCZOS).convert('RGB')
    rgb = np.array(crop)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    mask = np.zeros((SIZE, SIZE), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, (6, 3, SIZE - 12, SIZE - 7), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)

    count, labels, stats, centers = cv2.connectedComponentsWithStats(fg, 8)
    candidates = []
    for idx in range(1, count):
        area = int(stats[idx, cv2.CC_STAT_AREA])
        x, y, w, h = map(int, stats[idx, :4])
        cx, cy = centers[idx]
        touches = x <= 2 or y <= 1 or x + w >= SIZE - 2 or y + h >= SIZE - 1
        if area > 120 and not touches and 15 < cx < SIZE - 15 and 5 < cy < SIZE - 4:
            candidates.append((area, idx))

    keep = np.zeros_like(fg)
    if candidates:
        candidates.sort(reverse=True)
        main_area = candidates[0][0]
        for area, idx in candidates:
            if area >= max(80, main_area * 0.025):
                keep[labels == idx] = 1

    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1)
    alpha = cv2.GaussianBlur((keep * 255).astype(np.uint8), (0, 0), 0.8)
    return Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')


def dark_queen_piece(image, xb, yb):
    crop = crop_cell(image, xb, yb, 0, 3).resize((SIZE, SIZE), Image.Resampling.LANCZOS).convert('RGB')
    rgb = np.array(crop)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    r, g, b = [rgb[:, :, i].astype(float) for i in range(3)]
    teal = (g > r * 1.10) & (b > r * 1.10)
    warm = (r > g * 1.08) & (r > b * 1.12)

    mask = np.full((SIZE, SIZE), cv2.GC_PR_BGD, np.uint8)
    mask[teal] = cv2.GC_BGD
    mask[warm] = cv2.GC_PR_FGD
    mask[warm & (r > 45)] = cv2.GC_FGD
    mask[:6, :] = cv2.GC_BGD
    mask[-6:, :] = cv2.GC_BGD
    mask[:, :6] = cv2.GC_BGD
    mask[:, -6:] = cv2.GC_BGD

    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)

    count, labels, stats, centers = cv2.connectedComponentsWithStats(fg, 8)
    candidates = []
    for idx in range(1, count):
        area = int(stats[idx, cv2.CC_STAT_AREA])
        cx, cy = centers[idx]
        if area > 100 and 10 < cx < SIZE - 10 and 5 < cy < SIZE - 6:
            candidates.append((area, idx))
    keep = np.zeros_like(fg)
    if candidates:
        _, idx = max(candidates)
        keep[labels == idx] = 1
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1)
    alpha = cv2.GaussianBlur((keep * 255).astype(np.uint8), (0, 0), 0.8)
    return Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')


def main():
    if not SOURCE.exists():
        raise SystemExit(f'missing approved reference: {SOURCE}')

    OUT.mkdir(parents=True, exist_ok=True)
    PIECES.mkdir(parents=True, exist_ok=True)

    image = Image.open(SOURCE).convert('RGB')
    width, height = image.size
    xb = scaled_bounds(X_NORM, width)
    yb = scaled_bounds(Y_NORM, height)

    # Exact square surfaces are sampled from empty squares in the approved image.
    crop_cell(image, xb, yb, 2, 0).resize((SIZE, SIZE), Image.Resampling.LANCZOS).save(OUT / 'light.png', optimize=True)
    crop_cell(image, xb, yb, 2, 1).resize((SIZE, SIZE), Image.Resampling.LANCZOS).save(OUT / 'dark.png', optimize=True)

    mapping = {
        'br': (0, 0), 'bn': (0, 1), 'bb': (0, 2), 'bk': (0, 4), 'bp': (1, 0),
        'wr': (6, 0), 'wn': (6, 1), 'wb': (6, 2), 'wq': (6, 3), 'wk': (6, 4), 'wp': (5, 0),
    }
    for code, (row, col) in mapping.items():
        generic_piece(image, xb, yb, row, col).save(PIECES / f'{code}.png', optimize=True)
    dark_queen_piece(image, xb, yb).save(PIECES / 'bq.png', optimize=True)


if __name__ == '__main__':
    main()
