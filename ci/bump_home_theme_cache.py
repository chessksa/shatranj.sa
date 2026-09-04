from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = 'home-theme.css?v=20260904-20'
new = 'home-theme.css?v=2026090421'
if old not in text:
    raise SystemExit('expected old home-theme cache version not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('home theme cache version bumped')
