from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')
header = html.split('<header class="home-header">', 1)[1].split('</header>', 1)[0]

# Keep desktop source controls unchanged; mobile CSS chooses the visible controls.
assert '<a id="dashboardNav" class="header-action header-tile dashboard-link"' in header
assert '<a id="headerTournaments" class="header-tournaments header-tile"' in header

marker = '/* Mobile dashboard right final 20260905 */'
assert marker in css
mobile = css.split(marker, 1)[1]

# Signed-in mobile layout: Dashboard on the right, notifications center, logout left.
assert '@media(max-width:600px)' in mobile
assert 'body.home-signed-in .compact-member-nav .nav-user{' in mobile
assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important;' in mobile
assert 'body.home-signed-in .compact-member-nav .header-tournaments{' in mobile
assert 'display:none!important;' in mobile
assert 'body.home-signed-in .compact-member-nav .dashboard-link{' in mobile
assert 'display:inline-flex!important;' in mobile
assert 'grid-column:1!important;' in mobile
assert 'grid-row:2!important;' in mobile
assert 'body.home-signed-in .compact-member-nav .header-notification-host{' in mobile
assert 'grid-column:2!important;' in mobile
assert 'body.home-signed-in .compact-member-nav .nav-logout{' in mobile
assert 'grid-column:3!important;' in mobile
assert 'body.home-signed-in .compact-member-nav .dashboard-link>span:not(.header-tile-icon)' in mobile
assert 'display:inline!important;' in mobile

# Cache-bust the stylesheet so the mobile change appears immediately.
assert 'home-theme.css?v=20260905-15' in html

print('dashboard desktop/mobile split: PASS')
