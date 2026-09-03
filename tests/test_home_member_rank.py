from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')

assert 'id="accountRankBadge"' in html, 'homepage member box must show a rank badge'
assert 'id="accountRankLabel"' in html, 'homepage member box must expose the rank label'
assert 'id="accountRankIcon"' in html, 'homepage member box must expose the rank icon'
assert 'function rankForRating(rating)' in html, 'homepage must calculate the same member rank from rating points'
assert 'function renderAccountRank(rating)' in html, 'homepage must render the member rank'
assert 'renderAccountRank(currentProfile.rating)' in html, 'homepage rank must refresh from the logged-in member rating'

for threshold, label in [('3000', 'بطل'), ('2700', 'نخبة'), ('2400', 'محترف'), ('2100', 'متقدم'), ('1800', 'منافس'), ('beginner', 'مبتدئ')]:
    assert label in html, f'missing homepage rank label {label}'

assert '.account-rank-badge{' in css, 'homepage rank badge styling is missing'
assert '.account-identity-text{' in css, 'homepage identity text wrapper is missing'

print('homepage member rank: PASS')
