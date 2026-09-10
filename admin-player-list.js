const STYLE_ID = 'admin-player-controls-style';
let scheduled = false;

function mountPlayerControlStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.player-control-grid{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:8px!important;
}
.player-control-grid .player-control-button{
  min-height:62px;
  padding:9px 10px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  text-align:center;
}
.player-control-icon{
  width:28px;
  height:28px;
  flex:0 0 28px;
  display:inline-grid;
  place-items:center;
  border:1px solid rgba(216,181,106,.26);
  border-radius:8px;
  background:rgba(216,181,106,.08);
  color:var(--gold2);
  font-size:17px;
  font-weight:900;
  line-height:1;
}
body.admin-pro-ready #playersView .player-table-scroll{
  max-height:min(64vh,680px);
  overflow:auto!important;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
  scrollbar-gutter:stable;
}
body.admin-pro-ready #playersView .player-table-scroll thead th{
  position:sticky!important;
  top:0;
  z-index:7;
  background:#07383e;
}
#playersView .player-row-number,
#playersView .player-row-number-header{
  text-align:center!important;
  font-variant-numeric:tabular-nums;
}
#playersView .player-row-number{
  color:var(--muted);
  font-weight:800;
}
@media(max-width:760px){
  .player-control-grid{grid-template-columns:1fr 1fr}
  .player-control-grid .player-control-button{
    min-height:58px;
    padding:8px;
    font-size:12px;
  }
  body.admin-pro-ready #playersView .player-table-scroll{
    max-height:60vh;
    overflow:auto!important;
    border-radius:12px;
  }
  body.admin-pro-ready #playersView .player-table-scroll table{
    width:100%!important;
    table-layout:fixed;
  }
  body.admin-pro-ready #playersView .player-table-scroll th:nth-child(1),
  body.admin-pro-ready #playersView .player-table-scroll td:nth-child(1){width:8%!important}
  body.admin-pro-ready #playersView .player-table-scroll th:nth-child(2),
  body.admin-pro-ready #playersView .player-table-scroll td:nth-child(2){width:30%!important}
  body.admin-pro-ready #playersView .player-table-scroll th:nth-child(3),
  body.admin-pro-ready #playersView .player-table-scroll td:nth-child(3){width:18%!important}
  body.admin-pro-ready #playersView .player-table-scroll th:nth-child(4),
  body.admin-pro-ready #playersView .player-table-scroll td:nth-child(4){width:26%!important}
  body.admin-pro-ready #playersView .player-table-scroll th:nth-child(6),
  body.admin-pro-ready #playersView .player-table-scroll td:nth-child(6){width:18%!important}
}
@media(max-width:420px){
  .player-control-grid{grid-template-columns:1fr}
  body.admin-pro-ready #playersView .player-table-scroll th,
  body.admin-pro-ready #playersView .player-table-scroll td{padding-inline:3px!important}
}
`;
  document.head.appendChild(style);
}

function ensurePlayerNumberHeader(table) {
  const headerRow = table?.querySelector('thead tr');
  if (!headerRow) return;
  let header = headerRow.querySelector('.player-row-number-header');
  if (header) return;
  header = document.createElement('th');
  header.className = 'player-row-number-header';
  header.scope = 'col';
  header.textContent = 'م';
  headerRow.prepend(header);
}

function numberPlayerRows() {
  const body = document.getElementById('playersTableBody');
  const table = body?.closest('table');
  const wrap = table?.closest('.table-wrap');
  if (!body || !table || !wrap) return;

  wrap.classList.add('player-table-scroll');
  ensurePlayerNumberHeader(table);
  const columnCount = table.querySelectorAll('thead th').length;
  let number = 0;

  body.querySelectorAll(':scope > tr').forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.tagName === 'TD');
    if (cells.length === 1 && Number(cells[0].getAttribute('colspan') || 1) > 1) {
      if (cells[0].colSpan !== columnCount) cells[0].colSpan = columnCount;
      return;
    }

    number += 1;
    let numberCell = row.querySelector(':scope > .player-row-number');
    if (!numberCell) {
      numberCell = document.createElement('td');
      numberCell.className = 'player-row-number';
      row.prepend(numberCell);
    }
    const value = String(number);
    if (numberCell.textContent !== value) numberCell.textContent = value;
  });
}

function decoratePlayerControls() {
  const body = document.getElementById('playerModalBody');
  const actions = body?.querySelector('.action-row');
  if (!actions) return;
  actions.classList.add('player-control-grid');

  const icons = {
    editPlayer: '✎',
    ban: '⊘',
    unban: '✓',
    deletePlayer: '×'
  };

  actions.querySelectorAll('button[data-action]').forEach((button) => {
    if (button.querySelector('.player-control-icon')) return;
    const text = button.textContent.trim();
    const icon = icons[button.dataset.action] || '•';
    button.classList.add('player-control-button');
    button.textContent = '';

    const iconNode = document.createElement('span');
    iconNode.className = 'player-control-icon';
    iconNode.setAttribute('aria-hidden', 'true');
    iconNode.textContent = icon;

    const label = document.createElement('span');
    label.textContent = text;
    button.append(iconNode, label);
  });
}

function enhancePlayerUi() {
  numberPlayerRows();
  decoratePlayerControls();
}

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhancePlayerUi();
  });
}

function startPlayerControlEnhancement() {
  mountPlayerControlStyles();
  enhancePlayerUi();

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length || mutation.removedNodes.length)) scheduleEnhancement();
  });
  observer.observe(document.body, { childList:true, subtree:true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPlayerControlEnhancement, { once:true });
} else {
  startPlayerControlEnhancement();
}

export { numberPlayerRows };
