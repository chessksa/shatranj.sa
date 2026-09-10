import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const STYLE_ID = 'admin-unified-games-style';
const cfg = window.SHATRANJ_CONFIG?.supabase || {};
const supabase = cfg.enabled && cfg.url && cfg.anonKey ? createClient(cfg.url, cfg.anonKey) : null;
let loading = false;

function mountStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #gamesView .unified-games-source,
    #gamesView .unified-games-source-title{display:none!important}

    body.admin-pro-ready #gamesView .unified-games-wrap{
      max-height:min(64vh,680px);
      overflow:auto!important;
      overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;
      scrollbar-gutter:stable;
      border-radius:14px;
    }
    body.admin-pro-ready #gamesView .unified-games-wrap table{
      width:100%;
      min-width:0!important;
      table-layout:fixed;
    }
    body.admin-pro-ready #gamesView .unified-games-wrap thead th{
      position:sticky;
      top:0;
      z-index:5;
      text-align:center!important;
      padding:11px 8px;
      background:#07383e;
    }
    body.admin-pro-ready #gamesView .unified-games-wrap th:not(:first-child),
    body.admin-pro-ready #gamesView .unified-games-wrap td:not(:first-child){
      border-inline-start:1px solid rgba(216,181,106,.34);
    }
    body.admin-pro-ready #gamesView .unified-games-wrap th:nth-child(1),
    body.admin-pro-ready #gamesView .unified-games-wrap td:nth-child(1){width:48px}
    body.admin-pro-ready #gamesView .unified-games-wrap th:nth-child(3),
    body.admin-pro-ready #gamesView .unified-games-wrap td:nth-child(3){width:86px}
    body.admin-pro-ready #gamesView .unified-games-wrap th:nth-child(4),
    body.admin-pro-ready #gamesView .unified-games-wrap td:nth-child(4){width:104px}
    body.admin-pro-ready #gamesView .unified-games-wrap tbody td{
      text-align:center!important;
      vertical-align:middle;
      padding:12px 8px;
    }
    body.admin-pro-ready #gamesView .unified-games-wrap tbody tr:nth-child(even){
      background:rgba(255,255,255,.018);
    }
    body.admin-pro-ready #gamesView .unified-games-wrap tbody tr[data-row-open]{cursor:pointer}
    body.admin-pro-ready #gamesView .unified-games-wrap tbody tr[data-row-open]:hover{
      background:rgba(221,185,109,.055);
    }
    #gamesView .unified-row-number{
      color:var(--text);
      font-weight:800;
      font-variant-numeric:tabular-nums;
      direction:ltr;
      unicode-bidi:isolate;
      white-space:nowrap;
    }
    #gamesView .unified-player-pair{
      font-weight:800;
      white-space:normal!important;
      line-height:1.5;
      overflow:visible!important;
      text-overflow:clip!important;
    }
    #gamesView .unified-player-pair .versus{
      display:inline-block;
      color:var(--gold2);
      font-weight:900;
      padding-inline:3px;
    }
    #gamesView .unified-time-cell{
      white-space:nowrap!important;
      overflow:visible!important;
      text-overflow:clip!important;
    }
    #gamesView .unified-time{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:4px;
      direction:ltr;
      unicode-bidi:isolate;
      white-space:nowrap;
      font-variant-numeric:tabular-nums;
      line-height:1;
      min-width:42px;
    }
    #gamesView .unified-time-value,
    #gamesView .unified-time-unit{
      display:inline-block;
      line-height:1;
      font-size:12px;
    }
    #gamesView .unified-time-value{font-weight:900;color:var(--text)}
    #gamesView .unified-time-unit{font-weight:700;color:var(--muted)}
    #gamesView .unified-hidden-trigger{display:none!important}

    @media(max-width:760px){
      body.admin-pro-ready #gamesView .unified-games-wrap{
        max-height:60vh;
        overflow:auto!important;
        border-radius:12px;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap table,
      body.admin-pro-ready #gamesView .unified-games-wrap thead,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody{
        display:block!important;
        width:100%!important;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead{
        position:sticky;
        top:0;
        z-index:6;
        background:#07383e;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead tr,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody tr.compact-admin-row{
        display:grid!important;
        grid-template-columns:42px minmax(0,1fr) 72px 82px;
        width:100%!important;
        align-items:stretch;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead th,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td{
        display:flex!important;
        align-items:center;
        justify-content:center;
        width:auto!important;
        min-width:0;
        padding:10px 5px;
        text-align:center!important;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead th{
        position:static!important;
        font-size:10px;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td.unified-player-pair{
        white-space:normal!important;
        overflow:visible!important;
        font-size:11.5px;
        line-height:1.45;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td.unified-time-cell{
        overflow:visible!important;
        white-space:nowrap!important;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap .status-pill{
        padding:4px 6px;
        font-size:9px;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td.empty{
        display:flex!important;
        grid-column:1/-1;
        width:100%!important;
        padding:24px 10px;
        white-space:normal;
      }
    }

    @media(max-width:420px){
      body.admin-pro-ready #gamesView .unified-games-wrap thead tr,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody tr.compact-admin-row{
        grid-template-columns:40px minmax(0,1fr) 68px 78px;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead th,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td{padding:9px 4px}
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td.unified-player-pair{font-size:11px}
      #gamesView .unified-time-value,
      #gamesView .unified-time-unit{font-size:11px}
    }
  `;
  document.head.appendChild(style);
}

function cellWithText(text, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function rowNumberCell() {
  return cellWithText('', 'unified-row-number');
}

function pairCell(left, right) {
  const cell = document.createElement('td');
  cell.className = 'unified-player-pair';
  const first = document.createElement('span');
  first.textContent = left || '—';
  const versus = document.createElement('span');
  versus.className = 'versus';
  versus.textContent = ' × ';
  const second = document.createElement('span');
  second.textContent = right || '—';
  cell.append(first, versus, second);
  return cell;
}

function timeCell(value) {
  const cell = document.createElement('td');
  cell.className = 'unified-time-cell';
  if (value === null || value === undefined || value === '') {
    cell.textContent = '—';
    return cell;
  }

  const time = document.createElement('span');
  time.className = 'unified-time';
  const number = document.createElement('span');
  number.className = 'unified-time-value';
  number.textContent = String(value);
  const unit = document.createElement('span');
  unit.className = 'unified-time-unit';
  unit.textContent = 'د';
  time.append(number, unit);
  cell.appendChild(time);
  return cell;
}

function statusCell(status) {
  const cell = document.createElement('td');
  const labels = {
    active: 'نشطة',
    waiting: 'انتظار',
    finished: 'منتهية',
    abandoned: 'متروكة',
  };
  const cls = status === 'active' ? 'status-active' : status === 'waiting' ? 'status-waiting' : 'status-finished';
  const pill = document.createElement('span');
  pill.className = `status-pill ${cls}`;
  pill.textContent = labels[status] || status || '—';
  cell.appendChild(pill);
  return cell;
}

function hiddenTrigger(game) {
  if (game.kind === 'computer') {
    const link = document.createElement('a');
    link.className = 'unified-hidden-trigger';
    link.href = `computer-watch.html?game=${encodeURIComponent(game.id)}`;
    link.tabIndex = -1;
    link.setAttribute('aria-hidden', 'true');
    link.textContent = 'متابعة';
    return link;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'unified-hidden-trigger';
  button.dataset.game = game.id;
  button.tabIndex = -1;
  button.setAttribute('aria-hidden', 'true');
  button.textContent = 'تفاصيل';
  return button;
}

function unifiedRow(game) {
  const row = document.createElement('tr');
  row.dataset.unifiedGameKind = game.kind;
  row.dataset.createdAt = game.createdAt || '';
  const players = pairCell(game.left, game.right);
  players.appendChild(hiddenTrigger(game));
  row.append(
    rowNumberCell(),
    players,
    timeCell(game.timeControl),
    statusCell(game.status),
  );
  return row;
}

function numberUnifiedRows(body) {
  body.querySelectorAll('tr[data-unified-game-kind]').forEach((row, index) => {
    const cell = row.querySelector('.unified-row-number');
    if (cell) cell.textContent = String(index + 1);
  });
}

function sortUnifiedGames(games) {
  return [...games].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function createUnifiedTable(humanWrap) {
  let wrap = document.getElementById('unifiedGamesTable');
  if (wrap) return wrap;

  wrap = document.createElement('div');
  wrap.id = 'unifiedGamesTable';
  wrap.className = 'table-wrap unified-games-wrap';
  wrap.innerHTML = `
    <table aria-label="جميع المباريات">
      <thead><tr>
        <th>م</th>
        <th>اللاعبين</th>
        <th>الزمن</th>
        <th>الحالة</th>
      </tr></thead>
      <tbody id="unifiedGamesTableBody"></tbody>
    </table>`;
  humanWrap.insertAdjacentElement('beforebegin', wrap);
  return wrap;
}

async function fetchHumanGames(status) {
  const { data, error } = await supabase.rpc('admin_list_games_v2', { p_status: status || null });
  if (error) throw error;
  return (data || []).map((game) => ({
    kind: 'human',
    id: game.game_id,
    left: game.white_name || '—',
    right: game.black_name || '—',
    timeControl: game.time_control_minutes,
    status: game.status,
    createdAt: game.created_at,
  }));
}

async function fetchComputerGames(status) {
  if (status === 'waiting') return [];

  let query = supabase
    .from('computer_games')
    .select('id,player_id,status,time_control_minutes,created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status === 'active' || status === 'finished') query = query.eq('status', status);

  const { data: games, error } = await query;
  if (error) throw error;
  const rows = games || [];
  const playerIds = new Set(rows.map((game) => game.player_id).filter(Boolean));
  const players = new Map();

  if (playerIds.size) {
    const { data: playerRows, error: playerError } = await supabase.rpc('admin_list_players_v3', {
      p_search: null,
      p_status: null,
      p_country: null,
      p_city: null,
    });
    if (playerError) throw playerError;
    (playerRows || []).forEach((player) => {
      if (playerIds.has(player.id)) players.set(player.id, player);
    });
  }

  return rows.map((game) => ({
    kind: 'computer',
    id: game.id,
    left: players.get(game.player_id)?.name || 'عضو غير معروف',
    right: 'الكمبيوتر',
    timeControl: game.time_control_minutes,
    status: game.status,
    createdAt: game.created_at,
  }));
}

async function rebuildUnifiedGames() {
  const target = document.getElementById('unifiedGamesTableBody');
  if (!target || !supabase || loading) return;

  loading = true;
  try {
    const status = document.getElementById('gameStatusFilter')?.value || '';
    const [humanGames, computerGames] = await Promise.all([
      fetchHumanGames(status),
      fetchComputerGames(status),
    ]);
    const games = sortUnifiedGames([...humanGames, ...computerGames]);
    const fragment = document.createDocumentFragment();

    games.forEach((game) => fragment.appendChild(unifiedRow(game)));
    target.replaceChildren(fragment);
    numberUnifiedRows(target);

    if (!games.length) {
      const row = document.createElement('tr');
      const cell = cellWithText('لا توجد مباريات ضمن الفلتر الحالي', 'empty');
      cell.colSpan = 4;
      row.appendChild(cell);
      target.appendChild(row);
    }
  } catch (error) {
    console.error('تعذر تحميل جدول المباريات الموحد', error);
    const row = document.createElement('tr');
    const cell = cellWithText('تعذر تحميل المباريات.', 'empty');
    cell.colSpan = 4;
    row.appendChild(cell);
    target.replaceChildren(row);
  } finally {
    loading = false;
  }
}

function startUnifiedGames() {
  const view = document.getElementById('gamesView');
  const humanBody = document.getElementById('gamesTableBody');
  const computerBody = document.getElementById('computerGamesTableBody');
  if (!view || !humanBody || !computerBody) {
    setTimeout(startUnifiedGames, 120);
    return;
  }

  mountStyles();
  const humanWrap = humanBody.closest('.table-wrap');
  const computerWrap = computerBody.closest('.table-wrap');
  if (!humanWrap || !computerWrap) return;

  humanWrap.classList.add('unified-games-source');
  computerWrap.classList.add('unified-games-source');
  const computerTitle = [...view.querySelectorAll('.section-title')]
    .find((element) => element.textContent.includes('مباريات ضد الكمبيوتر'));
  computerTitle?.classList.add('unified-games-source-title');

  createUnifiedTable(humanWrap);
  rebuildUnifiedGames();

  document.getElementById('gameStatusFilter')?.addEventListener('change', rebuildUnifiedGames);
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    if (view.classList.contains('active')) rebuildUnifiedGames();
  });
  setInterval(() => {
    if (view.classList.contains('active')) rebuildUnifiedGames();
  }, 5000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startUnifiedGames, { once:true });
} else {
  startUnifiedGames();
}

export { rebuildUnifiedGames, numberUnifiedRows, sortUnifiedGames, timeCell };
