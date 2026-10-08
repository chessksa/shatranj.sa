from pathlib import Path
html=Path('profile.html').read_text(encoding='utf-8')
assert 'class="profile-dashboard-grid"' in html
assert html.count('class="profile-stat"')==4
assert html.count('class="profile-stat" data-result')==2
assert html.count('class="profile-action"')==5
assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in html
assert 'class="profile-stats-grid"' not in html
assert 'class="profile-links-grid"' not in html
assert 'class="profile-section-head"' not in html
assert 'id="publicProfileLink"' not in html
assert 'id="statRating"' not in html
assert 'class="profile-block profile-recent-block"' in html
print('nine uniform member tiles in one box: PASS')
