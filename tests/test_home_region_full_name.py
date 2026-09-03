from pathlib import Path
import re

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

region_rule = re.search(r'#accountRegion\s*\{([^}]*)\}', css, re.S)
assert region_rule, 'missing dedicated #accountRegion rule'
body = region_rule.group(1)
assert re.search(r'white-space\s*:\s*normal', body), 'region must wrap instead of ellipsis'
assert re.search(r'text-overflow\s*:\s*clip', body), 'region ellipsis must be disabled'
assert re.search(r'overflow\s*:\s*visible', body), 'region text must not be clipped'
assert '.account-region-long' in css, 'long region names need a smaller-text state'
assert "classList.toggle('account-region-long'" in html, 'long-region state must be applied automatically'
assert "$('#accountRegion').textContent=currentProfile.region||'—';" not in html, 'region must use the adaptive renderer'
print('homepage region full-name behavior: PASS')
