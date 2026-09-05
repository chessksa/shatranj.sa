from pathlib import Path
css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')
assert '/* Mobile header two-row layout 20260905 */' in css
assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important;' in css
assert 'grid-column:1/-1!important;' in css
assert '.compact-member-nav .header-member-points small{display:none!important}' in css
assert '.compact-member-nav .header-tournaments .header-tile-icon{display:none!important}' in css
assert '.compact-member-nav .header-tournaments>span:not(.header-tile-icon){display:inline!important}' in css
assert 'home-theme.css?v=20260905-13' in html
print('mobile header two rows: PASS')
