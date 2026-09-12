import {
  getSession,
  getCurrentPlayer,
  startMatchmaking,
  pollMatchmaking,
  cancelMatchmaking,
  getGameState,
  submitMove,
  subscribeGame,
  graceEnd,
  resignGame,
  offerDraw,
  respondDraw,
  timeoutGame,
} from './api.js';
import { remainingAt, formatClock, isFinalMinute } from './clock.mjs';
import { normalizeGameState } from './state.mjs';

const PIECE_ROOT = 'assets/pieces/';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const params = new URLSearchParams(location.search);
const validMinutes = [5, 10, 15];
const requestedMinutes = Number(params.get('minutes'));
let selectedMinutes = validMinutes.includes(requestedMinutes) ? requestedMinutes : 10;
const auto = params.get('auto');
const shouldAutoSearch = auto === '1';
const requestedGameId = params.get('game');

const board = document.getElementById('v2-board');
const searchStatus = document.getElementById('v2-search-status');
const searchButton = document.getElementById('v2-search');
const graceButton = document.getElementById('v2-grace-end');
const resignButton = document.getElementById('v2-resign');
const drawButton = document.getElementById('v2-draw');
const topClock = document.getElementById('v2-clock-black');
const bottomClock = document.getElementById('v2-clock-white');
const opponentName = document.getElementById('v2-opponent-name');
const playerName = document.getElementById('v2-player-name');
const playerMeta = document.getElementById('v2-player-meta');
const quickTimeButtons = [...document.querySelectorAll('#v2-quick-times [data-minutes]')];

let currentPlayer = null;
let currentGame = null;
let orientation = 'w';
let selectedSquare = null;
let renderedPosition = new Map();
let polling = false;
let pollTimer = null;
let unsubscribeGame = null;
let refreshPromise = null;
let clockTimer = null;
let submittingMove = false;
let actionInFlight = false;
let timeoutRequested = false;

function pieceAsset(color, type) {
  return `${PIECE_ROOT}${color}${type}.png`;
}

export function parseFen(fen) {
  const placement = String(fen || START_FEN).split(/\s+/)[0];
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error('Invalid FEN');
  const position = new Map();
  rows.forEach((row, rowIndex) => {
    let file = 0;
    for (const token of row) {
      if (/\d/.test(token)) {
        file += Number(token);
        continue;
      }
      const color = token === token.toUpperCase() ? 'w' : 'b';
      const type = token.toLowerCase();
      if (!'pnbrqk'.includes(type) || file > 7) throw new Error('Invalid FEN');
      position.set(`${String.fromCharCode(97 + file)}${8 - rowIndex}`, { color, type });
      file += 1;
    }
    if (file !== 8) throw new Error('Invalid FEN');
  });
  return position;
}

function orderedSquares(color) {
  const files = color === 'b' ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
  const ranks = color === 'b' ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}`));
}

export function renderPosition(fen = START_FEN, color = orientation) {
  renderedPosition = parseFen(fen);
  const fragment = document.createDocumentFragment();
  for (const squareName of orderedSquares(color)) {
    const file = squareName.charCodeAt(0) - 97;
    const rank = Number(squareName[1]);
    const square = document.createElement('button');
    square.type = 'button';
    square.className = `v2-square ${(file + rank) % 2 === 1 ? 'light' : 'dark'}`;
    square.setAttribute('role', 'gridcell');
    square.dataset.square = squareName;
    square.setAttribute('aria-label', squareName);
    const piece = renderedPosition.get(squareName);
    if (piece) {
      const image = document.createElement('img');
      image.className = 'v2-piece';
      image.src = pieceAsset(piece.color, piece.type);
      image.alt = '';
      image.draggable = false;
      square.appendChild(image);
    }
    fragment.appendChild(square);
  }
  board.replaceChildren(fragment);
  updateSelectableSquares();
}

function setStatus(message, { searching = false, error = false } = {}) {
  searchStatus.textContent = message;
  searchStatus.classList.toggle('searching', searching);
  searchStatus.classList.toggle('v2-status-error', error);
}

function setSelectedMinutes(minutes) {
  selectedMinutes = validMinutes.includes(Number(minutes)) ? Number(minutes) : 10;
  quickTimeButtons.forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.minutes) === selectedMinutes);
  });
  if (!currentGame) {
    const value = selectedMinutes * 60 * 1000;
    topClock.textContent = formatClock(value);
    bottomClock.textContent = formatClock(value);
  }
}

function updateIdentity() {
  if (!currentPlayer) return;
  playerName.textContent = currentPlayer.name || 'أنت';
  playerName.href = `player.html?id=${encodeURIComponent(currentPlayer.id)}`;
  playerMeta.textContent = `النقاط ${Number(currentPlayer.rating ?? 1500)}`;
}

function gameColor() {
  if (!currentGame || !currentPlayer) return null;
  if (currentGame.white_player_id === currentPlayer.id) return 'w';
  if (currentGame.black_player_id === currentPlayer.id) return 'b';
  return null;
}

function updateCurrentRatingFromGame() {
  if (!currentPlayer || !currentGame) return;
  const mine = gameColor();
  const rating = mine === 'w' ? currentGame.white_rating : mine === 'b' ? currentGame.black_rating : null;
  if (Number.isFinite(Number(rating))) {
    currentPlayer.rating = Number(rating);
    updateIdentity();
  }
}

function updateOpponent() {
  if (!currentGame || !currentPlayer) return;
  const mine = gameColor();
  const id = mine === 'w' ? currentGame.black_player_id : currentGame.white_player_id;
  const name = mine === 'w' ? currentGame.black_name : currentGame.white_name;
  const rating = mine === 'w' ? currentGame.black_rating : currentGame.white_rating;
  opponentName.textContent = `${name || 'الخصم'} · ${Number(rating ?? 1500)}`;
  opponentName.href = `player.html?id=${encodeURIComponent(id)}`;
}

function opponentOfferedDraw() {
  return Boolean(currentGame?.draw_offered_by && currentPlayer && currentGame.draw_offered_by !== currentPlayer.id);
}

function ownDrawOfferPending() {
  return Boolean(currentGame?.draw_offered_by && currentPlayer && currentGame.draw_offered_by === currentPlayer.id);
}

function updateControls() {
  const playable = Boolean(currentGame && ['matched', 'active'].includes(currentGame.status));
  resignButton.disabled = !playable || actionInFlight;
  drawButton.disabled = !playable || actionInFlight || ownDrawOfferPending();
  drawButton.textContent = opponentOfferedDraw() ? 'رد على التعادل' : ownDrawOfferPending() ? 'تم عرض التعادل' : 'تعادل';
  searchButton.disabled = Boolean(currentGame) || actionInFlight;
  if (currentGame) searchButton.hidden = true;
}

function gameFinishedMessage() {
  if (!currentGame) return '';
  if (currentGame.status === 'cancelled') return 'تم إنهاء المباراة بلا خصم نقاط';
  if (currentGame.status !== 'finished') return '';
  if (currentGame.result === '1/2-1/2') return 'انتهت المباراة بالتعادل';
  const mine = gameColor();
  const won = (mine === 'w' && currentGame.result === '1-0') || (mine === 'b' && currentGame.result === '0-1');
  return won ? 'فزت بالمباراة' : 'انتهت المباراة بالخسارة';
}

async function requestTimeout() {
  if (timeoutRequested || !currentGame || !['matched', 'active'].includes(currentGame.status)) return;
  timeoutRequested = true;
  try {
    await timeoutGame(currentGame.id);
    await refreshGame();
    const message = gameFinishedMessage();
    if (message) setStatus(message);
  } catch (error) {
    setStatus(error.message || 'تعذر حسم انتهاء الوقت', { error: true });
  } finally {
    if (currentGame && ['matched', 'active'].includes(currentGame.status)) timeoutRequested = false;
  }
}

function renderClocks() {
  if (!currentGame) return;
  const clocks = remainingAt(currentGame, Date.now());
  const mine = gameColor();
  const topValue = mine === 'b' ? clocks.white : clocks.black;
  const bottomValue = mine === 'b' ? clocks.black : clocks.white;
  topClock.textContent = formatClock(topValue);
  bottomClock.textContent = formatClock(bottomValue);
  topClock.classList.toggle('final-minute', isFinalMinute(topValue));
  bottomClock.classList.toggle('final-minute', isFinalMinute(bottomValue));

  const graceRemaining = currentGame.status === 'matched' && currentGame.grace_until_ms
    ? Math.max(0, currentGame.grace_until_ms - Date.now())
    : 0;
  graceButton.hidden = graceRemaining <= 0 || currentGame.ply > 0;
  if (!graceButton.hidden) graceButton.querySelector('span').textContent = String(Math.max(1, Math.ceil(graceRemaining / 1000)));

  if (['matched', 'active'].includes(currentGame.status)) {
    const activeRemaining = currentGame.turn === 'w' ? clocks.white : clocks.black;
    if (activeRemaining <= 0) void requestTimeout();
  }
}

function startClockLoop() {
  if (clockTimer) clearInterval(clockTimer);
  renderClocks();
  clockTimer = setInterval(renderClocks, 200);
}

function updateSelectableSquares() {
  const myColor = gameColor();
  const canMove = Boolean(currentGame && myColor && currentGame.turn === myColor && ['matched','active'].includes(currentGame.status) && !submittingMove && !actionInFlight);
  board.querySelectorAll('.v2-square').forEach((square) => {
    const piece = renderedPosition.get(square.dataset.square);
    square.classList.toggle('selected', square.dataset.square === selectedSquare);
    square.classList.toggle('movable', canMove && Boolean(selectedSquare || piece?.color === myColor));
  });
}

async function refreshGame() {
  if (!currentGame?.id) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    currentGame = normalizeGameState(await getGameState(currentGame.id));
    orientation = gameColor() || orientation;
    updateCurrentRatingFromGame();
    updateOpponent();
    renderPosition(currentGame.fen, orientation);
    updateControls();
    renderClocks();
    const message = gameFinishedMessage();
    if (message) setStatus(message);
    return currentGame;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

function beginSubscription(gameId) {
  if (unsubscribeGame) unsubscribeGame();
  unsubscribeGame = subscribeGame(gameId, () => {
    refreshGame().catch(() => setStatus('تعذر تحديث المباراة', { error: true }));
  });
}

async function openGame(gameId) {
  stopPolling();
  currentGame = normalizeGameState(await getGameState(gameId));
  orientation = gameColor() || 'w';
  history.replaceState({}, '', `play-v2.html?game=${encodeURIComponent(gameId)}`);
  setStatus('تم العثور على الخصم');
  updateCurrentRatingFromGame();
  updateOpponent();
  renderPosition(currentGame.fen, orientation);
  updateControls();
  startClockLoop();
  beginSubscription(gameId);
}

function stopPolling() {
  polling = false;
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = null;
  searchButton.classList.remove('searching');
  searchButton.textContent = 'ابحث عن خصم';
}

async function handleMatchResult(result) {
  if (result?.queue_status === 'matched' && result?.game_id) {
    await openGame(result.game_id);
    return true;
  }
  return false;
}

async function pollOnce() {
  if (!polling) return;
  try {
    if (await handleMatchResult(await pollMatchmaking())) return;
  } catch (error) {
    stopPolling();
    setStatus(error.message || 'تعذر متابعة البحث', { error: true });
    return;
  }
  pollTimer = setTimeout(pollOnce, 1200);
}

async function beginSearch(minutes = selectedMinutes) {
  if (polling || currentGame) return;
  setSelectedMinutes(minutes);
  polling = true;
  searchButton.classList.add('searching');
  searchButton.textContent = 'إلغاء البحث';
  setStatus('جاري البحث عن خصم', { searching: true });
  try {
    if (await handleMatchResult(await startMatchmaking(selectedMinutes))) return;
    pollTimer = setTimeout(pollOnce, 1000);
  } catch (error) {
    stopPolling();
    setStatus(error.message || 'تعذر بدء البحث', { error: true });
  }
}

async function toggleSearch() {
  if (!polling) return beginSearch(selectedMinutes);
  try { await cancelMatchmaking(); } catch {}
  stopPolling();
  setStatus('تم إلغاء البحث');
}

async function handleSquareClick(event) {
  const square = event.target.closest('.v2-square');
  if (!square || submittingMove || actionInFlight || !currentGame) return;
  const myColor = gameColor();
  if (!myColor || currentGame.turn !== myColor || !['matched','active'].includes(currentGame.status)) return;
  const target = square.dataset.square;
  const targetPiece = renderedPosition.get(target);
  if (!selectedSquare) {
    if (targetPiece?.color !== myColor) return;
    selectedSquare = target;
    updateSelectableSquares();
    return;
  }
  if (target === selectedSquare) {
    selectedSquare = null;
    updateSelectableSquares();
    return;
  }
  if (targetPiece?.color === myColor) {
    selectedSquare = target;
    updateSelectableSquares();
    return;
  }

  const source = selectedSquare;
  const sourcePiece = renderedPosition.get(source);
  selectedSquare = null;
  submittingMove = true;
  board.classList.add('busy');
  updateSelectableSquares();
  const reachesPromotionRank = sourcePiece?.type === 'p' && (target.endsWith('8') || target.endsWith('1'));
  try {
    await submitMove({
      gameId: currentGame.id,
      expectedPly: currentGame.ply,
      from: source,
      to: target,
      promotion: reachesPromotionRank ? 'q' : null,
    });
    await refreshGame();
    if (currentGame.status !== 'finished') setStatus('المباراة جارية');
  } catch (error) {
    await refreshGame().catch(() => {});
    setStatus(error.code === 'illegal_move' ? 'نقلة غير قانونية' : (error.message || 'تعذر تنفيذ النقلة'), { error: true });
  } finally {
    submittingMove = false;
    board.classList.remove('busy');
    updateSelectableSquares();
  }
}

async function handleGraceEnd() {
  if (!currentGame || actionInFlight || graceButton.hidden) return;
  actionInFlight = true;
  updateControls();
  try {
    await graceEnd(currentGame.id);
    await refreshGame();
    if (currentGame.status === 'cancelled') location.href = 'index.html';
  } catch (error) {
    setStatus(error.message || 'انتهت مهلة الإنهاء', { error: true });
    await refreshGame().catch(() => {});
  } finally {
    actionInFlight = false;
    updateControls();
  }
}

async function handleResign() {
  if (!currentGame || actionInFlight || resignButton.disabled) return;
  if (!window.confirm('هل تريد الاستسلام؟')) return;
  actionInFlight = true;
  updateControls();
  try {
    await resignGame(currentGame.id);
    await refreshGame();
  } catch (error) {
    setStatus(error.message || 'تعذر الاستسلام', { error: true });
  } finally {
    actionInFlight = false;
    updateControls();
  }
}

async function handleDraw() {
  if (!currentGame || actionInFlight || drawButton.disabled) return;
  actionInFlight = true;
  updateControls();
  try {
    if (opponentOfferedDraw()) {
      const accept = window.confirm('هل تريد قبول عرض التعادل؟\nاختر إلغاء لرفض العرض.');
      await respondDraw(currentGame.id, accept);
      setStatus(accept ? 'تم قبول التعادل' : 'تم رفض التعادل');
    } else {
      await offerDraw(currentGame.id);
      setStatus('تم إرسال عرض التعادل');
    }
    await refreshGame();
  } catch (error) {
    setStatus(error.message || 'تعذر تنفيذ طلب التعادل', { error: true });
  } finally {
    actionInFlight = false;
    updateControls();
  }
}

async function initialize() {
  setSelectedMinutes(selectedMinutes);
  renderPosition(START_FEN, orientation);
  board.addEventListener('click', handleSquareClick);
  searchButton.addEventListener('click', toggleSearch);
  graceButton.addEventListener('click', handleGraceEnd);
  resignButton.addEventListener('click', handleResign);
  drawButton.addEventListener('click', handleDraw);
  quickTimeButtons.forEach((button) => button.addEventListener('click', () => setSelectedMinutes(Number(button.dataset.minutes))));

  let session;
  try {
    session = await getSession();
  } catch (error) {
    setStatus(error.message || 'تعذر التحقق من تسجيل الدخول', { error: true });
    return;
  }
  if (!session) {
    setStatus('سجل الدخول أولًا لبدء اللعب', { error: true });
    searchButton.disabled = true;
    return;
  }

  try {
    currentPlayer = await getCurrentPlayer();
  } catch (error) {
    setStatus(error.message || 'تعذر تحميل بيانات اللاعب', { error: true });
    return;
  }
  if (!currentPlayer || currentPlayer.is_synthetic) {
    setStatus('يلزم حساب لاعب صالح', { error: true });
    searchButton.disabled = true;
    return;
  }
  updateIdentity();

  if (requestedGameId) {
    try { await openGame(requestedGameId); }
    catch (error) { setStatus(error.message || 'تعذر فتح المباراة', { error: true }); }
    return;
  }

  if (shouldAutoSearch) await beginSearch(selectedMinutes);
}

window.addEventListener('pagehide', () => {
  if (unsubscribeGame) unsubscribeGame();
  if (clockTimer) clearInterval(clockTimer);
});

initialize();
