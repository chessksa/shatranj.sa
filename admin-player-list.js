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
@media(max-width:760px){
  .player-control-grid{grid-template-columns:1fr 1fr}
  .player-control-grid .player-control-button{
    min-height:58px;
    padding:8px;
    font-size:12px;
  }
}
@media(max-width:420px){.player-control-grid{grid-template-columns:1fr}}
`;
  document.head.appendChild(style);
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

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    decoratePlayerControls();
  });
}

function startPlayerControlEnhancement() {
  mountPlayerControlStyles();
  decoratePlayerControls();

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
