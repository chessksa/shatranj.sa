from pathlib import Path

INDEX = Path('index.html')
CSS = Path('home-theme.css')

html = INDEX.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected block: {label}')
    return text.replace(old, new, 1)

# Force browsers to load this layout revision.
html = html.replace('home-theme.css?v=2026090421', 'home-theme.css?v=2026090422')

old_nav = '''    <nav class="main-nav" aria-label="التنقل الرئيسي">
      <a class="active" href="index.html">الرئيسية</a>
      <a id="dashboardNav" href="#register">لوحة التحكم</a>
      <a href="#ranking">اللاعبون</a>
      <a href="#features">البطولات</a>
      <a href="#features">دليل الموقع</a>
    </nav>'''
new_nav = '''    <nav class="main-nav" aria-label="التنقل الرئيسي">
      <a class="active header-tile" href="index.html"><span class="header-tile-icon" aria-hidden="true">⌂</span><span>الرئيسية</span></a>
      <a id="dashboardNav" class="header-tile" href="#register"><span class="header-tile-icon" aria-hidden="true">⚙</span><span>لوحة التحكم</span></a>
      <a class="header-tile" href="#ranking"><span class="header-tile-icon" aria-hidden="true">♟</span><span>اللاعبون</span></a>
      <a class="header-tile" href="#features"><span class="header-tile-icon" aria-hidden="true">♜</span><span>البطولات</span></a>
      <a class="header-tile" href="#features"><span class="header-tile-icon" aria-hidden="true">▤</span><span>دليل الموقع</span></a>
    </nav>'''
html = replace_once(html, old_nav, new_nav, 'main navigation')
html = replace_once(html, 'class="header-member-link"', 'class="header-member-link header-tile"', 'member tile class')
html = replace_once(html, 'class="nav-account header-action"', 'class="nav-account header-action header-tile"', 'account tile class')
html = replace_once(html, 'class="nav-logout header-action"', 'class="nav-logout header-action header-tile"', 'logout tile class')

old_head = '''            <tr>
              <th>#</th>
              <th>اللاعب</th>
              <th>المنطقة</th>
              <th>المدينة</th>
              <th>الفئة</th>
              <th>النقاط</th>
            </tr>'''
new_head = '''            <tr>
              <th>اللاعب</th>
              <th>المنطقة</th>
              <th>المدينة</th>
              <th>النقاط</th>
            </tr>'''
html = replace_once(html, old_head, new_head, 'ranking table headings')

old_render = '''function renderPlayers(players){
  $('#tbody').innerHTML=players.map((player,index)=>`
    <tr>
      <td>${index+1}</td>
      <td>
        <a class="player-name player-profile-link" href="player.html?id=${encodeURIComponent(player.id)}">${escapeHTML(player.name)}</a>
        ${player.username
          ? `<span class="player-username">@${escapeHTML(player.username)}</span>`
          : ''
        }
      </td>
      <td>${escapeHTML(player.region)}</td>
      <td>${escapeHTML(player.city)}</td>
      <td>
        <span class="badge">
          ${CATEGORY[player.category]||'مفتوح'}
        </span>
      </td>
      <td class="rating">${player.rating}</td>
    </tr>
  `).join('');

  $('#results').textContent=players.length+' لاعب';
  $('#empty').style.display=players.length?'none':'block';
}'''
new_render = '''function renderPlayers(players){
  const topPlayers=players.slice(0,10);
  $('#tbody').innerHTML=topPlayers.map(player=>`
    <tr>
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
}'''
html = replace_once(html, old_render, new_render, 'ranking row renderer')

# Swap desktop columns: ranking is the left pane, hero copy is the right pane.
css = css.replace('.home-hero{grid-column:2;grid-row:2}', '.home-hero{grid-column:3;grid-row:2}')
css = css.replace('#ranking{grid-column:3;grid-row:2}', '#ranking{grid-column:2;grid-row:2}')

ranking_start = css.index('/* The existing ranking table becomes the hero\'s right panel. */')
ranking_end = css.index('/* Feature cards */', ranking_start)
new_ranking_css = '''/* Ranking panel: left side of the desktop hero, four clean columns. */
#ranking{
  grid-column:2;grid-row:2;
  align-self:start;
  width:100%!important;
  padding:24px 0 12px!important;
  background:transparent!important;
  border:0!important;
  direction:rtl;
}
#ranking>.wrap{width:100%!important;margin:0!important}
#ranking .head{
  margin:0!important;
  min-height:58px;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid var(--hero-cyan-line);
  border-bottom:0;
  border-radius:18px 18px 0 0;
  background:linear-gradient(145deg,rgba(8,62,64,.86),rgba(7,49,51,.8));
  box-shadow:0 13px 30px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.025);
}
#ranking .head>div:first-child{width:100%;text-align:center}
#rankingTitle{margin:0!important;color:var(--hero-gold)!important;font-size:0!important;line-height:1!important}
#rankingTitle::after{content:"ترتيب اللاعبين";font-size:20px;font-weight:900}
#ranking .filters{display:none!important}
#ranking .table-card{
  border:1px solid var(--hero-cyan-line)!important;
  border-top:1px solid rgba(216,182,101,.12)!important;
  border-radius:0 0 18px 18px!important;
  overflow:hidden!important;
  background:linear-gradient(145deg,rgba(8,62,64,.86),rgba(7,49,51,.8))!important;
  box-shadow:0 13px 30px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.025)!important;
}
#ranking .table-head{display:none!important}
#ranking .table-wrap{overflow:hidden!important}
#ranking table{width:100%!important;min-width:0!important;table-layout:fixed;direction:rtl;border-collapse:collapse}
#ranking th,#ranking td{
  height:47px;
  padding:7px 12px!important;
  border-bottom:1px solid rgba(216,182,101,.2)!important;
  color:var(--hero-cream)!important;
  background:transparent!important;
  vertical-align:middle;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
#ranking th{height:38px;color:#d9c58f!important;font-size:11px!important;font-weight:900}
#ranking td{font-size:12px!important}
#ranking tbody tr:hover{background:rgba(255,255,255,.035)!important}
#ranking tbody tr:last-child td{border-bottom:0!important}
#ranking th:nth-child(1),#ranking td:nth-child(1){width:42%;text-align:right!important}
#ranking th:nth-child(2),#ranking td:nth-child(2){width:24%;text-align:center!important}
#ranking th:nth-child(3),#ranking td:nth-child(3){width:20%;text-align:center!important}
#ranking th:nth-child(4),#ranking td:nth-child(4){width:14%;text-align:left!important}
#ranking .player-name{display:block;color:var(--hero-cream)!important;font-weight:900;overflow:hidden;text-overflow:ellipsis}
#ranking .player-username{display:none!important}
#ranking .rating{color:var(--hero-gold-2)!important;font-size:15px!important;font-weight:900!important}
#ranking #empty{display:none!important}

'''
css = css[:ranking_start] + new_ranking_css + css[ranking_end:]

# Remove obsolete mobile pseudo-avatar rules if any survived outside the ranking block.
for fragment in [
    '#ranking td:nth-child(2){padding-right:30px!important}\n',
    '#ranking td:nth-child(2)::before{right:4px;width:21px;height:21px;font-size:12px}\n',
    '#ranking td:nth-child(2){padding-right:28px!important}\n',
    '#ranking td:nth-child(2)::before{width:20px;height:20px}\n',
]:
    css = css.replace(fragment, '')

polish_css = '''

/* Unified header tiles and spacing 20260904 */
@media(min-width:901px){
  .home-header .nav{
    min-height:72px!important;
    grid-template-columns:minmax(220px,1fr) auto minmax(250px,1fr)!important;
    gap:16px!important;
  }
  .main-nav{height:auto!important;gap:7px!important}
  .header-tile{
    height:52px!important;
    min-height:52px!important;
    border:1px solid var(--hero-line)!important;
    border-radius:14px!important;
    background:rgba(255,255,255,.035)!important;
    color:var(--hero-cream)!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    gap:7px!important;
    padding:0 12px!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.02);
  }
  .main-nav .header-tile{min-width:96px}
  .main-nav .header-tile:hover,.main-nav .header-tile.active{
    color:var(--hero-gold)!important;
    border-color:rgba(216,182,101,.5)!important;
    background:rgba(216,182,101,.07)!important;
  }
  .main-nav .header-tile.active::after{display:none!important}
  .header-tile-icon{display:inline-grid;place-items:center;width:22px;height:22px;color:var(--hero-gold);font-size:16px;line-height:1}
  .header-member{gap:7px!important}
  .header-member-link.header-tile{min-width:180px!important;max-width:220px!important;justify-content:flex-start!important}
  .nav-user{gap:7px!important}
  .nav-user #siteNotificationHost{height:52px;display:inline-flex;align-items:center}
  .nav-user .site-notification-bell{width:52px!important;height:52px!important;border-radius:14px!important;border:1px solid var(--hero-line)!important}
  .nav-logout.header-tile{min-width:68px!important}
  .nav-account.header-tile{min-width:118px!important}
  .home-hero{padding:24px 0 12px!important}
}
'''
if '/* Unified header tiles and spacing 20260904 */' not in css:
    css += polish_css

INDEX.write_text(html, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
print('home header and ranking polish applied')
