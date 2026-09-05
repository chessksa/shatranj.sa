from pathlib import Path

css_path = Path('home-theme.css')
css = css_path.read_text(encoding='utf-8')
marker = '/* Mobile header layout v2 20260905 */'
block = r'''

/* Mobile header layout v2 20260905 */
@media(max-width:600px){
  .home-header .compact-member-nav{
    width:min(100% - 12px,1180px)!important;
    min-height:56px!important;
    padding-block:6px!important;
    gap:0!important;
  }
  .compact-member-nav .nav-user{
    width:100%!important;
    overflow:visible!important;
    gap:4px!important;
    flex-wrap:nowrap!important;
    justify-content:flex-start!important;
  }
  .compact-member-nav .header-member{
    flex:1 1 0!important;
    min-width:0!important;
  }
  .compact-member-nav .header-member-link.header-tile{
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:44px!important;
    padding:3px 6px!important;
    gap:6px!important;
  }
  .compact-member-nav .header-member-copy{
    flex:1 1 auto!important;
    min-width:0!important;
  }
  .compact-member-nav .header-member-copy strong{
    max-width:100%!important;
    font-size:11px!important;
  }
  .compact-member-nav .dashboard-link,
  .compact-member-nav .header-tournaments{
    width:44px!important;
    min-width:44px!important;
    max-width:44px!important;
    height:44px!important;
    min-height:44px!important;
    padding:0!important;
    gap:0!important;
    flex:0 0 44px!important;
  }
  .compact-member-nav .dashboard-link>span:not(.header-tile-icon),
  .compact-member-nav .header-tournaments>span:not(.header-tile-icon){display:none!important}
  .compact-member-nav .header-tile-icon{
    width:22px!important;
    height:22px!important;
    flex:0 0 22px!important;
    font-size:16px!important;
  }
  .compact-member-nav .header-notification-host{
    width:44px!important;
    min-width:44px!important;
    height:44px!important;
    flex:0 0 44px!important;
  }
  .compact-member-nav .site-notification-bell{
    width:44px!important;
    height:44px!important;
    min-width:44px!important;
    padding:0!important;
  }
  .compact-member-nav .nav-logout{
    width:44px!important;
    min-width:44px!important;
    max-width:44px!important;
    height:44px!important;
    min-height:44px!important;
    padding:0!important;
    flex:0 0 44px!important;
    font-size:10px!important;
  }
}
'''

if marker not in css:
    css = css.rstrip() + block + '\n'
    css_path.write_text(css, encoding='utf-8')

html_path = Path('index.html')
html = html_path.read_text(encoding='utf-8')
old = 'home-theme.css?v=20260905-1'
new = 'home-theme.css?v=20260905-2'
if old in html:
    html_path.write_text(html.replace(old, new, 1), encoding='utf-8')
