from pathlib import Path
html=Path('profile.html').read_text(encoding='utf-8')
assert 'class="profile-block"' in html
assert 'class="profile-stats-grid"' in html
assert 'class="profile-links-grid"' in html
assert '.profile-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))' in html
assert '.profile-links-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))' in html
assert '.profile-stat{\n  min-width:0;min-height:76px;' in html
assert '.profile-games .row{' in html
assert 'class="topbar"' not in html
assert 'id="profileHero"' not in html
print('clean compact dashboard layout: PASS')
