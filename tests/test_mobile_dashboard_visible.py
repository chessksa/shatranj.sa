from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')
header = html.split('<header class="home-header">', 1)[1].split('</header>', 1)[0]

assert 'id="mobileDashboardNav"' in header, 'missing dedicated mobile dashboard element'
assert 'class="mobile-dashboard-link header-tile"' in header
assert 'href="profile.html"' in header

marker = '/* Dedicated mobile dashboard 20260905 */'
assert marker in css
mobile = css.split(marker, 1)[1]

assert 'body.home-signed-in .compact-member-nav .mobile-dashboard-link{' in mobile
assert 'display:inline-flex!important;' in mobile
assert 'grid-column:1!important;' in mobile
assert 'grid-row:2!important;' in mobile
assert 'body.home-signed-in .compact-member-nav .dashboard-link{' in mobile
assert 'display:none!important;' in mobile
assert 'body.home-signed-in .compact-member-nav .header-tournaments{' in mobile
assert 'display:none!important;' in mobile

print('dedicated mobile dashboard: PASS')
