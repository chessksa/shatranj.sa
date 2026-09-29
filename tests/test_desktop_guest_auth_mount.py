from pathlib import Path

dashboard = Path('v2/home/dashboard.mjs').read_text(encoding='utf-8')
css = Path('v2/site/shell.css').read_text(encoding='utf-8')

assert 'desktopGuestAuth' in dashboard, 'desktop homepage must mount a dedicated guest auth control'
assert 'desktopGuestLogin' in dashboard and 'desktopGuestSignup' in dashboard, 'desktop guest auth needs login and signup actions'
assert "matchMedia('(min-width:901px)')" in dashboard, 'guest auth mount must be desktop-only'
assert '#desktopGuestAuth' in css, 'desktop guest auth needs an explicit desktop style'
assert 'position:fixed!important' in css, 'guest auth must not depend on the legacy header layout'
print('desktop guest auth mount: PASS')
