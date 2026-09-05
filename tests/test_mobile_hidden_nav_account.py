from pathlib import Path
html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')
assert '#navAccount[hidden]{display:none!important}' in html
header = html.split('<header class="home-header">',1)[1].split('</header>',1)[0]
assert 'id="dashboardNav"' in header
marker = '/* Mobile header remove dashboard final 20260905 */'
assert marker in css
assert 'body.home-signed-in .compact-member-nav .dashboard-link{display:none!important}' in css.split(marker,1)[1]
print('mobile hidden nav account: PASS')
