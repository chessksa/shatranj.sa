from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

assert '.nav-account[hidden]{display:none!important}' in css, 'hidden legacy account/dashboard tile must stay hidden when signed in'

expected = '''.compact-member-nav .header-tile-icon,
.compact-member-nav .site-notification-bell{
  font-size:16px!important;
}'''
assert expected in css, 'header icons must use the same 16px size'

assert '/* Mobile header icon alignment 20260905 */' in css, 'mobile header alignment rules must exist'
assert '''.compact-member-nav .header-tile{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    flex-direction:row!important;''' in css, 'mobile header tiles must keep icons and labels on one row'
assert 'white-space:nowrap!important;' in css, 'mobile header action labels must not wrap'
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

assert '/* Mobile header single dashboard entry 20260905 */' in css, 'single-entry mobile header rules must exist'
assert '''.compact-member-nav .dashboard-link{
    display:none!important;
  }''' in css, 'separate dashboard icon must be hidden on phones because member card already links to dashboard'
assert '''.compact-member-nav .header-member-copy strong{
    max-width:none!important;
    white-space:normal!important;
    overflow:visible!important;
    text-overflow:clip!important;''' in css, 'member name must wrap normally instead of showing ellipsis dots on phones'
assert 'overflow-wrap:anywhere!important;' in css, 'long member names must stay visible inside the phone header'

assert 'home-theme.css?v=20260905-3' in html, 'home page must request the new stylesheet version so phones cannot reuse stale header CSS'

print('home header controls: PASS')
