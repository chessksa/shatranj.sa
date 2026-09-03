from pathlib import Path

html = Path('profile.html').read_text(encoding='utf-8')
js = Path('profile.js').read_text(encoding='utf-8')

assert 'id="playerRankBadge"' in html, 'rank badge must appear beside player name'
assert 'class="rank-icon"' in html, 'rank badge must use a dedicated SVG icon'
assert '<svg' in html and '<use' in html, 'rank icon must be rendered as SVG, not a Unicode chess glyph'
assert 'currentColor' in html, 'rank SVG must inherit the configured gold color'
assert 'id="achievementsSection"' not in html, 'old achievements panel must be removed'
assert 'id="achievementsList"' not in html, 'old achievements list must be removed'

assert 'function rankForRating' in js, 'rating-to-rank mapping must be explicit'
for threshold in ('1800', '2100', '2400', '2700', '3000'):
    assert threshold in js, f'missing rank threshold {threshold}'
for label in ('مبتدئ', 'منافس', 'متقدم', 'محترف', 'نخبة', 'بطل'):
    assert label in js, f'missing rank label {label}'
for icon in ('rank-pawn', 'rank-knight', 'rank-rook', 'rank-queen', 'rank-crown', 'rank-trophy'):
    assert icon in js or icon in html, f'missing SVG rank icon {icon}'
assert "$('playerRankBadge')" in js, 'profile loader must update the rank badge'
assert 'loadAchievements()' not in js, 'dashboard must not load the removed achievements panel'

print('profile rank badge: PASS')
