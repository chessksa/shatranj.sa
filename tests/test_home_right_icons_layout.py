from pathlib import Path
import re

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

# Desktop composition: leaderboard stays on the left, all interface/icon cards stay on the right.
desktop = re.search(r'@media\(min-width:901px\)\{(.*?)\n\}', css, re.S)
assert desktop, 'desktop layout block is missing'
block = desktop.group(1)
assert '.home-hero{grid-column:3;grid-row:2}' in block, 'hero/interface column must stay on the right'
assert '#ranking{grid-column:2;grid-row:2/4}' in css, 'ranking must occupy the left column across hero/features rows'
assert '.home-features{grid-column:3;grid-row:3}' in css, 'feature icons must be placed in the right column'
assert '.home-features{grid-column:2/4;grid-row:3}' not in css, 'feature icons must not span across the ranking column'

# The real dynamic title must remain visible; CSS must not replace it with a fixed pseudo-element label.
assert '#rankingTitle::after' not in css, 'fixed pseudo-element ranking title must be removed'
ranking_title_rule = re.search(r'#rankingTitle\{([^}]*)\}', css, re.S)
assert ranking_title_rule, 'ranking title CSS rule is missing'
assert 'font-size:0' not in ranking_title_rule.group(1), 'dynamic ranking title must not be visually hidden'

# Dynamic labels are already driven by the filters in the page script.
assert 'ترتيب اللاعبين في منطقة ${region}' in html
assert 'ترتيب اللاعبين في مدينة ${city}' in html
assert 'updateRankingTitle(region,city);' in html

print('home right icons layout: PASS')
