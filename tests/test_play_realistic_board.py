from pathlib import Path

html = Path('play.html').read_text(encoding='utf-8')
css_path = Path('realistic-board.css')

assert css_path.exists(), 'realistic-board.css must exist'
css = css_path.read_text(encoding='utf-8')

assert 'realistic-board.css?v=20260903-1' in html, 'play page must load the realistic board stylesheet'
assert '--real-board-dark:#0b3f40' in css, 'dark squares must use the approved teal/petrol palette'
assert '--real-board-light:#eadfbe' in css, 'light squares must use the approved warm cream palette'
assert '.board-frame' in css and 'linear-gradient' in css, 'board frame must have a premium layered finish'
assert '.square.light' in css and '.square.dark' in css, 'both square styles must be overridden'
assert '.piece.white' in css and '.piece.black' in css, 'both piece colors must be styled'
assert 'drop-shadow' in css, 'pieces must have realistic depth via soft shadows'
assert 'filter:' in css, 'piece rendering must include depth treatment'

print('realistic play board styling: PASS')
