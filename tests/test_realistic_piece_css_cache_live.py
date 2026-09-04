from pathlib import Path

html = Path('play.html').read_text(encoding='utf-8')
css = Path('realistic-pieces.css').read_text(encoding='utf-8')

assert 'realistic-pieces.css?v=20260905-1' in html, 'play page must request a fresh realistic stylesheet after pawn alignment changes'
assert 'transform: translateY(-14%) scale(1.15);' in css, 'pawn alignment rule must be present in the stylesheet'

print('pawn stylesheet cache bust: PASS')
