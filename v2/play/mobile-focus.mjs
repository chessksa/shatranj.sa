const body = document.body;
const statusHost = document.getElementById('v2-search-status');
const rematchButton = document.getElementById('v5-rematch');

const terminalMessages = [
  'تم إنهاء المباراة بلا خصم نقاط',
  'انتهت المباراة بالتعادل',
  'فزت بالمباراة',
  'انتهت المباراة بالخسارة',
];

function hasGameInUrl() {
  return Boolean(new URLSearchParams(location.search).get('game'));
}

function hasTerminalState() {
  const text = statusHost?.textContent?.trim() || '';
  if (terminalMessages.some((message) => text.includes(message))) return true;
  return Boolean(rematchButton && !rematchButton.hidden);
}

function syncMobileGameFocus() {
  const active = hasGameInUrl() && !hasTerminalState();
  body.classList.toggle('v2-game-active', active);
}

const observer = new MutationObserver(syncMobileGameFocus);
if (statusHost) observer.observe(statusHost, { childList: true, characterData: true, subtree: true });
if (rematchButton) observer.observe(rematchButton, { attributes: true, attributeFilter: ['hidden'] });

window.addEventListener('popstate', syncMobileGameFocus);
window.addEventListener('pageshow', syncMobileGameFocus);
syncMobileGameFocus();
