from pathlib import Path
from PIL import Image
import base64
import io
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PIECES = ROOT / "assets" / "pieces"
CODES = ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp")
CACHE = "20260904-12"

for code in CODES:
    path = PIECES / f"{code}.png"
    if not path.exists() or path.stat().st_size < 1000:
        raise SystemExit(f"missing or invalid piece: {path}")

parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">',
]

for code in CODES:
    image = Image.open(PIECES / f"{code}.png").convert("RGBA")
    image = image.resize((256, 256), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    image.save(buf, format="PNG", optimize=True)
    data = base64.b64encode(buf.getvalue()).decode("ascii")
    parts.append(
        f'<g id="{code}"><image x="0" y="0" width="40" height="40" '
        f'preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,{data}"/></g>'
    )
parts.append("</svg>")

sprite = PIECES / "shatranj-approved-20260904.svg"
sprite.write_text("\n".join(parts), encoding="utf-8")
ET.parse(sprite)
text = sprite.read_text(encoding="utf-8")
assert text.count("data:image/png;base64,") == 12
assert text.count('preserveAspectRatio="xMidYMid meet"') == 12
for code in CODES:
    assert f'id="{code}"' in text

for filename in ("play-v8.js", "play-v10-match.js"):
    path = ROOT / filename
    source = path.read_text(encoding="utf-8")
    source = re.sub(
        r"pieces/shatranj-approved-20260904\.svg\?v=[0-9-]+",
        f"pieces/shatranj-approved-20260904.svg?v={CACHE}",
        source,
    )
    if filename == "play-v8.js":
        source = re.sub(
            r"assets/pieces/\$\{color\}\$\{type\}\.png\?v=[0-9-]+",
            f"assets/pieces/${{color}}${{type}}.png?v={CACHE}",
            source,
        )
    path.write_text(source, encoding="utf-8")

html = ROOT / "play-v10.html"
source = html.read_text(encoding="utf-8")
source = re.sub(r"play-v8\.js\?v=[0-9-]+", f"play-v8.js?v={CACHE}", source)
source = re.sub(r"play-v10-match\.js\?v=[0-9-]+", f"play-v10-match.js?v={CACHE}", source)
html.write_text(source, encoding="utf-8")
