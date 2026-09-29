from pathlib import Path

css = Path('v2/site/shell.css').read_text(encoding='utf-8')
dashboard = Path('v2/home/dashboard.mjs').read_text(encoding='utf-8')

assert '@media(min-width:901px)' in css, 'desktop-only breakpoint is required'
assert '#desktopGuestAuth' in css, 'desktop guest auth must have an explicit style'
assert 'position:fixed!important' in css, 'desktop guest auth must not depend on the legacy header layout'
assert 'desktopGuestAuth' in dashboard and 'desktopGuestLogin' in dashboard and 'desktopGuestSignup' in dashboard, 'both desktop guest auth actions must be mounted'
assert "<span>تسجيل</span>" in dashboard, 'guest primary action must read تسجيل'
assert "account.textContent='تسجيل الدخول'" in dashboard, 'legacy login action label must remain correct'
print('desktop guest auth visibility: PASS')
