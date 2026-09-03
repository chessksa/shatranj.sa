from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'approved-board-v13.webp'
OUT = ROOT / 'assets' / 'exact-board-v14'
OUT.mkdir(parents=True, exist_ok=True)

im = Image.open(SRC).convert('RGB')
arr = np.array(im)

# Geometry measured from the exact approved reference image already in the repo.
xs = [60, 205, 347, 487, 625, 766, 904, 1044, 1192]
x0, y0 = 60, 54
x1 = 1192
board_w = x1 - x0

# Build a true 8x8 playable board using only textures sampled from the approved image,
# while preserving its original outer frame pixel-for-pixel.
cream = im.crop((xs[2] + 8, 402, xs[3] - 8, 533)).resize((160, 160), Image.Resampling.LANCZOS)
teal = im.crop((xs[3] + 8, 402, xs[4] - 8, 533)).resize((160, 160), Image.Resampling.LANCZOS)
board = im.copy()
cell = board_w / 8
for r in range(8):
    ya, yb = round(y0 + r * cell), round(y0 + (r + 1) * cell)
    for c in range(8):
        xa, xb = round(x0 + c * cell), round(x0 + (c + 1) * cell)
        tile = cream if (r + c) % 2 == 0 else teal
        if (r + c) % 3 == 1:
            tile = ImageOps.mirror(tile)
        if (r * 3 + c) % 4 == 2:
            tile = ImageOps.flip(tile)
        board.paste(tile.resize((xb - xa, yb - ya), Image.Resampling.LANCZOS), (xa, ya))

draw = ImageDraw.Draw(board)
for i in range(9):
    xx = round(x0 + i * cell)
    yy = round(y0 + i * cell)
    draw.line((xx, y0, xx, y0 + board_w), fill=(20, 65, 63), width=1)
    draw.line((x0, yy, x0 + board_w, yy), fill=(20, 65, 63), width=1)
board.save(OUT / 'board-empty.webp', 'WEBP', quality=96, method=6)


def isolate_piece(crop: Image.Image) -> Image.Image:
    rgb = np.array(crop.convert('RGB'))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    rect = (max(2, int(w * .03)), max(2, int(h * .01)), max(2, int(w * .94)), max(2, int(h * .98)))
    cv2.grabCut(bgr, mask, rect, bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    n, labels, stats, cents = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8), 8)
    candidates = [
        i for i in range(1, n)
        if stats[i, cv2.CC_STAT_AREA] > 100 and abs(cents[i][0] - w / 2) < w * .4
    ]
    if candidates:
        best = max(candidates, key=lambda i: stats[i, cv2.CC_STAT_AREA])
        alpha = np.where(labels == best, 255, 0).astype(np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)

    piece = Image.fromarray(np.dstack([rgb, alpha]))
    bbox = piece.getchannel('A').getbbox()
    if bbox:
        piece = piece.crop(bbox)
    pad = max(5, int(max(piece.size) * .05))
    padded = Image.new('RGBA', (piece.width + 2 * pad, piece.height + 2 * pad), (0, 0, 0, 0))
    padded.alpha_composite(piece, (pad, pad))
    fitted = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    scale = min(246 / padded.width, 246 / padded.height)
    resized = padded.resize((round(padded.width * scale), round(padded.height * scale)), Image.Resampling.LANCZOS)
    fitted.alpha_composite(resized, ((256 - resized.width) // 2, (256 - resized.height) // 2))
    return fitted

major_black = (54, 239)
pawn_black = (239, 394)
pawn_white = (840, 999)
major_white = (999, 1190)
spec = {
    'br': (major_black, 0), 'bn': (major_black, 6), 'bb': (major_black, 2),
    'bq': (major_black, 3), 'bk': (major_black, 4), 'bp': (pawn_black, 1),
    'wr': (major_white, 7), 'wn': (major_white, 1), 'wb': (major_white, 5),
    'wq': (major_white, 3), 'wk': (major_white, 4), 'wp': (pawn_white, 0),
}
for name, (yr, col) in spec.items():
    crop = im.crop((xs[col], yr[0], xs[col + 1], yr[1]))
    isolate_piece(crop).save(OUT / f'{name}.png', optimize=True)

css = '''/* Exact interactive board v14 — all visuals are derived from the approved user image. */
.board-frame{
  aspect-ratio:1/1!important;
  padding:4.78%!important;
  border:0!important;
  border-radius:0!important;
  background:url("assets/exact-board-v14/board-empty.webp?v=20260903-14") center/100% 100% no-repeat!important;
  box-shadow:0 16px 34px rgba(0,0,0,.34)!important;
  overflow:visible!important;
}
.board-shell{
  width:100%!important;
  height:100%!important;
  aspect-ratio:auto!important;
  border-radius:0!important;
  overflow:hidden!important;
  background:transparent!important;
  box-shadow:none!important;
}
.board{inset:0!important;}
.square,.square.light,.square.dark{
  background:transparent!important;
  border:0!important;
}
.coords-left,.coords-bottom{display:none!important;}
.piece{width:100%!important;height:100%!important;overflow:visible!important;}
.piece-image{
  width:108%!important;
  height:108%!important;
  object-fit:contain!important;
  filter:none!important;
  transform:translateY(1%)!important;
}
.piece-p .piece-image{width:94%!important;height:94%!important;}
.square.selected{box-shadow:inset 0 0 0 4px rgba(224,181,103,.92)!important;}
.square.target::after{background:rgba(224,181,103,.36)!important;}
@media(max-width:900px){.board-frame{padding:4.78%!important;}}
'''
(ROOT / 'exact-board-v14.css').write_text(css, encoding='utf-8')

js = '''(() => {
  const mapPiece = (img) => {
    if (!(img instanceof HTMLImageElement) || !img.classList.contains('piece-image')) return;
    const match = (img.getAttribute('src') || '').match(/([wb][kqrbnp])\\.png/i);
    if (!match) return;
    const name = match[1].toLowerCase();
    const exact = `assets/exact-board-v14/${name}.png?v=20260903-14`;
    if (img.getAttribute('src') !== exact) img.setAttribute('src', exact);
  };
  const scan = (root=document) => root.querySelectorAll?.('img.piece-image').forEach(mapPiece);
  scan();
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes') mapPiece(m.target);
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('img.piece-image')) mapPiece(node);
        scan(node);
      }
    }
  }).observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['src']});
})();
'''
(ROOT / 'exact-board-v14.js').write_text(js, encoding='utf-8')

html_path = ROOT / 'play-v10.html'
html = html_path.read_text(encoding='utf-8')
html = html.replace('exact-board-v13.css?v=20260903-13', 'exact-board-v14.css?v=20260903-14')
html = html.replace('board-reference-v12.css?v=20260903-12', 'exact-board-v14.css?v=20260903-14')
html = html.replace('exact-board-v13.js?v=20260903-13', 'exact-board-v14.js?v=20260903-14')
html_path.write_text(html, encoding='utf-8')
