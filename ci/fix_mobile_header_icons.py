from pathlib import Path

# Re-run after refining the regression test.
path = Path('home-theme.css')
css = path.read_text(encoding='utf-8')
marker = '/* Mobile header icon alignment 20260905 */'
block = r'''

/* Mobile header icon alignment 20260905 */
@media(max-width:900px){
  .compact-member-nav .nav-user{
    flex-wrap:nowrap!important;
    align-items:center!important;
  }
  .compact-member-nav .header-tile{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    flex-direction:row!important;
    gap:6px!important;
    white-space:nowrap!important;
    line-height:1!important;
    min-height:44px!important;
    padding:0 10px!important;
    border:1px solid var(--hero-line)!important;
    border-radius:12px!important;
    background:rgba(255,255,255,.035)!important;
    color:var(--hero-cream)!important;
  }
  .compact-member-nav .header-member-link.header-tile{
    flex-direction:row!important;
    align-items:center!important;
    justify-content:flex-start!important;
    gap:7px!important;
  }
  .compact-member-nav .header-member-copy{
    display:flex!important;
    flex-direction:column!important;
    justify-content:center!important;
    min-width:0;
  }
  .compact-member-nav .header-tile-icon{
    width:20px;
    height:20px;
    flex:0 0 20px;
    display:inline-grid!important;
    place-items:center;
    line-height:1!important;
    font-size:16px!important;
  }
  .compact-member-nav .dashboard-link,
  .compact-member-nav .header-tournaments,
  .compact-member-nav .nav-logout,
  .compact-member-nav .nav-account{
    font-size:11px!important;
  }
  .compact-member-nav .dashboard-link{min-width:108px!important}
  .compact-member-nav .header-tournaments{min-width:92px!important}
  .compact-member-nav .site-notification-bell{
    display:inline-grid!important;
    place-items:center!important;
    font-size:16px!important;
    line-height:1!important;
    border-radius:12px!important;
  }
}
'''

if marker not in css:
    css = css.rstrip() + block + '\n'
    path.write_text(css, encoding='utf-8')
