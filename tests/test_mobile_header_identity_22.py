from pathlib import Path
css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')
marker = '/* Mobile member identity centered 22px 20260905 */'
assert marker in css
section = css.split(marker, 1)[1]
assert 'font-size:22px!important;' in section
assert 'flex-direction:row!important;' in section
assert 'justify-content:center!important;' in section
assert '.compact-member-nav .header-member-points small{display:none!important}' in section
assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important;' in section
assert 'grid-column:1!important;' in section
assert 'grid-column:2!important;' in section
assert 'grid-column:3!important;' in section
assert 'home-theme.css?v=20260905-12' in html
print('mobile header identity 22: PASS')
