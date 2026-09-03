from pathlib import Path
import re

html = Path('profile.html').read_text(encoding='utf-8')
flat = re.sub(r'\s+', ' ', html)

assert '<section class="dashboard-icon-row"' in html, 'profile dashboard must use one unified icon row'
assert html.count('class="dashboard-icon-item') == 10, 'unified dashboard row must contain exactly 10 items'

for element_id in [
    'statRating', 'statGames', 'statWins', 'statDraws', 'statLosses',
    'friendsCount', 'incomingCount', 'outgoingCount',
    'incomingChallengesCount', 'outgoingChallengesCount'
]:
    assert f'id="{element_id}"' in html, f'missing dashboard value {element_id}'

assert 'dashboard-icon-label">النقاط<' in flat, 'rating label must be replaced with points'
assert '<small>التصنيف</small>' not in html, 'old rating label must be removed from the member dashboard'
assert '<section class="stats"' not in html, 'old stats row must be removed'
assert 'class="profile-nav-grid"' not in html, 'old second navigation row must be removed'

assert '.dashboard-icon-row{display:grid;grid-template-columns:repeat(10,minmax(0,1fr))' in html.replace('\n', ''), 'desktop dashboard icons must stay in one 10-column row'
assert '.dashboard-icon-glyph{' in html and 'width:26px' in html and 'height:26px' in html, 'dashboard glyphs must use a consistent icon box'
assert 'id="achievementsSection"' not in html, 'removed achievements panel must not return'

print('profile unified icon row: PASS')
