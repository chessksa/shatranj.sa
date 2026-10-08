from pathlib import Path
html=Path('profile.html').read_text(encoding='utf-8')
js=Path('profile.js').read_text(encoding='utf-8')
assert 'id="playerRankBadge"' not in html
assert 'id="profileHero"' not in html
assert 'id="playerName"' not in html
assert 'function renderPlayerRank' not in js
assert 'id="achievementsList"' not in html
print('duplicate rank and identity removed from dashboard: PASS')
