from pathlib import Path
html=Path('profile.html').read_text(encoding='utf-8')
js=Path('profile.js').read_text(encoding='utf-8')
for label in ['الأصدقاء','طلبات الصداقة','الطلبات المرسلة','التحديات','التحديات المرسلة']:
    assert label in html
assert 'class="profile-links-grid"' in html
assert html.count('class="profile-action"')==5
assert 'id="recentGames"' in html
assert '<details class="profile-settings">' in html
assert 'id="playerRankBadge"' not in html
assert 'id="achievementsList"' not in html
assert 'loadRatingHistory' not in js
assert 'async function loadProfileNavigationCounts()' in js
print('non-duplicated member sections: PASS')
