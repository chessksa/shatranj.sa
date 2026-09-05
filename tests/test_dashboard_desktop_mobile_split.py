from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')
header = html.split('<header class="home-header">', 1)[1].split('</header>', 1)[0]

# Keep both desktop controls in the source; mobile CSS decides which one is visible.
assert '<a id="dashboardNav" class="header-action header-tile dashboard-link"' in header
assert '<a id="headerTournaments" class="header-tournaments header-tile"' in header

marker = '/* Mobile dashboard replaces tournaments 20260905 */'
assert marker in css
mobile = css.split(marker, 1)[1]

# On phones, tournaments disappear and Dashboard becomes the right-most control.
assert '@media(max-width:600px)' in mobile
assert '.compact-member-nav .header-tournaments{' in mobile
assert 'display:none!important;' in mobile
assert '.compact-member-nav .dashboard-link{' in mobile
assert 'display:inline-flex!important;' in mobile
assert 'order:0!important;' in mobile
assert 'min-width:108px!important;' in mobile
assert '.compact-member-nav .dashboard-link>span:not(.header-tile-icon)' in mobile
assert 'display:inline!important;' in mobile

# Cache-bust the stylesheet so the mobile change appears immediately.
assert 'home-theme.css?v=20260905-14' in html

print('dashboard desktop/mobile split: PASS')
