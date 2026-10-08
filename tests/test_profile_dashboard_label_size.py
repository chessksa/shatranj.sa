from pathlib import Path
import re
html=Path('profile.html').read_text(encoding='utf-8')
assert '.profile-dashboard-grid .profile-stat-label,' in html
assert '.profile-dashboard-grid .profile-action-label{' in html
assert re.search(r'font-size:13px;line-height:1.25;font-weight:800;',html)
assert re.search(r'font-size:25px;line-height:1.1;font-weight:900;',html)
assert re.search(r'min-height:70px;padding:4px 3px;',html)
assert '.profile-dashboard-grid .profile-stat-value,' in html
assert '.profile-dashboard-grid .profile-action-value{' in html
assert 'overflow-wrap:anywhere' in html
assert 'text-align:center' in html
print('readable unified member tile labels: PASS')
