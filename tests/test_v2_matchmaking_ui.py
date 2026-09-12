from pathlib import Path
import re

html = Path('play-v2.html').read_text(encoding='utf-8')
js = Path('v2/play/app.js').read_text(encoding='utf-8')
css = Path('v2/play/play.css').read_text(encoding='utf-8')

for token in [
    "from './api.js'", "from './clock.mjs'", "from './state.mjs'",
    'URLSearchParams', '[5, 10, 15]', "auto === '1'",
    'startMatchmaking', 'pollMatchmaking', 'submitMove', 'subscribeGame',
    'parseFen', 'renderPosition', 'orientation', 'history.replaceState',
    'جاري البحث عن خصم', 'getGameState', 'getCurrentPlayer'
]:
    assert token in js, token

for token in ['v2-quick-times', 'data-minutes="5"', 'data-minutes="10"', 'data-minutes="15"', 'v2-search']:
    assert token in html, token

assert 'config-base.js' in html
assert '<script src="config.js"></script>' not in html
assert re.search(r'min-height\s*:\s*20px', css)
assert '.v2-square.selected' in css
for forbidden in ['play-live.js', 'play-v10-match.js', 'play-v8.js']:
    assert forbidden not in html and forbidden not in js, forbidden
print('V2 matchmaking UI: PASS')
