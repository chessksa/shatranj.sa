from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

assert '.nav-account[hidden]{display:none!important}' in css, 'hidden legacy account/dashboard tile must stay hidden when signed in'

expected = '''.compact-member-nav .header-tile-icon,
.compact-member-nav .site-notification-bell{
  font-size:16px!important;
}'''
assert expected in css, 'dashboard, notification, and tournament header icons must use the same 16px size'

assert '/* Mobile header icon alignment 20260905 */' in css, 'mobile header alignment rules must exist'
assert '''.compact-member-nav .header-tile{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    flex-direction:row!important;''' in css, 'mobile header tiles must keep icons and labels on one row'
assert 'white-space:nowrap!important;' in css, 'mobile header labels must not wrap'
assert '''.compact-member-nav .header-tile-icon{
    width:20px;
    height:20px;
    flex:0 0 20px;
    display:inline-grid!important;
    place-items:center;''' in css, 'mobile header icons must share one fixed centered box'
assert '''.compact-member-nav .header-member-link.header-tile{
    flex-direction:row!important;
    align-items:center!important;
    justify-content:flex-start!important;''' in css, 'member avatar and name must stay horizontally aligned on mobile'

assert '/* Mobile header layout v2 20260905 */' in css, 'second-stage mobile header layout must exist'
assert '''.compact-member-nav .nav-user{
    width:100%!important;
    overflow:visible!important;
    gap:4px!important;''' in css, 'phone header must fit the viewport instead of horizontal scrolling'
assert '''.compact-member-nav .header-member{
    flex:1 1 0!important;
    min-width:0!important;
  }''' in css, 'member card must absorb the remaining phone width'
assert '''.compact-member-nav .header-member-link.header-tile{
    width:100%!important;
    min-width:0!important;
    max-width:none!important;''' in css, 'member card must not keep the old fixed mobile width'
assert '''.compact-member-nav .dashboard-link,
  .compact-member-nav .header-tournaments{
    width:44px!important;
    min-width:44px!important;
    max-width:44px!important;''' in css, 'dashboard and tournament controls must be equal icon squares on phones'
assert '''.compact-member-nav .dashboard-link>span:not(.header-tile-icon),
  .compact-member-nav .header-tournaments>span:not(.header-tile-icon){display:none!important}''' in css, 'phone header action labels must be hidden so icons cannot collide with member text'

assert 'home-theme.css?v=20260905-2' in html, 'home page must request a fresh stylesheet version so phones cannot reuse stale header CSS'

print('home header controls: PASS')
