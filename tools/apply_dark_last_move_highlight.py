from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / 'play-v10.html']

OLD_STROKE = 'stroke:#ff6b6b!important'
NEW_STROKE = 'stroke:#b3262e!important'
OLD_GLOW = 'rgba(255,107,107,.75)'
NEW_GLOW = 'rgba(179,38,46,.75)'

for path in FILES:
    text = path.read_text(encoding='utf-8')
    if OLD_STROKE not in text:
        raise SystemExit(f'{path.name}: old last-move stroke not found')
    text = text.replace(OLD_STROKE, NEW_STROKE)
    if OLD_GLOW in text:
        text = text.replace(OLD_GLOW, NEW_GLOW)
    path.write_text(text, encoding='utf-8')

print('dark last-move highlight applied')
