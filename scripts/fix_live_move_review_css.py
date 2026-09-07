from pathlib import Path

path = Path('play-v10.html')
text = path.read_text(encoding='utf-8')
old = 'white-space:nowrap}"\n\n    .opponent-slot'
new = 'white-space:nowrap}\n\n    .opponent-slot'
if old not in text and new not in text:
    raise SystemExit('move review CSS boundary marker missing')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
