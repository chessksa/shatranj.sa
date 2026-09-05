from pathlib import Path
html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')
notifications = Path('site-notifications.js').read_text(encoding='utf-8')
header = html.split('<header class="home-header">',1)[1].split('</header>',1)[0]
assert '<a id="dashboardNav" class="header-action header-tile dashboard-link"' in header
marker = '/* Mobile header remove dashboard final 20260905 */'
assert marker in css
assert 'body.home-signed-in .compact-member-nav .dashboard-link{display:none!important}' in css.split(marker,1)[1]
assert "if (!window.matchMedia('(max-width:600px)').matches) return;" in notifications
print('dashboard desktop/mobile split: PASS')
