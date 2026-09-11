const STYLE_ID = 'admin-responsive-tables-style';
let scheduled = false;

const COMPACT_TABLES = {
  playersTableBody: { visible:[0,1,2,3,5], openSelector:'[data-player]' },
  gamesTableBody: { visible:[0,1,2,4], openSelector:'[data-game]' },
  computerGamesTableBody: { visible:[0,1,2,4], openSelector:'a[href*="computer-watch.html"]' },
  unifiedGamesTableBody: { visible:[0,1,2,3], openSelector:'[data-game],a[href*="computer-watch.html"]' },
  reportsTableBody: { visible:[0,1,2,4], openSelector:'[data-report]' },
  actionsTableBody: { visible:[0,1,6,7] },
  moderatorsTableBody: { visible:[0,1,3,5] },
  tournamentsTableBody: { visible:[0,1,4,5], openSelector:'[data-action="editTournament"]' }
};

function mountResponsiveTableStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
@media(max-width:760px){
  body.admin-pro-ready .table-wrap{
    overflow:hidden;
    border:1px solid var(--pro-line-soft);
    border-radius:12px;
    background:rgba(4,45,50,.68);
    box-shadow:none;
  }
  body.admin-pro-ready .table-wrap table{
    display:table;
    width:100%;
    min-width:0;
    border-collapse:collapse;
    table-layout:fixed;
  }
  body.admin-pro-ready .table-wrap thead{display:table-header-group}
  body.admin-pro-ready .table-wrap tbody{display:table-row-group;width:auto}
  body.admin-pro-ready .table-wrap tbody tr.compact-admin-row{
    display:table-row;
    width:auto;
    border:0;
    border-radius:0;
    background:transparent;
    box-shadow:none;
  }
  body.admin-pro-ready .table-wrap tbody tr.compact-admin-row[data-row-open]{cursor:pointer}
  body.admin-pro-ready .table-wrap tbody tr.compact-admin-row[data-row-open]:hover{background:rgba(221,185,109,.045)}
  body.admin-pro-ready .table-wrap tbody tr.compact-admin-row[data-row-open]:focus-visible{
    outline:2px solid var(--pro-gold-2);
    outline-offset:-2px;
  }
  body.admin-pro-ready .table-wrap th,
  body.admin-pro-ready .table-wrap tbody td{
    display:table-cell;
    min-width:0;
    padding:10px 6px;
    border:0;
    border-bottom:1px solid var(--pro-line-soft);
    text-align:center!important;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    vertical-align:middle;
    font-size:12px;
  }
  body.admin-pro-ready .table-wrap thead th{
    position:static;
    padding-top:9px;
    padding-bottom:9px;
    background:#07383e;
    color:var(--pro-gold-2);
    font-size:10px;
  }
  body.admin-pro-ready .table-wrap .compact-admin-hidden{display:none!important}
  body.admin-pro-ready .table-wrap .compact-col-1{width:34%}
  body.admin-pro-ready .table-wrap .compact-col-2{width:22%}
  body.admin-pro-ready .table-wrap .compact-col-3{width:22%}
  body.admin-pro-ready .table-wrap .compact-col-4{width:22%}
  body.admin-pro-ready .table-wrap tbody td::before{display:none!important;content:none!important}
  body.admin-pro-ready .table-wrap tbody td > *,
  body.admin-pro-ready .table-wrap tbody td .link-btn{
    max-width:100%;
    margin-inline:auto;
    text-align:center!important;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  body.admin-pro-ready .table-wrap [data-action="removeModerator"]{color:#ffaaaa!important}
  body.admin-pro-ready .table-wrap .status-pill{
    max-width:100%;
    justify-content:center;
    padding:4px 7px;
    font-size:9px;
  }
  body.admin-pro-ready .table-wrap tbody td.empty{
    display:table-cell;
    width:auto;
    padding:22px 10px;
    text-align:center!important;
    white-space:normal;
  }
  body.admin-pro-ready.admin-compact .table-wrap th,
  body.admin-pro-ready.admin-compact .table-wrap td{padding:8px 5px}
}
@media(max-width:420px){
  body.admin-pro-ready .table-wrap th,
  body.admin-pro-ready .table-wrap tbody td{
    padding:9px 4px;
    font-size:11px;
  }
  body.admin-pro-ready .table-wrap thead th{font-size:9px}
  body.admin-pro-ready .table-wrap .status-pill{padding:3px 5px;font-size:8px}
}`;
  document.head.appendChild(style);
}

function clearCompactClasses(element) {
  [...element.classList].forEach((name) => {
    if (name === 'compact-admin-hidden' || name.startsWith('compact-col-')) element.classList.remove(name);
  });
}

function compactTable(tbody, config) {
  const table = tbody.closest('table');
  if (!table) return;
  const visible = new Set(config.visible);
  const headers = [...table.querySelectorAll('thead th')];
  let visibleOrder = 0;

  headers.forEach((header, index) => {
    clearCompactClasses(header);
    if (!visible.has(index)) {
      header.classList.add('compact-admin-hidden');
      return;
    }
    visibleOrder += 1;
    header.classList.add(`compact-col-${visibleOrder}`);
  });

  tbody.querySelectorAll('tr').forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.tagName === 'TD');
    if (cells.length === 1 && Number(cells[0].getAttribute('colspan') || 1) > 1) {
      row.classList.add('compact-admin-row');
      row.removeAttribute('data-row-open');
      row.removeAttribute('tabindex');
      row.removeAttribute('role');
      clearCompactClasses(cells[0]);
      return;
    }

    row.classList.add('compact-admin-row');
    visibleOrder = 0;
    cells.forEach((cell, index) => {
      clearCompactClasses(cell);
      if (!visible.has(index)) {
        cell.classList.add('compact-admin-hidden');
        return;
      }
      visibleOrder += 1;
      cell.classList.add(`compact-col-${visibleOrder}`);
    });

    if (tbody.id === 'moderatorsTableBody') {
      const button = row.querySelector('[data-action="removeModerator"]');
      if (button) {
        button.textContent = 'حذف';
        button.setAttribute('aria-label', 'حذف المشرف');
      }
    }

    const trigger = config.openSelector ? row.querySelector(config.openSelector) : null;
    if (trigger) {
      row.setAttribute('data-row-open', tbody.id);
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      const name = cells[0]?.textContent?.trim() || 'التفاصيل';
      row.setAttribute('aria-label', `فتح ${name}`);
    } else {
      row.removeAttribute('data-row-open');
      row.removeAttribute('tabindex');
      row.removeAttribute('role');
    }
  });
}

function enhanceResponsiveTables(root = document) {
  Object.entries(COMPACT_TABLES).forEach(([tbodyId, config]) => {
    const tbody = root.getElementById?.(tbodyId) || document.getElementById(tbodyId);
    if (tbody) compactTable(tbody, config);
  });
}

function rowTrigger(row) {
  const tbody = row?.closest('tbody');
  const config = tbody ? COMPACT_TABLES[tbody.id] : null;
  return config?.openSelector ? row.querySelector(config.openSelector) : null;
}

function activateCompactRow(row) {
  const trigger = rowTrigger(row);
  if (!trigger) return;
  trigger.click();
}

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhanceResponsiveTables(document);
  });
}

function startResponsiveAdminTables() {
  mountResponsiveTableStyles();
  enhanceResponsiveTables(document);

  document.addEventListener('click', (event) => {
    const row = event.target.closest?.('tr.compact-admin-row[data-row-open]');
    if (!row) return;
    if (event.target.closest('button,a,input,select,textarea,label')) return;
    activateCompactRow(row);
  });

  document.addEventListener('keydown', (event) => {
    const row = event.target.closest?.('tr.compact-admin-row[data-row-open]');
    if (!row || event.target !== row || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    activateCompactRow(row);
  });

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length || mutation.removedNodes.length)) scheduleEnhancement();
  });
  observer.observe(document.body, { childList:true, subtree:true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startResponsiveAdminTables, { once:true });
} else {
  startResponsiveAdminTables();
}

export { COMPACT_TABLES, enhanceResponsiveTables };
