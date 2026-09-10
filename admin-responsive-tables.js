const STYLE_ID = 'admin-responsive-tables-style';
let scheduled = false;

function mountResponsiveTableStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
@media(max-width:760px){
  body.admin-pro-ready .table-wrap{
    overflow:visible;
    border:0;
    background:transparent;
    box-shadow:none;
  }
  body.admin-pro-ready .table-wrap table{
    display:block;
    width:100%;
    min-width:0;
    border-collapse:separate;
  }
  body.admin-pro-ready .table-wrap thead{
    display:none;
  }
  body.admin-pro-ready .table-wrap tbody{
    display:grid;
    width:100%;
    gap:10px;
  }
  body.admin-pro-ready .table-wrap tbody tr{
    display:block;
    width:100%;
    overflow:hidden;
    border:1px solid var(--pro-line-soft);
    border-radius:13px;
    background:rgba(4,45,50,.78);
    box-shadow:0 7px 18px rgba(0,18,21,.12);
  }
  body.admin-pro-ready .table-wrap tbody tr:hover{
    background:rgba(4,45,50,.78);
  }
  body.admin-pro-ready .table-wrap tbody td{
    display:grid;
    grid-template-columns:minmax(88px,34%) minmax(0,1fr);
    align-items:center;
    gap:10px;
    width:100%;
    min-width:0;
    padding:10px 12px;
    border:0;
    border-bottom:1px solid var(--pro-line-soft);
    text-align:right;
    overflow-wrap:anywhere;
  }
  body.admin-pro-ready .table-wrap tbody td:last-child{
    border-bottom:0;
  }
  body.admin-pro-ready .table-wrap tbody td::before{
    content:attr(data-label);
    color:var(--pro-gold-2);
    font-size:11px;
    font-weight:900;
    line-height:1.45;
  }
  body.admin-pro-ready .table-wrap tbody td > *{
    min-width:0;
    max-width:100%;
  }
  body.admin-pro-ready .table-wrap tbody td .table-actions,
  body.admin-pro-ready .table-wrap tbody td .action-row{
    justify-content:flex-start;
  }
  body.admin-pro-ready .table-wrap tbody td.empty{
    display:block;
    padding:22px 12px;
    text-align:center;
  }
  body.admin-pro-ready .table-wrap tbody td.empty::before{
    display:none;
  }
  body.admin-pro-ready.admin-compact .table-wrap tbody td{
    padding:8px 10px;
  }
}
@media(max-width:420px){
  body.admin-pro-ready .table-wrap tbody td{
    grid-template-columns:minmax(78px,32%) minmax(0,1fr);
    gap:8px;
    padding:9px 10px;
    font-size:12px;
  }
  body.admin-pro-ready .table-wrap tbody td::before{
    font-size:10px;
  }
}`;
  document.head.appendChild(style);
}

function labelTable(table) {
  if (!(table instanceof HTMLTableElement)) return;
  const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
  if (!headers.length) return;

  table.querySelectorAll('tbody tr').forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.tagName === 'TD');
    if (cells.length === 1 && Number(cells[0].getAttribute('colspan') || 1) > 1) return;
    cells.forEach((cell, index) => {
      const header = headers[index] || '';
      const fallback = index === cells.length - 1 ? 'الإجراء' : 'التفاصيل';
      cell.setAttribute('data-label', header || fallback);
    });
  });
}

function enhanceResponsiveTables(root = document) {
  const tables = root.matches?.('.table-wrap table')
    ? [root]
    : [...root.querySelectorAll?.('.table-wrap table') || []];
  tables.forEach(labelTable);
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

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length || mutation.removedNodes.length)) {
      scheduleEnhancement();
    }
  });
  observer.observe(document.body, { childList:true, subtree:true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startResponsiveAdminTables, { once:true });
} else {
  startResponsiveAdminTables();
}

export { enhanceResponsiveTables };
