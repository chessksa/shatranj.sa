from pathlib import Path
import re
html=Path('profile.html').read_text(encoding='utf-8')
assert '.profile-dashboard-grid .profile-stat-label,' in html
assert '.profile-dashboard-grid .profile-action-label{' in html
assert re.search(r'font-size:11px;line-height:1.35;font-weight:800;',html)
assert '.profile-dashboard-grid .profile-stat-value,' in html
assert '.profile-dashboard-grid .profile-action-value{' in html
assert 'overflow-wrap:anywhere' in html
assert 'text-align:center' in html
print('readable unified member tile labels: PASS')
