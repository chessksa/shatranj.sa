from pathlib import Path
import re
html=Path('profile.html').read_text(encoding='utf-8')
grid=re.search(r'<div class="profile-dashboard-grid">([\s\S]*?)</div>\s*</section>',html)
assert grid,'combined nine-tile member grid is missing'
for label,id in [('المباريات','statGames'),('فوز','statWins'),('تعادل','statDraws'),('خسارة','statLosses')]:
    assert re.search(r'>'+re.escape(label)+r'</span><strong class="profile-stat-value" id="'+id+r'">',grid.group(1))
assert grid.group(1).count('class="profile-stat"')==2
assert grid.group(1).count('class="profile-stat" data-result=')==2
assert grid.group(1).count('class="profile-action"')==5
assert 'id="statRating"' not in html
print('unified nine-tile match statistics: PASS')
