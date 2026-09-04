from pathlib import Path
import re

html = Path('index.html').read_text(encoding='utf-8')

assert '<h2 id="rankingTitle">ترتيب اللاعبين على مستوى العالم العربي</h2>' in html, 'default Arab-wide ranking title is missing'
assert 'اختر المنطقة ثم المدينة.' not in html, 'obsolete regional ranking instruction must be removed'
assert 'function updateRankingTitle' in html, 'dynamic ranking title function is missing'
assert 'ترتيب اللاعبين في ${country}' in html, 'country-specific ranking title is missing'
assert 'ترتيب اللاعبين في مدينة ${city}' in html, 'city-specific ranking title is missing'

apply_filter = re.search(r'function applyFilter\(\)\{(.*?)\n\}', html, re.S)
assert apply_filter, 'applyFilter function not found'
assert 'updateRankingTitle(country,city);' in apply_filter.group(1), 'ranking title must update whenever filters change'

update_fn = re.search(r'function updateRankingTitle\(country,city\)\{(.*?)\n\}', html, re.S)
assert update_fn, 'updateRankingTitle function body not found'
body = update_fn.group(1)
assert body.find('if(city)') < body.find('if(country)'), 'city title must take priority over country title'

print('dynamic Arab ranking title: PASS')
