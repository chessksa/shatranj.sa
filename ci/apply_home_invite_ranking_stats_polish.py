from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label} block not found')
    return text.replace(old, new, 1)


index_path = Path('index.html')
html = index_path.read_text(encoding='utf-8')

html = replace_once(
    html,
    '''      <div id="headerMember" class="header-member" hidden>\n        <a class="header-member-link header-tile" href="profile.html" aria-label="لوحة التحكم">''',
    '''      <div id="headerMember" class="header-member" hidden>\n        <a class="header-member-link header-tile" href="profile.html" aria-label="لوحة التحكم">''',
    'header member',
)

old_header = '''      <div id="headerMember" class="header-member" hidden>
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
    <a id="headerTournaments" class="header-tournaments header-tile" href="#register">
      <span class="header-tile-icon" aria-hidden="true">♜</span><span>البطولات</span>
    </a>'''
new_header = '''      <div id="headerMember" class="header-member" hidden>
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

      <a id="headerTournaments" class="header-tournaments header-tile" href="#register">
        <span class="header-tile-icon" aria-hidden="true">♜</span><span>البطولات</span>
      </a>

      <a id="dashboardNav" class="header-action header-tile dashboard-link" href="#register">
        <span class="header-tile-icon" aria-hidden="true">⚙</span><span>لوحة التحكم</span>
      </a>

      <div id="siteNotificationHost" class="header-notification-host"></div>

      <button id="navLogout" class="nav-logout header-action header-tile" type="button" hidden>خروج</button>
      <a href="#register" id="navAccount" class="nav-account header-action header-tile">تسجيل الدخول</a>
    </div>'''
html = replace_once(html, old_header, new_header, 'compact header')

html = replace_once(
    html,
    '''          <span class="hero-stat-icon" aria-hidden="true">👥</span>\n          <div><strong id="headerPlayersCount">0</strong><small>لاعب مسجل</small></div>''',
    '''          <span class="hero-stat-icon" aria-hidden="true">👥</span>\n          <div><small>لاعب مسجل</small><strong id="headerPlayersCount">0</strong></div>''',
    'players stat',
)
html = replace_once(
    html,
    '''          <span class="hero-stat-icon" aria-hidden="true">⚔</span>\n          <div><strong id="headerMatchesCount">0</strong><small>مباراة حالية</small></div>''',
    '''          <span class="hero-stat-icon" aria-hidden="true">⚔</span>\n          <div><small>مباراة حالية</small><strong id="headerMatchesCount">0</strong></div>''',
    'matches stat',
)
html = replace_once(
    html,
    '''          <span class="hero-stat-icon" aria-hidden="true">◉</span>\n          <div><strong>شاهد</strong><small>يشاهد الآن</small></div>''',
    '''          <span class="hero-stat-icon" aria-hidden="true">◉</span>\n          <div><small>يشاهد الآن</small><strong>شاهد</strong></div>''',
    'watch stat',
)

html = replace_once(
    html,
    '''            <tr>\n              <th>اللاعب</th>''',
    '''            <tr>\n              <th class="rank-number-head">#</th>\n              <th>اللاعب</th>''',
    'ranking header',
)
html = replace_once(
    html,
    '''  $('#tbody').innerHTML=topPlayers.map(player=>`\n    <tr>\n      <td>''',
    '''  $('#tbody').innerHTML=topPlayers.map((player,index)=>`\n    <tr>\n      <td class="rank-number">${index+1}</td>\n      <td>''',
    'ranking rows',
)

html = html.replace('home-theme.css?v=2026090425', 'home-theme.css?v=2026090426')
html = html.replace('home-invite.js?v=20260903-3', 'home-invite.js?v=20260904-4')
index_path.write_text(html, encoding='utf-8')

invite_path = Path('home-invite.js')
invite = invite_path.read_text(encoding='utf-8')
invite = replace_once(
    invite,
    '.home-invite-panel{position:absolute;top:45px;right:0;z-index:120;width:min(390px,calc(100vw - 28px));padding:10px;background:#fff;border:1px solid #d9d2c6;border-radius:12px;box-shadow:0 16px 36px rgba(13,59,46,.18)}',
    '.home-invite-panel{position:fixed;top:50%;left:50%;right:auto;transform:translate(-50%,-50%);z-index:120;width:min(520px,calc(100vw - 32px));max-height:min(70vh,520px);overflow:auto;padding:14px;background:#fff;border:1px solid #d9d2c6;border-radius:14px;box-shadow:0 18px 46px rgba(0,0,0,.28)}',
    'invite panel desktop',
)
invite = replace_once(
    invite,
    '.home-invite-panel{position:fixed;top:auto;right:9px;left:9px;bottom:68px;width:auto;max-height:60vh}',
    '.home-invite-panel{top:50%;right:auto;left:50%;bottom:auto;width:min(520px,calc(100vw - 18px));max-height:min(70vh,520px);transform:translate(-50%,-50%)}',
    'invite panel mobile',
)
invite_path.write_text(invite, encoding='utf-8')

css_path = Path('home-theme.css')
css = css_path.read_text(encoding='utf-8')
marker = '/* Invite, stats and ranking polish 20260904 */'
if marker not in css:
    css += '''\n\n/* Invite, stats and ranking polish 20260904 */
.hero-stat div{align-items:center!important;text-align:center!important}
.hero-stat div small{order:1!important;margin:0 0 7px!important;font-size:12px!important}
.hero-stat div strong{order:2!important}
.nav-user .header-tournaments{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-height:50px!important;padding:0 14px!important;white-space:nowrap}
#ranking th:nth-child(1),#ranking td:nth-child(1){width:7%!important;text-align:center!important}
#ranking th:nth-child(2),#ranking td:nth-child(2){width:35%!important;text-align:center!important}
#ranking th:nth-child(3),#ranking td:nth-child(3){width:23%!important;text-align:center!important}
#ranking th:nth-child(4),#ranking td:nth-child(4){width:20%!important;text-align:center!important}
#ranking th:nth-child(5),#ranking td:nth-child(5){width:15%!important;text-align:center!important}
#ranking .rank-number{color:var(--hero-gold)!important;font-weight:900!important;font-size:13px!important}
@media(max-width:900px){
  #ranking th:nth-child(1),#ranking td:nth-child(1){width:8%!important}
  #ranking th:nth-child(2),#ranking td:nth-child(2){width:34%!important}
  #ranking th:nth-child(3),#ranking td:nth-child(3){width:23%!important}
  #ranking th:nth-child(4),#ranking td:nth-child(4){width:20%!important}
  #ranking th:nth-child(5),#ranking td:nth-child(5){width:15%!important}
}
'''
css_path.write_text(css, encoding='utf-8')
