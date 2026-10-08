from pathlib import Path
import re
html=Path('profile.html').read_text(encoding='utf-8')
stats=re.search(r'<div class="profile-stats-grid">([\s\S]*?)</div>\s*</section>',html)
assert stats
for label,id in [('المباريات','statGames'),('فوز','statWins'),('تعادل','statDraws'),('خسارة','statLosses')]:
    assert re.search(r'>'+re.escape(label)+r'</span><strong class="profile-stat-value" id="'+id+r'">',stats.group(1))
assert 'id="statRating"' not in html
print('four non-duplicated match statistic tiles: PASS')
