from pathlib import Path
html=Path('profile.html').read_text(encoding='utf-8')
assert '<section class="dashboard-icon-row"' not in html
assert 'class="profile-stats-grid"' in html
assert 'class="profile-links-grid"' in html
assert html.count('class="profile-action"')==5
assert html.count('class="profile-stat"')==4
assert 'id="statRating"' not in html
assert '<section class="stats"' not in html
assert 'class="profile-nav-grid"' not in html
print('clean separated statistics and account links: PASS')
