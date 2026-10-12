from pathlib import Path

html = Path('play.html').read_text(encoding='utf-8')
css = Path('realistic-pieces.css').read_text(encoding='utf-8')

assert 'realistic-pieces.css?v=20261012-pawns90-allboards-v3' in html
assert '.piece.piece-p .piece-image{transform:scale(.90)!important' in css
assert 'assets/pieces/wp.png' in css
assert 'assets/pieces/bp.png' in css
print('legacy live route: 90% pawn scale and canonical assets PASS')
