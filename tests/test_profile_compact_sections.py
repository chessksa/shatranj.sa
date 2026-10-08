from pathlib import Path
html=Path('profile.html').read_text(encoding='utf-8')
js=Path('profile.js').read_text(encoding='utf-8')
for label in ['الأصدقاء','طلبات الصداقة','الطلبات المرسلة','التحديات','التحديات المرسلة']:
    assert label in html
assert 'class="profile-links-grid"' in html
assert html.count('class="profile-action"')==5
assert 'id="recentGames"' in html
assert '<nav class="profile-toolbar"' in html, 'member tools should be visible at the top'
assert '<details class="profile-settings">' not in html, 'old account settings accordion must be removed'
assert 'id="playerRankBadge"' not in html
assert 'id="achievementsList"' not in html
assert 'loadRatingHistory' not in js
assert 'async function loadProfileNavigationCounts()' in js
print('non-duplicated member sections: PASS')
