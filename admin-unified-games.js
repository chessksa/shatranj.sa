const STYLE_ID = 'admin-unified-games-style';
let rebuildTimer = 0;

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
    body.admin-pro-ready #gamesView .unified-games-wrap th:nth-child(1),
    body.admin-pro-ready #gamesView .unified-games-wrap td:nth-child(1){width:52px}
    body.admin-pro-ready #gamesView .unified-games-wrap th:nth-child(3),
    body.admin-pro-ready #gamesView .unified-games-wrap td:nth-child(3){width:92px}
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
      color:var(--muted);
      font-weight:800;
      font-variant-numeric:tabular-nums;
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
        grid-template-columns:38px minmax(0,1fr) 64px 76px;
        width:100%!important;
        align-items:center;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead th,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td{
        display:block!important;
        width:auto!important;
        min-width:0;
        padding:10px 4px;
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
      body.admin-pro-ready #gamesView .unified-games-wrap .status-pill{
        padding:4px 6px;
        font-size:9px;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td.empty{
        display:block!important;
        grid-column:1/-1;
        width:100%!important;
        padding:24px 10px;
        white-space:normal;
      }
    }

    @media(max-width:420px){
      body.admin-pro-ready #gamesView .unified-games-wrap thead tr,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody tr.compact-admin-row{
        grid-template-columns:34px minmax(0,1fr) 58px 70px;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead th,
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td{padding:9px 3px}
      body.admin-pro-ready #gamesView .unified-games-wrap tbody td.unified-player-pair{font-size:11px}
    }
  `;
  document.head.appendChild(style);
}

function textOf(cell) {
  return String(cell?.textContent || '').replace(/\s+/g, ' ').trim();
}

function playerNameOfComputerRow(cell) {
  return String(cell?.querySelector('strong')?.textContent || textOf(cell) || '—').trim();
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

function cloneCell(cell) {
  return cell ? cell.cloneNode(true) : cellWithText('—');
}

function isDataRow(row, minimumCells) {
  const cells = [...row.children].filter((cell) => cell.tagName === 'TD');
  if (cells.length < minimumCells) return false;
  if (cells.length === 1 && Number(cells[0].getAttribute('colspan') || 1) > 1) return false;
  return true;
}

function preserveRowTrigger(sourceRow, playerCell) {
  const trigger = sourceRow.querySelector('[data-game],a[href*="computer-watch.html"]');
  if (!trigger) return;
  const clone = trigger.cloneNode(true);
  clone.classList.add('unified-hidden-trigger');
  clone.tabIndex = -1;
  clone.setAttribute('aria-hidden', 'true');
  playerCell.appendChild(clone);
}

function humanUnifiedRow(sourceRow) {
  if (!isDataRow(sourceRow, 8)) return null;
  const cells = [...sourceRow.children];
  const row = document.createElement('tr');
  row.dataset.unifiedGameKind = 'human';
  const players = pairCell(textOf(cells[1]), textOf(cells[2]));
  preserveRowTrigger(sourceRow, players);
  row.append(
    rowNumberCell(),
    players,
    cloneCell(cells[3]),
    cloneCell(cells[4]),
  );
  return row;
}

function computerUnifiedRow(sourceRow) {
  if (!isDataRow(sourceRow, 8)) return null;
  const cells = [...sourceRow.children];
  const row = document.createElement('tr');
  row.dataset.unifiedGameKind = 'computer';
  const players = pairCell(playerNameOfComputerRow(cells[1]), 'الكمبيوتر');
  preserveRowTrigger(sourceRow, players);
  row.append(
    rowNumberCell(),
    players,
    cloneCell(cells[3]),
    cloneCell(cells[4]),
  );
  return row;
}

function numberUnifiedRows(body) {
  body.querySelectorAll('tr[data-unified-game-kind]').forEach((row, index) => {
    const cell = row.querySelector('.unified-row-number');
    if (cell) cell.textContent = String(index + 1);
  });
}

function createUnifiedTable(view, humanWrap) {
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

function rebuildUnifiedGames() {
  const humanBody = document.getElementById('gamesTableBody');
  const computerBody = document.getElementById('computerGamesTableBody');
  const target = document.getElementById('unifiedGamesTableBody');
  if (!humanBody || !computerBody || !target) return;

  const fragment = document.createDocumentFragment();
  let count = 0;

  humanBody.querySelectorAll('tr').forEach((sourceRow) => {
    const row = humanUnifiedRow(sourceRow);
    if (!row) return;
    fragment.appendChild(row);
    count += 1;
  });

  computerBody.querySelectorAll('tr').forEach((sourceRow) => {
    const row = computerUnifiedRow(sourceRow);
    if (!row) return;
    fragment.appendChild(row);
    count += 1;
  });

  target.replaceChildren(fragment);
  numberUnifiedRows(target);

  if (!count) {
    const row = document.createElement('tr');
    const cell = cellWithText('لا توجد مباريات ضمن الفلتر الحالي', 'empty');
    cell.colSpan = 4;
    row.appendChild(cell);
    target.appendChild(row);
  }
}

function scheduleRebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(rebuildUnifiedGames, 30);
}

function startUnifiedGames() {
  const view = document.getElementById('gamesView');
  const humanBody = document.getElementById('gamesTableBody');
  const computerBody = document.getElementById('computerGamesTableBody');
  if (!view || !humanBody || !computerBody) return;

  mountStyles();
  const humanWrap = humanBody.closest('.table-wrap');
  const computerWrap = computerBody.closest('.table-wrap');
  if (!humanWrap || !computerWrap) return;

  humanWrap.classList.add('unified-games-source');
  computerWrap.classList.add('unified-games-source');
  const computerTitle = [...view.querySelectorAll('.section-title')]
    .find((element) => element.textContent.includes('مباريات ضد الكمبيوتر'));
  computerTitle?.classList.add('unified-games-source-title');

  createUnifiedTable(view, humanWrap);
  rebuildUnifiedGames();

  const observer = new MutationObserver(scheduleRebuild);
  observer.observe(humanBody, { childList:true, subtree:true });
  observer.observe(computerBody, { childList:true, subtree:true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startUnifiedGames, { once:true });
} else {
  startUnifiedGames();
}

export { rebuildUnifiedGames, numberUnifiedRows };
