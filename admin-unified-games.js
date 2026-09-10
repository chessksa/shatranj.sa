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
      max-height:min(62vh,620px);
      overflow:auto!important;
      overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;
    }
    body.admin-pro-ready #gamesView .unified-games-wrap thead th{
      position:sticky;
      top:0;
      z-index:4;
    }
    #gamesView .unified-player-pair{
      font-weight:800;
      white-space:normal;
      line-height:1.45;
    }
    #gamesView .unified-player-pair .versus{
      display:inline-block;
      color:var(--gold2);
      font-weight:900;
    }
    @media(max-width:760px){
      body.admin-pro-ready #gamesView .unified-games-wrap{
        max-height:58vh;
        overflow:auto!important;
      }
      body.admin-pro-ready #gamesView .unified-games-wrap thead th{
        position:sticky!important;
        top:0;
      }
      #gamesView .unified-player-pair{font-size:11px}
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

function humanUnifiedRow(sourceRow) {
  if (!isDataRow(sourceRow, 8)) return null;
  const cells = [...sourceRow.children];
  const row = document.createElement('tr');
  row.dataset.unifiedGameKind = 'human';
  row.append(
    cloneCell(cells[0]),
    pairCell(textOf(cells[1]), textOf(cells[2])),
    cloneCell(cells[3]),
    cloneCell(cells[4]),
    cloneCell(cells[5]),
    cloneCell(cells[6]),
    cloneCell(cells[7]),
  );
  return row;
}

function computerUnifiedRow(sourceRow) {
  if (!isDataRow(sourceRow, 8)) return null;
  const cells = [...sourceRow.children];
  const row = document.createElement('tr');
  row.dataset.unifiedGameKind = 'computer';
  row.append(
    cloneCell(cells[0]),
    pairCell(playerNameOfComputerRow(cells[1]), 'الكمبيوتر'),
    cloneCell(cells[3]),
    cloneCell(cells[4]),
    cloneCell(cells[5]),
    cloneCell(cells[6]),
    cloneCell(cells[7]),
  );
  return row;
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
        <th>الرمز</th>
        <th>اللاعبين</th>
        <th>الزمن</th>
        <th>الحالة</th>
        <th>النتيجة</th>
        <th>البداية</th>
        <th></th>
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
  if (!count) {
    const row = document.createElement('tr');
    const cell = cellWithText('لا توجد مباريات ضمن الفلتر الحالي', 'empty');
    cell.colSpan = 7;
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

export { rebuildUnifiedGames };
