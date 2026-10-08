from pathlib import Path
import re
html=Path('profile.html').read_text(encoding='utf-8')
for selector in ['profile-stat-label','profile-action-label','profile-section-head']:
    assert f'.{selector}' in html
assert re.search(r'\.profile-stat-label\{font-size:12px',html)
assert re.search(r'\.profile-action-label\{[^}]*font-size:12px',html)
assert 'overflow-wrap:anywhere' in html
print('readable profile dashboard labels: PASS')
