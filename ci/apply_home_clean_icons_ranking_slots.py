from pathlib import Path
import re

INDEX = Path('index.html')
CSS = Path('home-theme.css')
INVITE = Path('home-invite.js')

html = INDEX.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')
invite = INVITE.read_text(encoding='utf-8')

# 1) Put tournaments at the left edge of the signed-in control group.
tournament_pattern = re.compile(
    r'\n\s*<a id="headerTournaments" class="header-tournaments header-tile" href="#register">\n'
    r'\s*<span class="header-tile-icon" aria-hidden="true">♜</span><span>البطولات</span>\n'
    r'\s*</a>\n',
    re.S,
)
match = tournament_pattern.search(html)
if not match:
    raise SystemExit('header tournaments block not found')
tournament_block = match.group(0).strip('\n')
html = html[:match.start()] + '\n' + html[match.end():]
logout_line = '      <button id="navLogout" class="nav-logout header-action header-tile" type="button" hidden>خروج</button>\n'
if logout_line not in html:
    raise SystemExit('logout line not found')
html = html.replace(logout_line, logout_line + tournament_block + '\n', 1)

# 2) Remove decorative icons from the three live-stat cards.
for icon in ('👥', '⚔', '◉'):
    html = html.replace(f'          <span class="hero-stat-icon" aria-hidden="true">{icon}</span>\n', '', 1)

# 3) Remove decorative icon from Play Now.
old_play = '<a class="btn gold protected-play hero-play-btn" href="play-v10.html"><span class="hero-action-icon" aria-hidden="true">♟</span><span>العب الآن</span></a>'
new_play = '<a class="btn gold protected-play hero-play-btn" href="play-v10.html"><span>العب الآن</span></a>'
if old_play not in html:
    raise SystemExit('play button block not found')
html = html.replace(old_play, new_play, 1)

# 4) Always render ten ranking slots. Real players occupy the first rows;
#    remaining rows stay visibly empty and fill automatically later.
old_render = '''function renderPlayers(players){
  const topPlayers=players.slice(0,10);
  $('#tbody').innerHTML=topPlayers.map((player,index)=>`
    <tr>
      <td class="rank-number">${index+1}</td>
      <td>
        <a class="player-name player-profile-link" href="player.html?id=${encodeURIComponent(player.id)}">${escapeHTML(player.name)}</a>
        ${player.username
          ? `<span class="player-username">@${escapeHTML(player.username)}</span>`
          : ''
        }
      </td>
      <td>${escapeHTML(player.region)}</td>
      <td>${escapeHTML(player.city)}</td>
      <td class="rating">${player.rating}</td>
    </tr>
  `).join('');

  $('#results').textContent=topPlayers.length+' لاعب';
  $('#empty').style.display=topPlayers.length?'none':'block';
}
'''
new_render = '''function renderPlayers(players){
  const topPlayers=players.slice(0,10);
  const rows=[];

  for(let index=0;index<10;index++){
    const player=topPlayers[index];

    if(!player){
      rows.push(`
        <tr class="ranking-placeholder">
          <td class="rank-number">${index+1}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `);
      continue;
    }

    rows.push(`
      <tr>
        <td class="rank-number">${index+1}</td>
        <td>
          <a class="player-name player-profile-link" href="player.html?id=${encodeURIComponent(player.id)}">${escapeHTML(player.name)}</a>
          ${player.username
            ? `<span class="player-username">@${escapeHTML(player.username)}</span>`
            : ''
          }
        </td>
        <td>${escapeHTML(player.region)}</td>
        <td>${escapeHTML(player.city)}</td>
        <td class="rating">${player.rating}</td>
      </tr>
    `);
  }

  $('#tbody').innerHTML=rows.join('');
  $('#results').textContent=topPlayers.length+' لاعب';
  $('#empty').style.display='none';
}
'''
if old_render not in html:
    raise SystemExit('renderPlayers block not found')
html = html.replace(old_render, new_render, 1)

# Cache bust both touched assets.
if 'home-theme.css?v=2026090426' not in html:
    raise SystemExit('home theme cache version not found')
html = html.replace('home-theme.css?v=2026090426', 'home-theme.css?v=2026090427', 1)
if 'home-invite.js?v=20260904-4' not in html:
    raise SystemExit('home invite cache version not found')
html = html.replace('home-invite.js?v=20260904-4', 'home-invite.js?v=20260904-5', 1)

# 5) Remove decorative icon from Invite Player.
old_invite_button = '<button id="homeInviteToggle" class="btn light" type="button"><span class="hero-action-icon" aria-hidden="true">＋</span><span>دعوة لاعب</span></button>'
new_invite_button = '<button id="homeInviteToggle" class="btn light" type="button"><span>دعوة لاعب</span></button>'
if old_invite_button not in invite:
    raise SystemExit('invite button block not found')
invite = invite.replace(old_invite_button, new_invite_button, 1)

# 6) Make tournament ordering explicit and keep empty ranking slots visually clean.
append_css = '''

/* Clean home controls + fixed ten-slot ranking 20260904 */
.compact-member-nav .header-tournaments{order:5!important}
.compact-member-nav .nav-account{order:6!important}
#ranking .ranking-placeholder td{
  color:transparent!important;
  background:rgba(255,255,255,.012)!important;
}
#ranking .ranking-placeholder .rank-number{
  color:var(--hero-gold)!important;
}
'''
if '/* Clean home controls + fixed ten-slot ranking 20260904 */' not in css:
    css += append_css

INDEX.write_text(html, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
INVITE.write_text(invite, encoding='utf-8')
