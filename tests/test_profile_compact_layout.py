from pathlib import Path
html=Path('profile.html').read_text(encoding='utf-8')
assert 'class="profile-block"' in html
assert 'class="profile-dashboard-grid"' in html
assert 'class="profile-stats-grid"' not in html
assert 'class="profile-links-grid"' not in html
assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in html
assert '.profile-dashboard-grid .profile-stat,' in html
assert html.count('class="profile-block"')==1
assert 'class="profile-block profile-recent-block"' in html
assert '.profile-games .row{' in html
assert 'class="topbar"' not in html
assert 'id="profileHero"' not in html
print('clean compact dashboard layout: PASS')
