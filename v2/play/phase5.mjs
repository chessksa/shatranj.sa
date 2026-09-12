import {
  getSession,
  getGameState,
  startCustomMatchmaking,
  pollCustomMatchmaking,
  cancelCustomMatchmaking,
  requestRematch,
  getRematchState,
} from './api.js';

const $ = (id) => document.getElementById(id);
const customBase = $('v5-custom-base');
const customIncrement = $('v5-custom-increment');
const customRated = $('v5-custom-rated');
const customSearch = $('v5-custom-search');
const regularSearch = $('v2-search');
const rematchButton = $('v5-rematch');
const rematchStateHost = $('v5-rematch-state');
const statusHost = $('v2-search-status');
const gameId = new URLSearchParams(location.search).get('game');

let customPolling = false;
let customTimer = null;
let rematchTimer = null;

function setStatus(message, error = false) {
  if (!statusHost) return;
  statusHost.textContent = message;
  statusHost.classList.toggle('v2-status-error', error);
}

function openGame(id) {
  location.href = `play-v2.html?game=${encodeURIComponent(id)}`;
}

function setCustomBusy(busy) {
  customPolling = busy;
  if (customSearch) customSearch.textContent = busy ? 'إلغاء البحث المخصص' : 'بحث مخصص';
  if (customBase) customBase.disabled = busy;
  if (customIncrement) customIncrement.disabled = busy;
  if (customRated) customRated.disabled = busy;
  if (regularSearch) regularSearch.disabled = busy || Boolean(gameId);
}

async function handleCustomResult(result) {
  if (result?.queue_status === 'matched' && result?.game_id) {
    customPolling = false;
    clearTimeout(customTimer);
    openGame(result.game_id);
    return true;
  }
  return false;
}

async function pollCustom() {
  if (!customPolling) return;
  try {
    if (await handleCustomResult(await pollCustomMatchmaking())) return;
  } catch (error) {
    setCustomBusy(false);
    setStatus(error.message || 'تعذر متابعة البحث المخصص', true);
    return;
  }
  customTimer = setTimeout(pollCustom, 1200);
}

async function toggleCustomSearch() {
  if (!customSearch || gameId) return;
  if (customPolling) {
    try { await cancelCustomMatchmaking(); } catch {}
    clearTimeout(customTimer);
    setCustomBusy(false);
    setStatus('تم إلغاء البحث المخصص');
    return;
  }

  if (regularSearch?.classList.contains('searching')) {
    regularSearch.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
  }

  const session = await getSession().catch(() => null);
  if (!session) {
    setStatus('سجل الدخول أولًا لبدء اللعب', true);
    return;
  }

  const baseSeconds = Number(customBase?.value || 600);
  const incrementSeconds = Number(customIncrement?.value || 0);
  const rated = Boolean(customRated?.checked);
  setCustomBusy(true);
  setStatus(`جاري البحث · ${Math.round(baseSeconds / 60)} د +${incrementSeconds} · ${rated ? 'نقاط' : 'ودي'}`);
  try {
    if (await handleCustomResult(await startCustomMatchmaking({ baseSeconds, incrementSeconds, rated }))) return;
    customTimer = setTimeout(pollCustom, 1000);
  } catch (error) {
    setCustomBusy(false);
    setStatus(error.message || 'تعذر بدء البحث المخصص', true);
  }
}

function rematchLabel(state) {
  const rematchStatus = state?.rematch_status;
  if (rematchStatus === 'accepted') return 'فتح إعادة المباراة';
  if (rematchStatus === 'pending' && state?.direction === 'incoming') return 'قبول إعادة المباراة';
  if (rematchStatus === 'pending') return 'بانتظار قبول الإعادة';
  if (rematchStatus === 'expired') return 'انتهت مهلة الإعادة';
  if (rematchStatus === 'rejected') return 'رُفضت إعادة المباراة';
  return 'إعادة مباراة';
}

function renderRematchState(state) {
  if (!rematchButton) return;
  const rematchStatus = state?.rematch_status || null;
  rematchButton.textContent = rematchLabel(state);
  rematchButton.disabled = rematchStatus === 'pending' && state?.direction === 'outgoing';
  if (rematchStateHost) {
    rematchStateHost.textContent = rematchStatus === 'pending'
      ? (state?.direction === 'incoming' ? 'الخصم يطلب إعادة المباراة.' : 'تم إرسال طلب إعادة المباراة.')
      : rematchStatus === 'accepted' ? 'تم قبول إعادة المباراة.' : '';
  }
  if (rematchStatus === 'accepted' && state?.game_id) openGame(state.game_id);
}

async function refreshRematch() {
  if (!gameId || !rematchButton || rematchButton.hidden) return;
  try {
    const state = await getRematchState(gameId);
    renderRematchState(state);
    if (state?.rematch_status === 'pending') {
      clearTimeout(rematchTimer);
      rematchTimer = setTimeout(refreshRematch, 1800);
    }
  } catch (error) {
    if (rematchStateHost) rematchStateHost.textContent = error.message || 'تعذر تحميل حالة الإعادة';
  }
}

async function handleRematch() {
  if (!gameId || !rematchButton || rematchButton.disabled) return;
  rematchButton.disabled = true;
  try {
    const state = await requestRematch(gameId);
    renderRematchState(state);
    if (state?.rematch_status === 'pending') {
      clearTimeout(rematchTimer);
      rematchTimer = setTimeout(refreshRematch, 1800);
    }
  } catch (error) {
    rematchButton.disabled = false;
    if (rematchStateHost) rematchStateHost.textContent = error.message || 'تعذر طلب إعادة المباراة';
  }
}

async function initRematch() {
  if (!gameId || !rematchButton) return;
  try {
    const game = await getGameState(gameId);
    const finishedStandard = game?.status === 'finished' && (game?.variant || 'standard') === 'standard';
    rematchButton.hidden = !finishedStandard;
    if (!finishedStandard) return;
    await refreshRematch();
  } catch {
    rematchButton.hidden = true;
  }
}

if (customSearch) customSearch.addEventListener('click', toggleCustomSearch);
if (rematchButton) rematchButton.addEventListener('click', handleRematch);
if (gameId) {
  for (const element of [customBase, customIncrement, customRated, customSearch]) {
    if (element) element.disabled = true;
  }
}

window.addEventListener('pagehide', () => {
  clearTimeout(customTimer);
  clearTimeout(rematchTimer);
});

void initRematch();
