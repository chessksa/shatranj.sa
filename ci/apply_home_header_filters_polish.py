from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html_path = ROOT / "index.html"
css_path = ROOT / "home-theme.css"
invite_path = ROOT / "home-invite.js"

html = html_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
invite = invite_path.read_text(encoding="utf-8")

new_header = '''<header class="home-header">
  <div class="wrap nav compact-member-nav">
    <div class="nav-user">
      <div id="headerMember" class="header-member" hidden>
        <a class="header-member-link header-tile" href="profile.html" aria-label="لوحة التحكم">
          <span class="header-member-avatar-wrap" aria-hidden="true">
            <img id="headerMemberAvatar" class="header-member-avatar" alt="" hidden>
            <span id="headerMemberFallback" class="header-member-avatar header-member-fallback">♟</span>
          </span>
          <span class="header-member-copy">
            <strong id="headerMemberName">العضو</strong>
            <small>النقاط <b id="headerMemberRating">1500</b></small>
          </span>
        </a>
      </div>

      <a id="dashboardNav" class="header-action header-tile dashboard-link" href="#register">
        <span class="header-tile-icon" aria-hidden="true">⚙</span><span>لوحة التحكم</span>
      </a>

      <div id="siteNotificationHost" class="header-notification-host"></div>

      <button id="navLogout" class="nav-logout header-action header-tile" type="button" hidden>خروج</button>
      <a href="#register" id="navAccount" class="nav-account header-action header-tile">تسجيل الدخول</a>
    </div>
  </div>
</header>'''

html, count = re.subn(r'<header class="home-header">.*?</header>', new_header, html, count=1, flags=re.S)
if count != 1:
    raise SystemExit("expected one home header")

html = html.replace(
    '<a class="btn gold protected-play hero-play-btn" href="play-v10.html"><span aria-hidden="true">⚡</span> العب الآن</a>',
    '<a class="btn gold protected-play hero-play-btn" href="play-v10.html"><span class="hero-action-icon" aria-hidden="true">♟</span><span>العب الآن</span></a>',
    1,
)

ranking_start = html.index('<section id="ranking">')
ranking_end = html.index('</section>', ranking_start)
ranking = html[ranking_start:ranking_end]
if '<div class="filters ranking-filters">' not in ranking:
    ranking = ranking.replace('<div class="filters">', '<div class="filters ranking-filters">', 1)
    html = html[:ranking_start] + ranking + html[ranking_end:]

html = html.replace('home-theme.css?v=2026090422', 'home-theme.css?v=2026090423', 1)
html = html.replace("$('#navAccount').textContent='👤 لوحة التحكم';", "$('#navAccount').textContent='لوحة التحكم';")
html = html.replace("$('#navAccount').textContent='👤 تسجيل الدخول';", "$('#navAccount').textContent='تسجيل الدخول';")

css = css.replace('#ranking .filters{display:none!important}', '#ranking .filters{display:grid!important}', 1)

marker = '/* Compact four-item header + ranking filters 20260904 */'
if marker not in css:
    css += r'''

/* Compact four-item header + ranking filters 20260904 */
.home-header .compact-member-nav{
  min-height:68px!important;
  display:block!important;
  padding-block:8px;
}
.compact-member-nav .nav-user{
  width:100%;
  min-width:0;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:9px!important;
  direction:rtl;
}
.compact-member-nav .header-member{order:1;flex:0 1 auto}
.compact-member-nav .dashboard-link{order:2}
.compact-member-nav .header-notification-host{order:3}
.compact-member-nav .nav-logout{order:4}
.compact-member-nav .nav-account{order:5}
.compact-member-nav .header-member-link.header-tile{
  min-width:188px!important;
  max-width:250px!important;
  height:50px!important;
  justify-content:flex-start!important;
}
.compact-member-nav .dashboard-link,
.compact-member-nav .nav-logout,
.compact-member-nav .nav-account{
  height:50px!important;
  min-height:50px!important;
}
.compact-member-nav .dashboard-link{min-width:132px!important}
.compact-member-nav .nav-logout{min-width:76px!important}
.compact-member-nav .header-notification-host{
  height:50px;
  display:inline-flex;
  align-items:center;
}
.compact-member-nav .site-notification-bell{
  width:50px!important;
  height:50px!important;
  border:1px solid var(--hero-line)!important;
  border-radius:14px!important;
  background:rgba(255,255,255,.035)!important;
}

.home-hero .home-board-actions>.btn,
.home-hero .home-board-actions>.home-invite-wrap>.btn{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:10px!important;
}
.hero-action-icon{
  width:30px;
  height:30px;
  flex:0 0 30px;
  display:inline-grid;
  place-items:center;
  border:1px solid rgba(216,182,101,.48);
  border-radius:9px;
  background:rgba(216,182,101,.08);
  color:var(--hero-gold-2);
  font-size:17px;
  line-height:1;
  font-weight:900;
}
.hero-play-btn .hero-action-icon{
  border-color:rgba(23,53,54,.24);
  background:rgba(23,53,54,.08);
  color:#173536;
}

#ranking .head{
  min-height:76px!important;
  padding:10px 12px!important;
  display:grid!important;
  grid-template-columns:minmax(120px,.7fr) minmax(280px,1.3fr)!important;
  gap:12px!important;
  align-items:center!important;
  justify-content:stretch!important;
}
#ranking .head>div:first-child{
  width:auto!important;
  text-align:right!important;
}
#ranking .ranking-filters{
  width:100%!important;
  max-width:none!important;
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  gap:8px!important;
}
#ranking .ranking-filters select{
  height:38px!important;
  min-width:0;
  padding:0 9px!important;
  border-radius:10px!important;
  font-size:11px!important;
}

@media(min-width:901px){
  body.home-signed-in .home-header .compact-member-nav{min-height:64px!important;padding-block:6px}
  body.home-signed-in #ranking .head{min-height:66px!important;flex:0 0 66px!important}
}

@media(max-width:900px){
  .home-header .compact-member-nav{min-height:60px!important;padding-block:6px}
  .compact-member-nav .nav-user{gap:5px!important;overflow-x:auto;scrollbar-width:none}
  .compact-member-nav .nav-user::-webkit-scrollbar{display:none}
  .compact-member-nav .header-member-link.header-tile{min-width:158px!important;max-width:180px!important;height:44px!important}
  .compact-member-nav .dashboard-link,
  .compact-member-nav .nav-logout,
  .compact-member-nav .nav-account{height:44px!important;min-height:44px!important}
  .compact-member-nav .dashboard-link{min-width:112px!important}
  .compact-member-nav .nav-logout{min-width:64px!important}
  .compact-member-nav .header-notification-host{height:44px}
  .compact-member-nav .site-notification-bell{width:44px!important;height:44px!important}
  #ranking .head{grid-template-columns:1fr!important;gap:8px!important;padding:10px!important}
  #ranking .head>div:first-child{text-align:center!important}
  #ranking .ranking-filters{grid-template-columns:1fr 1fr!important}
}
'''

invite = invite.replace(
    '<button id="homeInviteToggle" class="btn light" type="button">👥 دعوة لاعب</button>',
    '<button id="homeInviteToggle" class="btn light" type="button"><span class="hero-action-icon" aria-hidden="true">＋</span><span>دعوة لاعب</span></button>',
    1,
)

html_path.write_text(html, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")
invite_path.write_text(invite, encoding="utf-8")
