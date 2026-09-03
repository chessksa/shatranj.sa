from pathlib import Path

html = Path('profile.html').read_text(encoding='utf-8')

assert '/* Compact member dashboard 20260903 */' in html, 'compact dashboard override is missing'
assert '.shell{padding:10px 0 24px}' in html, 'page vertical spacing is still too large'
assert '.topbar{padding:6px 2px 10px}' in html, 'top bar spacing is still too large'
assert '.hero{padding:16px;gap:14px;border-radius:18px}' in html, 'member hero is not compact enough'
assert '.stats{gap:8px;margin:10px 0}' in html, 'stats spacing is still too large'
assert '.stat{padding:10px 12px}' in html, 'stat cards are still too tall'
assert '.grid{gap:10px}' in html, 'dashboard section gap is still too large'
assert '.card{padding:13px}' in html, 'dashboard cards are still too padded'
assert '.card-head{margin-bottom:10px}' in html, 'card heading gap is still too large'
assert '.chart-box{height:180px}' in html, 'rating chart still occupies too much vertical space'
assert '.chart-box svg{height:160px}' in html, 'rating chart SVG is still too tall'
assert '.row{padding:9px}' in html, 'list rows are still too padded'
assert '.achievement{padding:9px}' in html, 'achievement cards are still too padded'

print('profile compact layout: PASS')
