from pathlib import Path
import re

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')

header = re.search(r'<header>.*?</header>', html, re.S)
assert header, 'homepage header not found'
header_html = header.group(0)

assert 'class="brand"' in header_html, 'brand must remain in the header'
assert 'id="navAccount"' in header_html and 'تسجيل الدخول' in header_html, 'visitor header must say تسجيل الدخول'
assert 'id="navLogout"' in header_html and 'تسجيل الخروج' in header_html, 'logout must exist in header'
assert 'class="play-link protected-play"' not in header_html, 'play action must be removed from the header'
assert 'البطولات' not in header_html, 'tournaments must stay removed from the header'
assert 'class="header-live"' in header_html, 'live stats must remain in the header'

nav_main = re.search(r'<div class="nav-main">(.*?)</div>\s*</div>\s*</header>', header_html, re.S)
assert nav_main, 'all header controls must be grouped on the right beside the brand'
nav_main_html = nav_main.group(1)
assert 'id="navAccount"' in nav_main_html, 'account action must be in the right-side group'
assert 'id="navLogout"' in nav_main_html, 'logout action must be in the right-side group'
assert 'class="header-live"' in nav_main_html, 'live icons must be in the same right-side group'

assert header_html.count('header-action') >= 5, 'account, logout, players, matches and watch must share one sizing class'
assert 'لوحة التحكم' in html, 'signed-in header must expose لوحة التحكم state'

panel = re.search(r'<div[^>]+id="accountPanel".*?</div>\s*</div>', html, re.S)
if panel:
    assert 'تسجيل الخروج' not in panel.group(0), 'member box must not contain logout'

assert '/* Unified right header controls 20260903 */' in css, 'unified right-side header styles are missing'
assert '.header-action{' in css and 'width:92px' in css and 'height:42px' in css, 'header controls must use one consistent size'
assert '@media(max-width:800px)' in css, 'mobile header treatment must be present'
print('home header compact right controls: PASS')
