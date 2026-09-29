from pathlib import Path

css = Path('v2/site/shell.css').read_text(encoding='utf-8')
dashboard = Path('v2/home/dashboard.mjs').read_text(encoding='utf-8')

assert '@media(min-width:901px)' in css, 'desktop-only breakpoint is required'
assert 'body.v2-shell-active.v2-route-home:not(.home-signed-in)' in css, 'guest desktop homepage must have an explicit visibility scope'
assert '#dashboardNav' in css and '#navAccount' in css, 'both guest auth actions must be explicitly styled'
assert 'visibility:visible!important' in css, 'guest auth controls must be forced visible on desktop'
assert "<span>تسجيل</span>" in dashboard, 'guest primary action must read تسجيل'
assert "account.textContent='تسجيل الدخول'" in dashboard, 'login action label must remain visible'
print('desktop guest auth visibility: PASS')
