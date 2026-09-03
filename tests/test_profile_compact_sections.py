from pathlib import Path

html = Path('profile.html').read_text(encoding='utf-8')
js = Path('profile.js').read_text(encoding='utf-8')

assert 'تطور التصنيف' not in html, 'rating development section must stay removed'
assert 'id="ratingChart"' not in html, 'rating chart container must stay removed'
assert 'id="ratingDeltaBadge"' not in html, 'rating delta badge must stay removed'

assert 'data-collapse-target=' not in html, 'old collapsible profile rows must stay removed'
assert 'class="section-toggle"' not in html, 'old section toggle controls must stay removed'
assert 'function setupProfileSectionToggles()' not in js, 'old collapse setup must stay removed'

for label in ['الأصدقاء', 'طلبات الصداقة', 'الطلبات المرسلة', 'التحديات', 'التحديات المرسلة']:
    assert label in html, f'profile navigation label missing: {label}'

assert '<section class="dashboard-icon-row"' in html, 'unified member icon row must exist'
assert html.count('class="dashboard-icon-item') == 10, 'member dashboard must contain ten unified icon items'
assert 'background:rgba(13,56,57,.88)' in html, 'profile navigation must retain homepage panel color'

assert 'id="recentGames"' in html and 'id="recentGames" hidden' not in html, 'recent games must stay visible'
assert 'id="achievementsList"' in html and 'id="achievementsList" hidden' not in html, 'achievements must stay visible'

assert 'async function loadProfileNavigationCounts()' in js, 'profile navigation counts loader must exist'
assert 'loadRatingHistory' not in js, 'rating history must not return after chart removal'

print('profile compact icon sections: PASS')
