from pathlib import Path
import re

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')

header = re.search(r'<header>.*?</header>', html, re.S)
assert header, 'homepage header not found'
header_html = header.group(0)

assert 'class="brand"' in header_html, 'brand must remain in the header'
assert 'class="header-live"' in header_html, 'live stats must remain in the header'
assert 'class="links"' in header_html, 'header action links must remain'
assert 'id="navAccount"' in header_html and 'تسجيل الدخول' in header_html, 'visitor header must say تسجيل الدخول'
assert 'id="navLogout"' in header_html and 'تسجيل الخروج' in header_html, 'logout must exist in header'
assert 'لوحة التحكم' in html, 'signed-in header must expose لوحة التحكم state'

panel = re.search(r'<div[^>]+id="accountPanel".*?</div>\s*</div>', html, re.S)
if panel:
    assert 'تسجيل الخروج' not in panel.group(0), 'member box must not contain logout'

assert '.nav{' in css and 'grid-template-columns' in css, 'desktop header must use balanced three-column layout'
assert '@media(max-width:800px)' in css and 'header' in css, 'mobile header treatment must be present'
print('home header account layout: PASS')
