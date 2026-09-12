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
const timePickerButton = $('v5-time-picker-button');
const timePickerMenu = $('v5-time-picker-menu');
const timePickerLabel = $('v5-time-picker-label');
const timeButtons = [...document.querySelectorAll('#v5-time-picker-menu [data-base-seconds]')];
const regularSearch = $('v2-search');
const rematchButton = $('v5-rematch');
const rematchStateHost = $('v5-rematch-state');
const statusHost = $('v2-search-status');
const gameId = new URLSearchParams(location.search).get('game');

let customPolling = false;
let customTimer = null;
let rematchTimer = null;
let selectedBaseSeconds = null;

function setStatus(message, error = false) {
  if (!statusHost) return;
  statusHost.textContent = message;
  statusHost.classList.toggle('v2-status-error', error);
}

function openGame(id) {
  location.href = `play-v2.html?game=${encodeURIComponent(id)}`;
}

function minutesLabel(seconds) {
  return `${Math.round(Number(seconds) / 60)} د`;
}

function closeTimeMenu() {
  if (!timePickerMenu || !timePickerButton) return;
  timePickerMenu.hidden = true;
  timePickerButton.setAttribute('aria-expanded', 'false');
}

function renderTimePicker() {
  if (!timePickerLabel) return;
  if (customPolling) {
    timePickerLabel.textContent = `${minutesLabel(selectedBaseSeconds)} · إلغاء`;
    return;
  }
  timePickerLabel.textContent = selectedBaseSeconds ? minutesLabel(selectedBaseSeconds) : 'اختر الوقت';
}

function setCustomBusy(busy) {
  customPolling = busy;
  timeButtons.forEach((button) => { button.disabled = busy; });
  if (timePickerButton) timePickerButton.classList.toggle('searching', busy);
  if (regularSearch) regularSearch.disabled = busy || Boolean(gameId);
  renderTimePicker();
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
    setStatus(error.message || 'تعذر متابعة البحث', true);
    return;
  }
  customTimer = setTimeout(pollCustom, 1200);
}

async function cancelTimeSearch() {
  try { await cancelCustomMatchmaking(); } catch {}
  clearTimeout(customTimer);
  setCustomBusy(false);
  setStatus('تم إلغاء البحث');
}

async function startTimeSearch(baseSeconds) {
  if (gameId || customPolling) return;
  selectedBaseSeconds = Number(baseSeconds);
  closeTimeMenu();

  if (regularSearch?.classList.contains('searching')) {
    regularSearch.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
  }

  const session = await getSession().catch(() => null);
  if (!session) {
    setStatus('سجل الدخول أولًا لبدء اللعب', true);
    renderTimePicker();
    return;
  }

  setCustomBusy(true);
  setStatus(`جاري البحث · ${minutesLabel(selectedBaseSeconds)} · نقاط`);
  try {
    if (await handleCustomResult(await startCustomMatchmaking({
      baseSeconds: selectedBaseSeconds,
      incrementSeconds: 0,
      rated: true,
    }))) return;
    customTimer = setTimeout(pollCustom, 1000);
  } catch (error) {
    setCustomBusy(false);
    setStatus(error.message || 'تعذر بدء البحث', true);
  }
}

function toggleTimePicker() {
  if (!timePickerButton || !timePickerMenu || gameId) return;
  if (customPolling) {
    void cancelTimeSearch();
    return;
  }
  const willOpen = timePickerMenu.hidden;
  timePickerMenu.hidden = !willOpen;
  timePickerButton.setAttribute('aria-expanded', String(willOpen));
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

if (timePickerButton) timePickerButton.addEventListener('click', toggleTimePicker);
timeButtons.forEach((button) => {
  button.addEventListener('click', () => void startTimeSearch(Number(button.dataset.baseSeconds)));
});
if (rematchButton) rematchButton.addEventListener('click', handleRematch);

document.addEventListener('click', (event) => {
  if (!timePickerMenu || timePickerMenu.hidden || !timePickerButton) return;
  if (timePickerMenu.contains(event.target) || timePickerButton.contains(event.target)) return;
  closeTimeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeTimeMenu();
});

if (gameId) {
  const picker = $('v5-time-picker');
  if (picker) picker.hidden = true;
}

renderTimePicker();

window.addEventListener('pagehide', () => {
  clearTimeout(customTimer);
  clearTimeout(rematchTimer);
});

void initRematch();
