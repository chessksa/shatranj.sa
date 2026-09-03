from pathlib import Path

html = Path('play.html').read_text(encoding='utf-8')
css = Path('realistic-pieces.css').read_text(encoding='utf-8')

assert 'realistic-pieces.css?v=20260903-3' in html, 'play page must cache-bust the repaired realistic stylesheet'
assert 'assets/realistic-pieces.png?v=20260903-2' in css, 'realistic stylesheet must cache-bust the repaired sprite asset'

print('realistic piece CSS cache bust: PASS')
