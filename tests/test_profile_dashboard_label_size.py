from pathlib import Path
import re

html = Path('profile.html').read_text(encoding='utf-8')

base = re.search(r'\.dashboard-icon-label\{[^}]*font-size:([0-9.]+)px', html)
assert base, 'dashboard label font size rule is missing'
assert float(base.group(1)) >= 13, f'dashboard labels are still too small: {base.group(1)}px'

mobile = re.search(r'@media\(max-width:820px\)\{[^}]*\.dashboard-icon-label\{font-size:([0-9.]+)px\}', html)
assert mobile, 'mobile dashboard label font size rule is missing'
assert float(mobile.group(1)) >= 12, f'mobile dashboard labels are still too small: {mobile.group(1)}px'

print('dashboard label size: PASS')
