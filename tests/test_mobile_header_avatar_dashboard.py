from pathlib import Path
css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')
marker = '/* Mobile header avatar identity + four controls 20260905 */'
assert marker in css
section = css.split(marker, 1)[1]
assert 'grid-template-columns:repeat(4,minmax(0,1fr))!important;' in section
assert 'position:static!important;' in section
assert 'width:44px!important;' in section
assert 'height:44px!important;' in section
assert 'font-size:22px!important;' in section
assert 'line-height:1.3!important;' in section
assert 'overflow:visible!important;' in section
assert 'text-overflow:clip!important;' in section
assert '.compact-member-nav .dashboard-link{' in section
assert 'display:inline-flex!important;' in section
assert '.compact-member-nav .dashboard-link>span:not(.header-tile-icon){display:inline!important}' in section
assert 'grid-column:4!important;' in section
assert 'home-theme.css?v=20260905-12' in html
print('mobile header avatar dashboard: PASS')
