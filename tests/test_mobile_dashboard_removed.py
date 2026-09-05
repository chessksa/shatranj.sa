from pathlib import Path
css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')
marker = '/* Mobile header remove dashboard final 20260905 */'
assert marker in css
section = css.split(marker,1)[1]
assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important;' in section
assert 'body.home-signed-in .compact-member-nav .dashboard-link{display:none!important}' in section
assert 'grid-column:1!important;' in section
assert 'grid-column:2!important;' in section
assert 'grid-column:3!important;' in section
assert 'home-theme.css?v=20260905-13' in html
print('mobile dashboard removed: PASS')
