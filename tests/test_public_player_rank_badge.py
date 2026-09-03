from pathlib import Path

html = Path('player.html').read_text(encoding='utf-8')
js = Path('player.js').read_text(encoding='utf-8')

for token in ['id="publicRankBadge"', 'id="publicRankLabel"', 'id="publicRankUse"', 'class="rank-svg-defs"']:
    assert token in html, f'public player page missing {token}'

for label in ['مبتدئ', 'منافس', 'متقدم', 'محترف', 'نخبة', 'بطل']:
    assert label in js, f'public rank mapping missing {label}'

assert 'function rankForRating(rating)' in js, 'public player rank mapping function missing'
assert 'function renderPublicRank(rating)' in js, 'public player rank renderer missing'
assert 'renderPublicRank(profile.rating)' in js, 'public player rank must render from current rating'
assert "$('publicRankLabel').textContent" in js, 'public rank label is not updated'
assert "$('publicRankUse').setAttribute('href'" in js, 'public rank icon is not updated'

print('public player rank badge: PASS')
