from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

# Labels must match the destination/count each tile actually represents.
assert '.hero-stat div small{order:1!important;margin:0 0 7px!important;font-size:14px!important}' in css, 'hero stat labels must be 14px'
assert '<small>المتواجدين</small><strong id="headerMatchesCount">0</strong>' in html, 'headerMatchesCount must be labeled المتواجدين'
assert '<small>المباريات الآن</small><strong id="headerOnlineCount">0</strong>' in html, 'headerOnlineCount must be labeled المباريات الآن'
print('home stat labels: PASS')
