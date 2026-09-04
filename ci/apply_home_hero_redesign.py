from pathlib import Path
import re

index_path = Path('index.html')
html = index_path.read_text(encoding='utf-8')

header = '''<header class="home-header">
  <div class="wrap nav">
    <div class="brand"><span class="brand-mark">♟</span><span>شطرنج السعودية</span></div>

    <nav class="main-nav" aria-label="التنقل الرئيسي">
      <a class="active" href="index.html">الرئيسية</a>
      <a href="#register">لوحة التحكم</a>
      <a href="#ranking">اللاعبون</a>
      <a href="#features">البطولات</a>
      <a href="#features">دليل الموقع</a>
    </nav>

    <div class="nav-user">
      <a href="#register" id="navAccount" class="nav-account header-action">👤 تسجيل الدخول</a>
      <button id="navLogout" class="nav-logout header-action" type="button" hidden>تسجيل الخروج</button>
    </div>
  </div>
</header>'''

html, count = re.subn(r'<header>.*?</header>', header, html, count=1, flags=re.S)
if count != 1:
    raise SystemExit('header block not found')

old_board = re.compile(
    r'\n\s*<a id="homeBoardPreview" class="home-board-preview protected-play" href="play-v10\.html" aria-label="العب الآن"></a>\s*'
    r'<div id="homeBoardActions" class="home-board-actions">\s*'
    r'<a class="btn gold protected-play" href="play-v10\.html">♟ العب الآن</a>\s*'
    r'</div>',
    re.S,
)
html, removed = old_board.subn('', html, count=1)
if removed != 1:
    raise SystemExit('old home board block not found')

hero = '''

<!-- APPROVED HOME HERO 20260904 -->
<section id="homeHero" class="home-hero">
  <div class="wrap home-hero-grid">
    <div class="home-hero-copy">
      <span class="hero-kicker">المنصة السعودية للشطرنج</span>
      <h1>مرحبًا بك في <span>شطرنج السعودية</span></h1>
      <p>مجتمع سعودي لعشاق الشطرنج</p>

      <div class="hero-live-stats" aria-label="إحصاءات المنصة">
        <div class="hero-stat">
          <span class="hero-stat-icon" aria-hidden="true">👥</span>
          <div><strong id="headerPlayersCount">0</strong><small>لاعب مسجل</small></div>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-icon" aria-hidden="true">⚔</span>
          <div><strong id="headerMatchesCount">0</strong><small>مباراة حالية</small></div>
        </div>
        <a class="hero-stat hero-stat-watch" href="watch.html">
          <span class="hero-stat-icon" aria-hidden="true">◉</span>
          <div><strong>شاهد</strong><small>يشاهد الآن</small></div>
        </a>
      </div>

      <div id="homeBoardActions" class="home-board-actions" aria-label="العب الآن ودعوة لاعب">
        <a class="btn gold protected-play hero-play-btn" href="play-v10.html"><span aria-hidden="true">⚡</span> العب الآن</a>
      </div>
    </div>

    <a id="homeBoardPreview" class="home-board-preview protected-play" href="play-v10.html" aria-label="فتح رقعة اللعب"></a>
  </div>
</section>

<section id="features" class="home-features" aria-label="أقسام شطرنج السعودية">
  <div class="wrap home-feature-grid">
    <a class="home-feature-card" href="#ranking">
      <span class="feature-icon">▥</span><strong>التصنيف</strong><small>تابع تقدمك في النقاط</small>
    </a>
    <a class="home-feature-card" href="#ranking">
      <span class="feature-icon">👥</span><strong>اللاعبون</strong><small>تعرف على مجتمع اللاعبين</small>
    </a>
    <a class="home-feature-card" href="#register">
      <span class="feature-icon">🏆</span><strong>البطولات</strong><small>شارك في البطولات المحلية</small>
    </a>
    <a class="home-feature-card" href="#register">
      <span class="feature-icon">▤</span><strong>دليل الموقع</strong><small>كل ما تحتاج معرفته</small>
    </a>
  </div>
</section>
'''

marker = '\n<!-- RANKING -->'
if marker not in html:
    raise SystemExit('ranking marker not found')
html = html.replace(marker, hero + marker, 1)

html = html.replace('home-theme.css?v=20260903-13', 'home-theme.css?v=20260904-20')
html = html.replace('<strong>شطرنج السعودية</strong>', '<strong>♟ شطرنج السعودية</strong><span class="footer-tagline"> .. أكثر من لعبة</span>', 1)
index_path.write_text(html, encoding='utf-8')

css_path = Path('home-theme.css')
css = css_path.read_text(encoding='utf-8')
marker_css = '/* APPROVED HOME HERO 20260904 */'
if marker_css in css:
    raise SystemExit('approved hero CSS already present')

css += r'''

/* APPROVED HOME HERO 20260904 */
:root{
  --hero-deep:#062f31;
  --hero-deeper:#042628;
  --hero-panel:#0b4143;
  --hero-panel-soft:rgba(12,68,70,.72);
  --hero-gold:#d4b467;
  --hero-cream:#f4eddc;
  --hero-muted:#aec2bc;
  --hero-line:rgba(212,180,103,.25);
}
body{
  display:block!important;
  min-height:100vh;
  background:radial-gradient(circle at 22% 32%,rgba(23,105,106,.22),transparent 29%),radial-gradient(circle at 78% 18%,rgba(212,180,103,.06),transparent 22%),linear-gradient(145deg,var(--hero-deeper),var(--hero-deep) 48%,#07383a)!important;
  color:var(--hero-cream)!important;
}
.wrap{width:min(1180px,calc(100% - 34px))!important}
.home-header{position:sticky;top:0;z-index:60;background:rgba(4,39,41,.92)!important;border-bottom:1px solid rgba(212,180,103,.2)!important;box-shadow:0 10px 30px rgba(0,0,0,.14)!important;backdrop-filter:blur(14px)}
.home-header .nav{min-height:72px!important;display:grid!important;grid-template-columns:minmax(180px,1fr) auto minmax(210px,1fr)!important;gap:20px!important;align-items:center!important;direction:rtl}
.home-header .brand{justify-self:start!important;display:flex;align-items:center;gap:10px;color:var(--hero-cream)!important;font-size:22px!important;font-weight:900;white-space:nowrap}
.brand-mark{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(212,180,103,.42);border-radius:50%;color:var(--hero-gold);font-size:22px;box-shadow:inset 0 0 0 4px rgba(212,180,103,.03)}
.main-nav{justify-self:center;display:flex;align-items:center;gap:4px;height:72px}
.main-nav a{position:relative;display:flex;align-items:center;height:100%;padding:0 15px;color:#ded8c9;font-size:14px;font-weight:800;white-space:nowrap}
.main-nav a:hover,.main-nav a.active{color:var(--hero-gold)}
.main-nav a.active::after{content:"";position:absolute;left:16px;right:16px;bottom:0;height:4px;border-radius:4px 4px 0 0;background:var(--hero-gold)}
.nav-user{justify-self:end;display:flex;align-items:center;gap:8px;direction:rtl}
.nav-account,.nav-logout{min-height:44px!important;padding:0 14px!important;border:1px solid var(--hero-line)!important;border-radius:14px!important;background:rgba(255,255,255,.035)!important;color:var(--hero-cream)!important;font:800 12px Arial,sans-serif!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap}
.nav-account{color:var(--hero-gold)!important}.nav-logout:hover,.nav-account:hover{background:rgba(212,180,103,.08)!important}
.home-hero{position:relative;padding:46px 0 28px!important;overflow:hidden;border-bottom:0!important;background:linear-gradient(90deg,rgba(3,34,36,.2),rgba(4,44,46,.7)),radial-gradient(circle at 18% 60%,rgba(31,117,116,.22),transparent 32%)!important}
.home-hero::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.18;background:linear-gradient(90deg,transparent 0 12%,rgba(212,180,103,.08) 12.1% 12.2%,transparent 12.3% 100%),linear-gradient(0deg,transparent 0 78%,rgba(255,255,255,.035) 78.1% 78.2%,transparent 78.3% 100%)}
.home-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,520px);gap:56px;align-items:center;direction:rtl}
.home-hero-copy{min-width:0}.hero-kicker{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border:1px solid rgba(212,180,103,.28);border-radius:999px;background:rgba(212,180,103,.08);color:#e5cf93;font-size:11px;font-weight:900}
.home-hero h1{margin:16px 0 8px;max-width:650px;color:var(--hero-cream)!important;font-size:clamp(42px,5vw,72px)!important;line-height:1.14!important;letter-spacing:-1.2px}.home-hero h1 span{display:block;color:var(--hero-cream)}
.home-hero p{margin:0 0 24px!important;color:#e7decc!important;font-size:clamp(18px,2vw,27px)!important;font-weight:500}
.hero-live-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0 0 24px}
.hero-stat{min-height:118px;padding:16px 15px;display:flex;align-items:center;justify-content:center;gap:14px;border:1px solid rgba(36,137,137,.48);border-radius:18px;background:linear-gradient(145deg,rgba(7,52,54,.76),rgba(8,61,63,.62));color:var(--hero-cream);box-shadow:0 14px 34px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.025)}
.hero-stat:hover{border-color:rgba(212,180,103,.5);transform:translateY(-1px)}.hero-stat-icon{color:var(--hero-gold);font-size:27px;line-height:1}.hero-stat div{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1}.hero-stat strong{color:var(--hero-cream)!important;font-size:30px;font-weight:900}.hero-stat small{margin-top:7px;color:#e7decc;font-size:12px;white-space:nowrap}.hero-stat-watch{text-decoration:none}.hero-stat-watch strong{font-size:22px}
.home-hero .home-board-actions{width:100%!important;max-width:600px;margin:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important;align-items:stretch!important}
.home-hero .home-board-actions>.btn,.home-hero .home-board-actions>.home-invite-wrap,.home-hero .home-board-actions>.home-invite-wrap>.btn{width:100%!important;min-width:0!important}.home-hero .home-board-actions>.btn,.home-hero .home-board-actions>.home-invite-wrap>.btn{min-height:72px!important;height:72px!important;border-radius:17px!important;font-size:20px!important;font-weight:900!important}
.home-hero .hero-play-btn{background:linear-gradient(135deg,#eed184,#d6ad55)!important;color:#173536!important;border:1px solid #efd589!important;box-shadow:0 14px 28px rgba(0,0,0,.2)!important}.home-hero .home-invite-wrap>.btn{background:rgba(7,55,57,.62)!important;color:var(--hero-cream)!important;border:1px solid rgba(238,209,132,.72)!important}
.home-hero .home-board-preview{width:min(100%,520px)!important;height:auto!important;aspect-ratio:1/1;margin:0!important;justify-self:start;border:11px solid #6c421d!important;outline:2px solid rgba(212,180,103,.5);border-radius:9px!important;background:url("home-board-preview.svg?v=20260903-2") center/cover no-repeat!important;box-shadow:0 22px 48px rgba(0,0,0,.36),inset 0 0 0 1px rgba(255,255,255,.07)!important;filter:contrast(1.08) saturate(.92) sepia(.08)!important}.home-hero .home-board-preview:hover{transform:translateY(-3px) scale(1.005)}
.home-features{padding:22px 0 28px!important;background:rgba(4,37,39,.36)!important;border-bottom:1px solid rgba(212,180,103,.13)}.home-feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.home-feature-card{min-height:164px;padding:20px 16px;border:1px solid rgba(36,137,137,.4);border-radius:18px;background:linear-gradient(145deg,rgba(8,62,64,.78),rgba(7,49,51,.7));display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--hero-cream);box-shadow:0 13px 30px rgba(0,0,0,.12)}.home-feature-card:hover{transform:translateY(-3px);border-color:rgba(212,180,103,.5)}.feature-icon{margin-bottom:12px;color:var(--hero-gold);font-size:34px;line-height:1}.home-feature-card strong{font-size:20px}.home-feature-card small{margin-top:9px;color:#d9d0bf;font-size:13px}
#ranking,#register{width:100%!important;max-width:none!important;padding:28px 0!important;background:transparent!important;border:0!important}#ranking>.wrap,#register>.wrap{width:min(1180px,calc(100% - 34px))!important;margin:auto!important}#ranking .table-card,#register .form-card{background:rgba(8,57,59,.82)!important;border:1px solid var(--hero-line)!important}
.home-invite-panel{background:#0b3b3d!important;border-color:rgba(212,180,103,.34)!important;box-shadow:0 20px 46px rgba(0,0,0,.34)!important}.home-invite-title,.home-invite-result,.home-invite-name{color:var(--hero-cream)!important}.home-invite-search,.home-invite-result{background:#082f31!important;border-color:rgba(255,255,255,.08)!important;color:var(--hero-cream)!important}.home-invite-result:hover{background:#0d484a!important}.home-invite-meta,.home-invite-empty{color:var(--hero-muted)!important}.home-invite-send{color:var(--hero-gold)!important}
footer{padding:20px 0!important;background:#05292b!important;border-top:1px solid rgba(212,180,103,.16)!important;color:var(--hero-cream)!important}footer .wrap{display:flex;justify-content:space-between;align-items:center}.footer-tagline{color:#d9c58e;margin-inline-start:8px}
@media(max-width:1040px){.home-header .nav{grid-template-columns:auto 1fr auto!important;gap:10px!important}.main-nav a{padding:0 9px;font-size:12px}.home-hero-grid{grid-template-columns:minmax(0,1fr) minmax(320px,430px);gap:30px}.hero-stat{padding:12px 10px;gap:8px}.hero-stat strong{font-size:25px}}
@media(max-width:900px){.wrap{width:min(100% - 20px,720px)!important}.home-header .nav{min-height:62px!important;grid-template-columns:1fr auto!important}.main-nav{display:none!important}.home-header .brand{font-size:17px!important}.brand-mark{width:32px;height:32px;font-size:18px}.nav-user{justify-self:end}.nav-account,.nav-logout{min-height:38px!important;padding:0 9px!important;font-size:11px!important}.home-hero{padding:24px 0 18px!important}.home-hero-grid{grid-template-columns:1fr;gap:24px;text-align:center}.home-hero-copy{display:flex;flex-direction:column;align-items:center}.home-hero h1{font-size:clamp(36px,10vw,54px)!important;letter-spacing:-.6px}.home-hero p{font-size:18px!important}.hero-live-stats{width:100%;gap:8px}.hero-stat{min-height:92px;flex-direction:column;gap:6px}.hero-stat div{align-items:center}.hero-stat strong{font-size:22px}.hero-stat small{font-size:10px;margin-top:4px}.hero-stat-icon{font-size:22px}.home-hero .home-board-actions{width:100%!important;max-width:560px;gap:9px!important}.home-hero .home-board-actions>.btn,.home-hero .home-board-actions>.home-invite-wrap>.btn{height:56px!important;min-height:56px!important;font-size:15px!important}.home-hero .home-board-preview{justify-self:center;width:min(88vw,480px)!important;order:-1}.home-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.home-feature-card{min-height:126px;padding:14px 10px}.feature-icon{font-size:28px;margin-bottom:8px}.home-feature-card strong{font-size:16px}.home-feature-card small{font-size:11px}}
@media(max-width:520px){.home-header .brand span:last-child{font-size:14px}.nav-account{max-width:128px;overflow:hidden;text-overflow:ellipsis}.hero-live-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.hero-stat{min-width:0;padding:8px 4px}.hero-stat small{white-space:normal;line-height:1.15}.home-hero .home-board-actions{grid-template-columns:1fr 1fr!important}.home-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#ranking>.wrap,#register>.wrap{width:min(100% - 18px,720px)!important}}
'''
css_path.write_text(css, encoding='utf-8')
