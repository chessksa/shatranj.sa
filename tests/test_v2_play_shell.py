from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
html = (root / 'play-v2.html').read_text(encoding='utf-8') if (root / 'play-v2.html').exists() else ''
css = (root / 'v2/play/play.css').read_text(encoding='utf-8') if (root / 'v2/play/play.css').exists() else ''
js = (root / 'v2/play/app.js').read_text(encoding='utf-8') if (root / 'v2/play/app.js').exists() else ''

assert '<html lang="ar" dir="rtl">' in html
for token in ['v2-board','v2-opponent','v2-player','v2-search-status','v2-clock-white','v2-clock-black','v2-grace-end','v2-resign','v2-draw']:
    assert token in html, token
assert 'v2/play/play.css' in html
assert 'type="module"' in html and 'v2/play/app.js' in html
assert 'assets/pieces/' in js
assert '--v2-petrol' in css
assert '--v2-light-square' in css
assert '--v2-dark-square' in css
assert re.search(r'@media\s*\(\s*max-width\s*:\s*760px\s*\)', css)
print('V2 play shell: PASS')
