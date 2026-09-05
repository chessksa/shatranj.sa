from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

assert '.nav-account[hidden]{display:none!important}' in css, 'hidden legacy account/dashboard tile must stay hidden when signed in'

expected = '''.compact-member-nav .header-tile-icon,
.compact-member-nav .site-notification-bell{
  font-size:16px!important;
}'''
assert expected in css, 'dashboard, notification, and tournament header icons must use the same 16px size'

assert '@media(max-width:900px){\n  .compact-member-nav .header-tile{\n    display:inline-flex!important;' in css, 'mobile header tiles must use flex so icons and labels cannot stack'
assert 'flex-direction:row!important;' in css, 'mobile header tile content must stay on one row'
assert 'white-space:nowrap!important;' in css, 'mobile header labels must not wrap'
assert '.compact-member-nav .header-tile-icon{\n    width:20px;\n    height:20px;\n    flex:0 0 20px;\n    display:inline-grid!important;\n    place-items:center;' in css, 'mobile header icons must share one fixed centered box'
assert '.compact-member-nav .header-member-link.header-tile{\n    flex-direction:row!important;\n    align-items:center!important;' in css, 'member avatar and name must stay horizontally aligned on mobile'

assert 'home-theme.css?v=20260905-1' in html, 'home page must request the fresh header stylesheet'

print('home header controls: PASS')
