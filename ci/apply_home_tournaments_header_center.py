from pathlib import Path
import re

INDEX = Path('index.html')
CSS = Path('home-theme.css')

html = INDEX.read_text(encoding='utf-8')

old_header_tail = (
    '      <button id="navLogout" class="nav-logout header-action header-tile" type="button" hidden>خروج</button>\n'
    '      <a href="#register" id="navAccount" class="nav-account header-action header-tile">تسجيل الدخول</a>\n'
    '    </div>\n'
    '  </div>\n'
    '</header>'
)
new_header_tail = (
    '      <button id="navLogout" class="nav-logout header-action header-tile" type="button" hidden>خروج</button>\n'
    '      <a href="#register" id="navAccount" class="nav-account header-action header-tile">تسجيل الدخول</a>\n'
    '    </div>\n'
    '    <a id="headerTournaments" class="header-tournaments header-tile" href="#register">\n'
    '      <span class="header-tile-icon" aria-hidden="true">♜</span><span>البطولات</span>\n'
    '    </a>\n'
    '  </div>\n'
    '</header>'
)
if 'id="headerTournaments"' not in html:
    if old_header_tail not in html:
        raise SystemExit('header insertion point not found')
    html = html.replace(old_header_tail, new_header_tail, 1)

html, removed = re.subn(
    r'\n<section id="features" class="home-features"[^>]*>.*?</section>\n',
    '\n',
    html,
    count=1,
    flags=re.S,
)
if removed != 1 and 'id="features"' in html:
    raise SystemExit('features section could not be removed')

html = re.sub(r'home-theme\.css\?v=\d+', 'home-theme.css?v=2026090425', html, count=1)
INDEX.write_text(html, encoding='utf-8')

css = CSS.read_text(encoding='utf-8')
marker = '/* Centered hero + tournaments header 20260904 */'
block = '''

/* Centered hero + tournaments header 20260904 */
.home-header .compact-member-nav{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:14px!important;
  direction:rtl;
}
.compact-member-nav .nav-user{
  width:auto!important;
  flex:0 1 auto;
}
.header-tournaments{
  flex:0 0 auto;
  height:50px!important;
  min-height:50px!important;
  min-width:118px;
  padding:0 14px!important;
  border:1px solid var(--hero-line)!important;
  border-radius:14px!important;
  background:rgba(255,255,255,.035)!important;
  color:var(--hero-cream)!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:7px!important;
  text-decoration:none;
  font-weight:900;
  white-space:nowrap;
}
.header-tournaments:hover{
  color:var(--hero-gold)!important;
  border-color:rgba(216,182,101,.5)!important;
  background:rgba(216,182,101,.07)!important;
}
.home-hero-copy{
  text-align:center!important;
  display:flex;
  flex-direction:column;
  align-items:center;
}
.home-hero-copy>.hero-kicker{
  margin-inline:auto;
}
.home-hero-copy h1{
  margin-inline:auto!important;
}
.home-hero-copy p{
  text-align:center!important;
}
.home-hero-copy .hero-live-stats{
  width:100%;
  margin-inline:auto;
}
.home-hero-copy .hero-stat div{
  align-items:center!important;
  text-align:center;
}
.home-hero-copy .home-board-actions{
  margin-inline:auto!important;
}
@media(min-width:901px){
  body.home-signed-in{
    grid-template-rows:64px minmax(0,1fr) 38px!important;
  }
  body.home-signed-in #ranking{grid-row:2!important}
  body.home-signed-in footer{grid-row:3!important}
}
@media(max-width:900px){
  .home-header .compact-member-nav{gap:7px!important}
  .header-tournaments{
    height:44px!important;
    min-height:44px!important;
    min-width:96px;
    padding:0 10px!important;
    font-size:11px;
  }
}
'''
if marker not in css:
    css = css.rstrip() + block + '\n'
CSS.write_text(css, encoding='utf-8')
