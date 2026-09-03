from pathlib import Path
import re

html = Path('index.html').read_text(encoding='utf-8')

assert '<h2 id="rankingTitle">ترتيب اللاعبين على مستوى السعودية</h2>' in html, 'default Saudi-wide ranking title is missing'
assert 'function updateRankingTitle' in html, 'dynamic ranking title function is missing'
assert 'ترتيب اللاعبين في منطقة ${region}' in html, 'region-specific ranking title is missing'
assert 'ترتيب اللاعبين في مدينة ${city}' in html, 'city-specific ranking title is missing'

apply_filter = re.search(r'function applyFilter\(\)\{(.*?)\n\}', html, re.S)
assert apply_filter, 'applyFilter function not found'
assert 'updateRankingTitle(region,city);' in apply_filter.group(1), 'ranking title must update whenever filters change'

update_fn = re.search(r'function updateRankingTitle\(region,city\)\{(.*?)\n\}', html, re.S)
assert update_fn, 'updateRankingTitle function body not found'
body = update_fn.group(1)
assert body.find('if(city)') < body.find('if(region)'), 'city title must take priority over region title'

print('dynamic ranking title: PASS')
