from pathlib import Path
import re

html = Path('profile.html').read_text(encoding='utf-8')

match = re.search(r'<section class="dashboard-icon-row".*?</section>', html, re.S)
assert match, 'dashboard statistic row is missing'
block = match.group(0)

assert 'dashboard-icon-glyph' not in block, 'numeric dashboard cards must not show icons beside numbers'
assert 'dashboard-icon-main' not in block, 'numeric dashboard cards should use direct label-over-value layout'

expected = [
    ('النقاط', 'statRating'),
    ('المباريات', 'statGames'),
    ('فوز', 'statWins'),
    ('تعادل', 'statDraws'),
    ('خسارة', 'statLosses'),
    ('الأصدقاء', 'friendsCount'),
    ('طلبات الصداقة', 'incomingCount'),
    ('الطلبات المرسلة', 'outgoingCount'),
    ('تحديات واردة', 'incomingChallengesCount'),
    ('تحديات مرسلة', 'outgoingChallengesCount'),
]

for label, value_id in expected:
    pattern = rf'<span class="dashboard-icon-label">{re.escape(label)}</span>\s*<strong id="{value_id}">'
    assert re.search(pattern, block), f'{label} must appear above its number ({value_id})'

print('profile stat tiles layout: PASS')
