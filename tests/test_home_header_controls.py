from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

assert '.nav-account[hidden]{display:none!important}' in css, 'hidden legacy account/dashboard tile must stay hidden when signed in'

expected = '''.compact-member-nav .header-tile-icon,
.compact-member-nav .site-notification-bell{
  font-size:16px!important;
}'''
assert expected in css, 'dashboard, notification, and tournament header icons must use the same 16px size'

assert 'home-theme.css?v=20260905-1' in html, 'home page must request the fresh header stylesheet'

print('home header controls: PASS')
