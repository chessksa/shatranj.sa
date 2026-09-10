const STYLE_ID = 'admin-player-list-style';
let scheduled = false;

function mountPlayerListStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
body.admin-pro-ready #playersView .table-wrap tbody tr.player-list-row{
  cursor:pointer;
}
body.admin-pro-ready #playersView .table-wrap tbody tr.player-list-row:focus-visible{
  outline:2px solid var(--pro-gold-2);
  outline-offset:-2px;
}
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
@media(max-width:760px){
  body.admin-pro-ready #playersView .table-wrap{
    overflow:hidden;
    border:1px solid var(--pro-line-soft);
    border-radius:12px;
    background:rgba(4,45,50,.68);
    box-shadow:none;
  }
  body.admin-pro-ready #playersView .table-wrap table{
    display:table;
    width:100%;
    min-width:0;
    border-collapse:collapse;
    table-layout:fixed;
  }
  body.admin-pro-ready #playersView .table-wrap thead{
    display:table-header-group;
  }
  body.admin-pro-ready #playersView .table-wrap tbody{
    display:table-row-group;
    width:auto;
  }
  body.admin-pro-ready #playersView .table-wrap tbody tr.player-list-row{
    display:table-row;
    width:auto;
    border:0;
    border-radius:0;
    background:transparent;
    box-shadow:none;
  }
  body.admin-pro-ready #playersView .table-wrap tbody tr.player-list-row:hover{
    background:rgba(221,185,109,.045);
  }
  body.admin-pro-ready #playersView .table-wrap th,
  body.admin-pro-ready #playersView .table-wrap tbody td{
    display:table-cell;
    min-width:0;
    padding:10px 6px;
    border:0;
    border-bottom:1px solid var(--pro-line-soft);
    text-align:right;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    vertical-align:middle;
    font-size:12px;
  }
  body.admin-pro-ready #playersView .table-wrap thead th{
    position:static;
    padding-top:9px;
    padding-bottom:9px;
    background:#07383e;
    color:var(--pro-gold-2);
    font-size:10px;
  }
  body.admin-pro-ready #playersView .table-wrap tbody td::before{
    display:none;
    content:none;
  }
  body.admin-pro-ready #playersView .table-wrap th:nth-child(4),
  body.admin-pro-ready #playersView .table-wrap td:nth-child(4),
  body.admin-pro-ready #playersView .table-wrap th:nth-child(6),
  body.admin-pro-ready #playersView .table-wrap td:nth-child(6),
  body.admin-pro-ready #playersView .table-wrap th:nth-child(7),
  body.admin-pro-ready #playersView .table-wrap td:nth-child(7){
    display:none;
  }
  body.admin-pro-ready #playersView .table-wrap th:nth-child(1),
  body.admin-pro-ready #playersView .table-wrap td:nth-child(1){width:38%}
  body.admin-pro-ready #playersView .table-wrap th:nth-child(2),
  body.admin-pro-ready #playersView .table-wrap td:nth-child(2){width:18%;text-align:center}
  body.admin-pro-ready #playersView .table-wrap th:nth-child(3),
  body.admin-pro-ready #playersView .table-wrap td:nth-child(3){width:27%}
  body.admin-pro-ready #playersView .table-wrap th:nth-child(5),
  body.admin-pro-ready #playersView .table-wrap td:nth-child(5){width:17%;text-align:center}
  body.admin-pro-ready #playersView .table-wrap tbody td:first-child .link-btn{
    display:block;
    max-width:100%;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    text-align:right;
    font-size:12px;
  }
  body.admin-pro-ready #playersView .table-wrap .status-pill{
    padding:4px 7px;
    font-size:9px;
    justify-content:center;
    max-width:100%;
  }
  body.admin-pro-ready #playersView .table-wrap tbody td.empty{
    display:table-cell;
    width:auto;
    padding:22px 10px;
    text-align:center;
    white-space:normal;
  }
  .player-control-grid{
    grid-template-columns:1fr 1fr;
  }
  .player-control-grid .player-control-button{
    min-height:58px;
    padding:8px;
    font-size:12px;
  }
}
@media(max-width:420px){
  body.admin-pro-ready #playersView .table-wrap th,
  body.admin-pro-ready #playersView .table-wrap tbody td{
    padding:9px 5px;
    font-size:11px;
  }
  body.admin-pro-ready #playersView .table-wrap tbody td:first-child .link-btn{font-size:11px}
  .player-control-grid{grid-template-columns:1fr}
}`;
  document.head.appendChild(style);
}

function enhancePlayerRows() {
  const tbody = document.getElementById('playersTableBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((row) => {
    const trigger = row.querySelector('[data-player]');
    if (!trigger) return;
    row.classList.add('player-list-row');
    row.setAttribute('data-player-row', trigger.dataset.player || '');
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', `فتح بيانات ${trigger.textContent.trim() || 'اللاعب'}`);
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
  enhancePlayerRows();
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

function activateRow(row) {
  const trigger = row?.querySelector('[data-player]');
  if (trigger) trigger.click();
}

function startPlayerListEnhancement() {
  mountPlayerListStyles();
  enhancePlayerUi();

  document.addEventListener('click', (event) => {
    const row = event.target.closest?.('#playersTableBody tr[data-player-row]');
    if (!row) return;
    if (event.target.closest('button,a,input,select,textarea,label')) return;
    activateRow(row);
  });

  document.addEventListener('keydown', (event) => {
    const row = event.target.closest?.('#playersTableBody tr[data-player-row]');
    if (!row || event.target !== row || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    activateRow(row);
  });

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length || mutation.removedNodes.length)) {
      scheduleEnhancement();
    }
  });
  observer.observe(document.body, { childList:true, subtree:true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPlayerListEnhancement, { once:true });
} else {
  startPlayerListEnhancement();
}
