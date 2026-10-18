import {
  getSession,
  getCurrentPlayer,
  startMatchmaking,
  pollMatchmaking,
  cancelMatchmaking,
  getGameState,
  getGameMoves,
  submitMove,
  subscribeGame,
  graceEnd,
  resignGame,
  offerDraw,
  respondDraw,
  timeoutGame,
} from './api.js?v=20261018-live-speed-v3';
import { remainingAt, formatClock, isFinalMinute } from './clock.mjs';
import { normalizeGameState } from './state.mjs';
import { preloadChessEngine, previewMove } from './instant-move.mjs?v=20261018-move-speed-v1';
import { moveFromRecord, moveFromPositions, setLastMoveClass } from './last-move.mjs?v=20261018-last-move-v1';
import { renderCapturedPieces } from './captured-pieces.mjs?v=20261018-premove-review-v1';

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
let queuedPremove = null;
let renderedPosition = new Map();
let displayedFen = null;
let lastMove = null;
let polling = false;
let pollTimer = null;
let unsubscribeGame = null;
let refreshPromise = null;
let clockTimer = null;
let fallbackSyncTimer = null;
let submittingMove = false;
let actionInFlight = false;
let timeoutRequested = false;

function pieceAsset(color, type) {
  return `${PIECE_ROOT}${color}${type}.png?v=20261012-extracted-photo-pieces-v3`;
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
  displayedFen = fen;
  board.dataset.positionFen = fen;
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
  setLastMoveClass(board,lastMove);
  updateCapturedPieces();
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
  document.body.classList.toggle('v2-game-active', playable);
  resignButton.disabled = !playable || actionInFlight;
  drawButton.disabled = !playable || actionInFlight || ownDrawOfferPending();
  drawButton.textContent = opponentOfferedDraw() ? 'رد على التعادل' : ownDrawOfferPending() ? 'تم عرض التعادل' : 'تعادل';
  searchButton.disabled = Boolean(currentGame) || actionInFlight;
  if (currentGame) searchButton.hidden = true;
}

function turnMessage() {
  if (!currentGame || !['matched', 'active'].includes(currentGame.status)) return '';
  const color = gameColor();
  if (!color) return 'تعذر تحديد مقعد اللاعب — أعد فتح المباراة';
  return currentGame.turn === color ? 'دورك الآن — انقر القطعة ثم مربع النقل' : 'بانتظار نقلة الخصم';
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

function updateCapturedPieces(){
  const color=gameColor(),fen=currentGame?.fen||START_FEN;
  renderCapturedPieces(document.getElementById('v2-player-captured'),fen,color||'w');
  renderCapturedPieces(document.getElementById('v2-opponent-captured'),fen,color==='b'?'w':'b');
}
function clearPremove(){queuedPremove=null;updateSelectableSquares();}
function updateSelectableSquares(){
  const color=gameColor();
  const allowed=Boolean(currentGame&&color&&['matched','active'].includes(currentGame.status)&&!submittingMove&&!actionInFlight);
  board.querySelectorAll('.v2-square').forEach(square=>{
    const name=square.dataset.square,piece=renderedPosition.get(name);
    square.classList.toggle('selected',name===selectedSquare);
    square.classList.toggle('movable',allowed&&Boolean(selectedSquare||piece?.color===color));
    square.classList.toggle('premove-from',name===queuedPremove?.from);
    square.classList.toggle('premove-to',name===queuedPremove?.to);
  });
}
function tryPlayQueuedPremove(){
  const queued=queuedPremove;
  if(!queued||!currentGame||submittingMove||actionInFlight)return;
  if(currentGame.id!==queued.gameId||!['matched','active'].includes(currentGame.status)){clearPremove();return;}
  if(currentGame.turn!==queued.color||Number(currentGame.ply)<=queued.ply)return;
  queuedPremove=null;
  const piece=renderedPosition.get(queued.from),target=renderedPosition.get(queued.to);
  const preview=previewMove({fen:currentGame.fen,from:queued.from,to:queued.to,promotion:queued.promotion});
  if(piece?.color!==queued.color||target?.color===queued.color||preview?.legal===false){
    selectedSquare=null;updateSelectableSquares();
    setStatus('أُلغيت النقلة المسبقة: لم تعد قانونية',{error:true});return;
  }
  selectedSquare=queued.from;updateSelectableSquares();
  const square=board.querySelector('.v2-square[data-square="'+queued.to+'"]');
  if(square)void handleSquareClick({target:square});
}

async function refreshGame() {
  if (!currentGame?.id || submittingMove) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const previous = currentGame;
    const latest = normalizeGameState(await getGameState(currentGame.id));
    if (!latest) throw new Error('تعذر استعادة حالة المباراة');
    // A response started before a move must never undo a preview or a newer ply.
    if (submittingMove || latest.id !== currentGame?.id || latest.ply < currentGame.ply ||
        (['finished','cancelled'].includes(currentGame.status) && !['finished','cancelled'].includes(latest.status))) return currentGame;
    if (latest.ply !== previous?.ply || latest.fen !== previous?.fen) {
      lastMove = Number(latest.ply) === Number(previous?.ply) + 1
        ? moveFromPositions(previous?.fen, latest.fen) : null;
    }
    currentGame = latest;
    orientation = gameColor() || orientation;
    updateCurrentRatingFromGame();
    updateOpponent();
    if (displayedFen !== latest.fen || previous?.ply !== latest.ply) {
      selectedSquare = null;
      renderPosition(latest.fen, orientation);
    } else {
      updateSelectableSquares();
    }
    if(!['matched','active'].includes(currentGame.status))clearPremove();
    updateCapturedPieces();
    updateControls();
    renderClocks();
    if(latest.ply!==previous?.ply||latest.fen!==previous?.fen)tryPlayQueuedPremove();
    const message = gameFinishedMessage() || turnMessage();
    if (message) setStatus(message, { error: !gameColor() && latest.status !== 'finished' });
    return currentGame;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

let fallbackSyncActive = false;
function stopFallbackSync() {
  fallbackSyncActive = false;
  if (fallbackSyncTimer) clearTimeout(fallbackSyncTimer);
  fallbackSyncTimer = null;
}
function startFallbackSync() {
  stopFallbackSync();
  fallbackSyncActive = true;
  const tick = async () => {
    if (!fallbackSyncActive) return;
    if (document.visibilityState !== 'hidden' && currentGame &&
        ['matched', 'active'].includes(currentGame.status) && !submittingMove) {
      await refreshGame().catch(() => {});
    }
    if (!fallbackSyncActive) return;
    const waiting = Boolean(currentGame && currentGame.turn !== gameColor());
    // Realtime is primary; poll more often only when waiting for an opponent.
    fallbackSyncTimer = setTimeout(tick, waiting ? 1200 : 3500);
  };
  fallbackSyncTimer = setTimeout(tick, 1200);
}

function applyLiveGameRow(row) {
  if (submittingMove || !currentGame || !row || row.id !== currentGame.id ||
      typeof row.fen !== 'string' || !Number.isInteger(Number(row.ply)) ||
      Number(row.ply) < currentGame.ply ||
      (['finished','cancelled'].includes(currentGame.status) && !['finished','cancelled'].includes(row.status))) return false;
  const previous = currentGame;
  const latest = normalizeGameState({ ...previous, ...row });
  if (latest.ply !== previous.ply || latest.fen !== previous.fen) {
    lastMove = Number(latest.ply) === Number(previous.ply) + 1
      ? moveFromPositions(previous.fen,latest.fen) : null;
  }
  currentGame = latest;
  orientation = gameColor() || orientation;
  if (displayedFen !== currentGame.fen || previous.ply !== currentGame.ply) {
    selectedSquare = null;
    renderPosition(currentGame.fen, orientation);
  } else {
    updateSelectableSquares();
  }
  if(!['matched','active'].includes(currentGame.status))clearPremove();
  updateCapturedPieces();
  updateControls();
  renderClocks();
  setStatus(gameFinishedMessage() || turnMessage());
  if(latest.ply!==previous.ply||latest.fen!==previous.fen)tryPlayQueuedPremove();
  return true;
}

function beginSubscription(gameId) {
  if (unsubscribeGame) unsubscribeGame();
  unsubscribeGame = subscribeGame(gameId, (type, row) => {
    // Postgres changes contain the committed position: no extra HTTP roundtrip.
    if (type === 'game' && applyLiveGameRow(row)) return;
    if (!submittingMove) refreshGame().catch(() => {});
  });
}

async function openGame(gameId) {
  stopPolling();
  currentGame = normalizeGameState(await getGameState(gameId));
  clearPremove();
  lastMove = null;
  orientation = gameColor() || 'w';
  history.replaceState({}, '', `play-v2.html?game=${encodeURIComponent(gameId)}`);
  setStatus('تم العثور على الخصم');
  updateCurrentRatingFromGame();
  updateOpponent();
  renderPosition(currentGame.fen, orientation);
  void getGameMoves(gameId).then(moves => {
    if (currentGame?.id !== gameId || moves.length !== Number(currentGame.ply)) return;
    lastMove = moveFromRecord(moves[moves.length-1]) || lastMove;
    setLastMoveClass(board,lastMove);
  }).catch(() => {});
  updateControls();
  setStatus(turnMessage(), { error: !gameColor() });
  startClockLoop();
  beginSubscription(gameId);
  startFallbackSync();
  void preloadChessEngine();
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
  if (!myColor || !['matched','active'].includes(currentGame.status)) return;
  const preparing=currentGame.turn!==myColor;
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
  const promotion = sourcePiece?.type === 'p' && (target.endsWith('8') || target.endsWith('1')) ? 'q' : null;
  if(preparing){
    queuedPremove={gameId:currentGame.id,from:source,to:target,promotion,ply:Number(currentGame.ply),color:myColor};
    updateSelectableSquares();
    setStatus('نقلة مسبقة بالأحمر — تنفذ عندما يأتي دورك إذا بقيت قانونية.');return;
  }
  clearPremove();
  const preview = previewMove({ fen: currentGame.fen, from: source, to: target, promotion });
  if (preview?.legal === false) {
    updateSelectableSquares();
    setStatus('نقلة غير قانونية', { error: true });
    return;
  }
  const gameId = currentGame.id;
  const expectedPly = currentGame.ply;
  const previousLastMove = lastMove;
  submittingMove = true;
  board.classList.add('busy');
  updateSelectableSquares();
  // Show only locally validated moves immediately; the server still confirms each move.
  if (preview?.legal) {
    lastMove = {from:source,to:target};
    renderPosition(preview.fen, orientation);
  }
  try {
    const response = await submitMove({ gameId, expectedPly, from: source, to: target, promotion });
    if (response?.game?.id === gameId && Number(response.game.ply) >= expectedPly + 1) {
      currentGame = normalizeGameState({ ...currentGame, ...response.game });
      orientation = gameColor() || orientation;
      lastMove = {from:source,to:target};
      if (displayedFen !== currentGame.fen) renderPosition(currentGame.fen, orientation);
      else setLastMoveClass(board,lastMove);
      updateCurrentRatingFromGame();
      updateOpponent();
      updateControls();
      renderClocks();
      setStatus(gameFinishedMessage() || turnMessage());
    } else {
      // Some server actions may return only an acknowledgement.
      submittingMove = false;
      await refreshGame();
    }
  } catch (error) {
    // Revert both position and last-move indicators on server rejection.
    lastMove = previousLastMove;
    if (displayedFen !== currentGame.fen) renderPosition(currentGame.fen, orientation);
    else setLastMoveClass(board,lastMove);
    submittingMove = false;
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
  stopFallbackSync();
  clearPremove();
});

initialize();
