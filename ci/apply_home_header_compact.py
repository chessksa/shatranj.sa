from pathlib import Path

INDEX = Path('index.html')
CSS = Path('home-theme.css')

html = INDEX.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')

old_nav = '''    <div class="nav-user">
      <a href="#register" id="navAccount" class="nav-account header-action">👤 تسجيل الدخول</a>
      <button id="navLogout" class="nav-logout header-action" type="button" hidden>تسجيل الخروج</button>
    </div>'''
new_nav = '''    <div class="nav-user">
      <div id="headerMember" class="header-member" hidden>
        <a class="header-member-link" href="profile.html" aria-label="لوحة التحكم">
          <span class="header-member-avatar-wrap" aria-hidden="true">
            <img id="headerMemberAvatar" class="header-member-avatar" alt="" hidden>
            <span id="headerMemberFallback" class="header-member-avatar header-member-fallback">♟</span>
          </span>
          <span class="header-member-copy">
            <strong id="headerMemberName">العضو</strong>
            <small>النقاط <b id="headerMemberRating">1500</b></small>
          </span>
        </a>
        <div id="siteNotificationHost"></div>
      </div>
      <a href="#register" id="navAccount" class="nav-account header-action">👤 تسجيل الدخول</a>
      <button id="navLogout" class="nav-logout header-action" type="button" hidden>خروج</button>
    </div>'''
if old_nav not in html:
    raise SystemExit('nav-user block not found')
html = html.replace(old_nav, new_nav, 1)

html = html.replace(
    '<a href="#register">لوحة التحكم</a>',
    '<a id="dashboardNav" href="#register">لوحة التحكم</a>',
    1,
)

marker = '''function renderAccount(){
  const loggedIn=!!currentSession;
'''
helper = '''function showHeaderMemberAvatar(){
  const img=$('#headerMemberAvatar');
  const fallback=$('#headerMemberFallback');
  if(!img||!fallback||!currentProfile||!currentSession) return;

  fallback.textContent=accountInitial(currentProfile.name);
  fallback.hidden=false;
  img.hidden=true;

  const currentPath=`${currentProfile.id}/avatar.webp`;
  const legacyPath=`${currentSession.user.id}/avatar.webp`;
  let triedLegacy=false;

  img.onerror=()=>{
    if(!triedLegacy && legacyPath!==currentPath){
      triedLegacy=true;
      img.src=accountAvatarPublicUrl(legacyPath);
      return;
    }
    img.hidden=true;
    fallback.hidden=false;
  };

  img.onload=()=>{
    fallback.hidden=true;
    img.hidden=false;
  };

  img.src=accountAvatarPublicUrl(currentPath);
}

function renderAccount(){
  const loggedIn=!!currentSession;
  document.body.classList.toggle('home-signed-in',loggedIn);
  $('#headerMember').hidden=!loggedIn;
  $('#navAccount').hidden=loggedIn;

'''
if marker not in html:
    raise SystemExit('renderAccount marker not found')
html = html.replace(marker, helper, 1)

recovery_old = '''  if(passwordRecoveryMode){
    $('#guestAuth').hidden=true;
    $('#accountPanel').hidden=true;
    $('#resetPasswordForm').hidden=false;
    $('#navAccount').textContent='تغيير كلمة المرور';
    $('#navAccount').href='#register';
    $('#navLogout').hidden=true;
    return;
  }
'''
recovery_new = '''  if(passwordRecoveryMode){
    document.body.classList.remove('home-signed-in');
    $('#headerMember').hidden=true;
    $('#navAccount').hidden=false;
    $('#guestAuth').hidden=true;
    $('#accountPanel').hidden=true;
    $('#resetPasswordForm').hidden=false;
    $('#navAccount').textContent='تغيير كلمة المرور';
    $('#navAccount').href='#register';
    $('#navLogout').hidden=true;
    const dashboardNav=$('#dashboardNav');
    if(dashboardNav) dashboardNav.href='#register';
    return;
  }
'''
if recovery_old not in html:
    raise SystemExit('recovery block not found')
html = html.replace(recovery_old, recovery_new, 1)

profile_old = '''  if(loggedIn && currentProfile){
    showAccountAvatar();
    $('#accountWelcome').textContent='مرحبًا، '+currentProfile.name;
    renderAccountRank(currentProfile.rating);
    $('#accountRating').textContent=currentProfile.rating??1500;
'''
profile_new = '''  if(loggedIn && currentProfile){
    showAccountAvatar();
    showHeaderMemberAvatar();
    $('#headerMemberName').textContent=currentProfile.name;
    $('#headerMemberRating').textContent=currentProfile.rating??1500;
    $('#accountWelcome').textContent='مرحبًا، '+currentProfile.name;
    renderAccountRank(currentProfile.rating);
    $('#accountRating').textContent=currentProfile.rating??1500;
'''
if profile_old not in html:
    raise SystemExit('profile render block not found')
html = html.replace(profile_old, profile_new, 1)

logged_old = '''  if(loggedIn){
    $('#navAccount').textContent='👤 لوحة التحكم';
    $('#navAccount').href='profile.html';
    $('#navLogout').hidden=false;
  }else{
    $('#navAccount').textContent='👤 تسجيل الدخول';
    $('#navAccount').href='#register';
    $('#navLogout').hidden=true;
  }
'''
logged_new = '''  const dashboardNav=$('#dashboardNav');
  if(loggedIn){
    $('#navAccount').textContent='👤 لوحة التحكم';
    $('#navAccount').href='profile.html';
    $('#navAccount').hidden=true;
    $('#navLogout').hidden=false;
    if(dashboardNav) dashboardNav.href='profile.html';
  }else{
    $('#headerMember').hidden=true;
    $('#navAccount').textContent='👤 تسجيل الدخول';
    $('#navAccount').href='#register';
    $('#navAccount').hidden=false;
    $('#navLogout').hidden=true;
    if(dashboardNav) dashboardNav.href='#register';
  }
'''
if logged_old not in html:
    raise SystemExit('logged-in nav block not found')
html = html.replace(logged_old, logged_new, 1)

css = css.replace('border:8px solid #67431f;', 'border:1px solid var(--hero-cyan-line);')
css = css.replace('border:8px solid #67431f!important;', 'border:1px solid var(--hero-cyan-line)!important;')
css = css.replace('border-width:6px', 'border-width:1px')
css = css.replace('border-width:6px!important', 'border-width:1px!important')

append = r'''

/* Compact signed-in member in header 20260904 */
.header-member{
  display:flex;
  align-items:center;
  gap:8px;
  min-width:0;
}
.header-member[hidden]{display:none!important}
.header-member-link{
  height:50px;
  min-width:178px;
  max-width:238px;
  padding:5px 10px 5px 7px;
  display:flex;
  align-items:center;
  gap:9px;
  border:1px solid var(--hero-line);
  border-radius:15px;
  background:rgba(255,255,255,.035);
  color:var(--hero-cream)!important;
  text-decoration:none;
}
.header-member-link:hover{background:rgba(216,182,101,.08)}
.header-member-avatar-wrap{width:38px;height:38px;flex:0 0 38px;position:relative}
.header-member-avatar{
  width:38px;
  height:38px;
  border-radius:9px;
  border:1px solid rgba(216,182,101,.38);
  object-fit:cover;
  background:#0a3a3c;
}
.header-member-fallback{
  display:grid;
  place-items:center;
  color:var(--hero-gold);
  font-size:17px;
  font-weight:900;
}
.header-member-fallback[hidden],.header-member-avatar[hidden]{display:none!important}
.header-member-copy{min-width:0;display:flex;flex-direction:column;line-height:1.15;text-align:right}
.header-member-copy strong{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--hero-cream)}
.header-member-copy small{margin-top:4px;color:#b9c9c4;font-size:10px;white-space:nowrap}
.header-member-copy b{margin-inline-start:3px;color:var(--hero-gold-2);font-size:12px}
.nav-user #siteNotificationHost{display:inline-flex;align-items:center}
.nav-user .site-notification-bell{width:44px;height:44px;border-radius:13px}
.home-signed-in #register{display:none!important}

/* Leaderboard frame uses the same card language as the feature icons. */
#ranking .head{
  border:1px solid var(--hero-cyan-line);
  border-bottom:0;
  border-radius:18px 18px 0 0;
  background:linear-gradient(145deg,rgba(8,62,64,.82),rgba(7,49,51,.76));
  box-shadow:0 13px 30px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.025);
}
#ranking .table-card{
  border:1px solid var(--hero-cyan-line)!important;
  border-top:1px solid rgba(216,182,101,.12)!important;
  background:linear-gradient(145deg,rgba(8,62,64,.82),rgba(7,49,51,.76))!important;
  box-shadow:0 13px 30px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.025)!important;
}

/* Desktop no-scroll signed-in composition */
@media(min-width:901px){
  body.home-signed-in{
    height:100vh!important;
    min-height:0!important;
    overflow:hidden!important;
    grid-template-rows:64px minmax(0,1fr) 104px 38px!important;
  }
  body.home-signed-in .home-header{grid-row:1}
  body.home-signed-in .home-header .nav{min-height:64px!important}
  body.home-signed-in .main-nav{height:64px}
  body.home-signed-in .home-hero{grid-row:2;padding:16px 0 10px!important;overflow:hidden}
  body.home-signed-in #ranking{grid-row:2;height:100%;padding:16px 0 10px!important;overflow:hidden;align-self:stretch}
  body.home-signed-in #ranking>.wrap{height:100%;display:flex;flex-direction:column;min-height:0}
  body.home-signed-in #ranking .head{min-height:42px;flex:0 0 42px}
  body.home-signed-in #ranking .table-card{flex:1;min-height:0}
  body.home-signed-in #ranking .table-wrap{height:100%;overflow:hidden!important}
  body.home-signed-in #ranking table{height:100%}
  body.home-signed-in #ranking th{height:28px!important;padding:4px 7px!important}
  body.home-signed-in #ranking td{height:32px!important;padding:4px 7px!important}
  body.home-signed-in .home-hero h1{margin:10px 0 6px!important;font-size:clamp(38px,4.2vw,56px)!important}
  body.home-signed-in .home-hero p{margin-bottom:13px!important;font-size:18px!important}
  body.home-signed-in .hero-live-stats{gap:9px;margin-bottom:13px}
  body.home-signed-in .hero-stat{min-height:74px;padding:9px 10px;gap:8px;border-radius:15px}
  body.home-signed-in .hero-stat strong{font-size:22px}
  body.home-signed-in .hero-stat-icon{font-size:22px}
  body.home-signed-in .home-hero .home-board-actions{gap:10px!important}
  body.home-signed-in .home-hero .home-board-actions>.btn,
  body.home-signed-in .home-hero .home-board-actions>.home-invite-wrap>.btn{height:52px!important;min-height:52px!important;font-size:16px!important}
  body.home-signed-in .home-features{grid-row:3;padding:7px 0 9px!important;overflow:hidden}
  body.home-signed-in .home-feature-grid{gap:10px!important;height:88px}
  body.home-signed-in .home-feature-card{min-height:0;height:88px;padding:8px 10px;border-radius:15px}
  body.home-signed-in .feature-icon{margin-bottom:5px;font-size:24px}
  body.home-signed-in .home-feature-card strong{font-size:15px}
  body.home-signed-in .home-feature-card small{margin-top:3px;font-size:10px}
  body.home-signed-in footer{grid-row:4;padding:7px 0!important;overflow:hidden}
}

@media(max-width:900px){
  .header-member-link{min-width:0;max-width:178px;height:42px;padding:3px 7px}
  .header-member-avatar-wrap,.header-member-avatar{width:32px;height:32px;flex-basis:32px}
  .header-member-copy strong{max-width:105px;font-size:11px}
  .header-member-copy small{font-size:9px}
  .nav-user .site-notification-bell{width:38px;height:38px}
}
'''

if '/* Compact signed-in member in header 20260904 */' not in css:
    css += append

INDEX.write_text(html, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
