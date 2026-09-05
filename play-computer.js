import { Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const LEVELS = {
  easy: { skill: 8, movetime: 250, label: 'سهل', points: 5 },
  medium: { skill: 14, movetime: 600, label: 'متوسط', points: 10 },
  hard: { skill: 20, movetime: 1200, label: 'صعب', points: 20 }
};
const TIME_CONTROLS = [5, 10, 15];

const cfg = window.SHATRANJ_CONFIG?.supabase || {};
const supabase = cfg.enabled && cfg.url && cfg.anonKey
  ? createClient(cfg.url, cfg.anonKey)
  : null;

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const moveHintsEl = $('moveHints');
const leftEl = $('coordsLeft');
const bottomEl = $('coordsBottom');
const topPlayerCard = $('topPlayerCard');
const opponentSearchPanel = $('opponentSearchPanel');
const opponentSearchSetup = $('opponentSearchSetup');
const opponentSearchWaiting = $('opponentSearchWaiting');
const topPlayerLive = $('topPlayerLive');
const topNameEl = $('topName');
const topLocationEl = $('topLocation');
const topRatingEl = $('topRating');
const bottomNameEl = $('bottomName');
const bottomLocationEl = $('bottomLocation');
const bottomRatingEl = $('bottomRating');
const topClockEl = $('topClock');
const bottomClockEl = $('bottomClock');
const resignBtn = $('resignBtn');
const drawOfferBtn = $('drawOffer');
const endGraceBtn = $('endGraceBtn');
const endGraceCountdownEl = $('endGraceCountdown');
const leaveBtn = $('leaveBtn');
const reportBtn = $('reportBtn');
const gameToast = $('gameToast');

const game = new window.Chess();
let cmBoard = null;
let engine = null;
let engineReady = false;
let engineFailed = false;
let selectedLevel = null;
let selectedMinutes = null;
let thinking = false;
let finished = false;
let bestMoveResolver = null;
let readyResolver = null;
let uciResolver = null;
let engineInitPromise = null;
let ratedMode = false;
let ratedGameId = null;
let ratedAccessToken = null;
let currentRating = null;
let leaving = false;
let ratedTimeoutPending = false;
let clockTimer = null;
let playerTimeMs = 0;
let computerTimeMs = 0;
let clockActiveSide = null;
let clockAnchorMs = 0;

function toast(message, ms = 2600) {
  if (!gameToast) return;
  gameToast.textContent = message;
  gameToast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { gameToast.hidden = true; }, ms);
}

function ensureCmStyles() {
  if (!document.querySelector('link[data-cm-chessboard-core]')) {
    const core = document.createElement('link');
    core.rel = 'stylesheet';
    core.href = 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/assets/chessboard.css';
    core.dataset.cmChessboardCore = '1';
    document.head.appendChild(core);
  }
  if (!document.querySelector('link[data-cm-chessboard-shatranj]')) {
    const theme = document.createElement('link');
    theme.rel = 'stylesheet';
    theme.href = 'cm-chessboard-shatranj-v3.css?v=20260904-3';
    theme.dataset.cmChessboardShatranj = '1';
    document.head.appendChild(theme);
  }
}

function renderCoords() {
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = [8,7,6,5,4,3,2,1];
  leftEl.innerHTML = '';
  bottomEl.innerHTML = '';
  ranks.forEach((n) => {
    const div = document.createElement('div');
    div.textContent = n;
    leftEl.appendChild(div);
  });
  files.forEach((f) => {
    const div = document.createElement('div');
    div.textContent = f;
    bottomEl.appendChild(div);
  });
}

function squarePosition(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return { left: file * 12.5, top: (8 - rank) * 12.5 };
}

function clearMoveHints() {
  if (moveHintsEl) moveHintsEl.innerHTML = '';
}

function showMoveHints(square) {
  if (!moveHintsEl) return;
  clearMoveHints();
  const moves = game.moves({ square, verbose: true });
  moves.forEach((move) => {
    const pos = squarePosition(move.to);
    const hint = document.createElement('span');
    hint.className = `move-hint${move.flags.includes('c') || move.flags.includes('e') ? ' capture' : ''}`;
    hint.style.left = `${pos.left}%`;
    hint.style.top = `${pos.top}%`;
    moveHintsEl.appendChild(hint);
  });
}

function forceBoardSquareColors() {
  boardEl.querySelectorAll('.cm-chessboard .square.white').forEach((square) => {
    square.style.setProperty('fill','#d6cfbf','important');
  });
  boardEl.querySelectorAll('.cm-chessboard .square.black').forEach((square) => {
    square.style.setProperty('fill','#246f77','important');
  });
}

function watchBoardSquareColors() {
  if (boardEl._shatranjColorObserver) return;
  const observer = new MutationObserver(() => forceBoardSquareColors());
  observer.observe(boardEl, { childList: true, subtree: true });
  boardEl._shatranjColorObserver = observer;
}

function ensureBoard() {
  if (cmBoard) return cmBoard;
  ensureCmStyles();
  boardEl.className = 'cm-board-host';
  cmBoard = new Chessboard(boardEl, {
    position: game.fen(),
    orientation: COLOR.white,
    responsive: true,
    assetsUrl: 'assets/',
    style: {
      cssClass: 'shatranj',
      showCoordinates: false,
      borderType: BORDER_TYPE.none,
      pieces: { file: 'pieces/shatranj-approved-20260904.svg?v=20260905-3', tileSize: 40 },
      animationDuration: 180
    }
  });
  cmBoard.enableMoveInput(handleBoardInput, COLOR.white);
  forceBoardSquareColors();
  watchBoardSquareColors();
  return cmBoard;
}

function renderBoard(animated = true) {
  ensureBoard().setPosition(game.fen(), animated);
  forceBoardSquareColors();
}

function setComputerStatus(text) {
  if (!topPlayerLive) return;
  const status = topPlayerLive.querySelector('.status');
  if (status) status.textContent = text;
}

function formatClock(ms) {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}

function currentClockMs(side) {
  let remaining = side === 'player' ? playerTimeMs : computerTimeMs;
  if (!finished && clockActiveSide === side && clockAnchorMs) {
    remaining -= Date.now() - clockAnchorMs;
  }
  return Math.max(0, remaining);
}

function commitActiveClock() {
  if (!clockActiveSide || !clockAnchorMs) return;
  const remaining = currentClockMs(clockActiveSide);
  if (clockActiveSide === 'player') playerTimeMs = remaining;
  else computerTimeMs = remaining;
  clockAnchorMs = Date.now();
}

function switchClock(side) {
  commitActiveClock();
  clockActiveSide = side;
  clockAnchorMs = Date.now();
  renderClocks();
}

function updateClockElement(element, remaining, totalMs) {
  if (!element) return;
  element.textContent = formatClock(remaining);
  element.classList.toggle('danger', remaining <= 60_000);
  const progress = element.closest('.clock-box')?.querySelector('.clock-progress span');
  if (progress) {
    const pct = totalMs > 0 ? Math.max(0, Math.min(100, (remaining / totalMs) * 100)) : 0;
    progress.style.width = `${pct}%`;
  }
}

function renderClocks() {
  const totalMs = Math.max(1, Number(selectedMinutes || 0) * 60_000);
  updateClockElement(bottomClockEl, currentClockMs('player'), totalMs);
  updateClockElement(topClockEl, currentClockMs('computer'), totalMs);
}

function syncRatedClocks(payload, computerCapMs = null) {
  if (!payload) return;
  playerTimeMs = Math.max(0, Number(payload.player_time_ms) || 0);
  const serverComputerTimeMs = Math.max(0, Number(payload.computer_time_ms) || 0);
  computerTimeMs = computerCapMs !== null && Number.isFinite(Number(computerCapMs))
    ? Math.max(0, Math.min(serverComputerTimeMs, computerCapMs))
    : serverComputerTimeMs;
  if (payload.status === 'active') {
    const serverNow = Date.parse(String(payload.server_now || ''));
    const turnStarted = Date.parse(String(payload.turn_started_at || ''));
    if (Number.isFinite(serverNow) && Number.isFinite(turnStarted)) {
      playerTimeMs = Math.max(0, playerTimeMs - Math.max(0, serverNow - turnStarted));
    }
    clockActiveSide = 'player';
    clockAnchorMs = Date.now();
  } else {
    clockActiveSide = null;
    clockAnchorMs = 0;
  }
  renderClocks();
}

async function requestRatedTimeout() {
  if (!ratedMode || !ratedGameId || finished || ratedTimeoutPending) return;
  ratedTimeoutPending = true;
  try {
    const payload = await invokeComputer({ action: 'timeout', game_id: ratedGameId });
    if (payload?.fen) {
      game.load(payload.fen);
      renderBoard(false);
    }
    syncRatedClocks(payload);
    if (payload?.status === 'finished') finishRatedResult(payload);
  } catch (error) {
    console.error(error);
    clockAnchorMs = Date.now();
    toast('تعذر التحقق من انتهاء الوقت. سنحاول مجددًا.');
  } finally {
    ratedTimeoutPending = false;
  }
}

function startClockLoop() {
  clearInterval(clockTimer);
  renderClocks();
  clockTimer = setInterval(() => {
    if (finished || !selectedMinutes) return;
    renderClocks();
    if (clockActiveSide === 'player' && currentClockMs('player') <= 0) {
      if (ratedMode) {
        requestRatedTimeout();
      } else {
        commitActiveClock();
        clockActiveSide = null;
        finishGame('انتهى وقتك — فاز الكمبيوتر');
      }
    } else if (clockActiveSide === 'computer' && currentClockMs('computer') <= 0 && !ratedMode) {
      commitActiveClock();
      clockActiveSide = null;
      if (engine) engine.postMessage('stop');
      finishGame('انتهى وقت الكمبيوتر — فزت');
    }
  }, 100);
}

function ratingSuffix(rating) {
  if (!ratedMode) return ' — مباراة بدون نقاط.';
  const delta = Number(rating?.rating_delta ?? 0);
  const after = Number(rating?.rating_after);
  if (Number.isFinite(after)) {
    currentRating = after;
    bottomRatingEl.textContent = String(after);
  }
  if (delta > 0) return ` — +${delta} نقطة.`;
  if (delta < 0) return ` — ${delta} نقطة.`;
  return ' — 0 نقطة.';
}

function finishGame(message, rating = null) {
  if (finished) return;
  finished = true;
  thinking = false;
  clearInterval(clockTimer);
  clockTimer = null;
  clockActiveSide = null;
  clearMoveHints();
  if (cmBoard?.disableMoveInput) cmBoard.disableMoveInput();
  setComputerStatus('انتهت المباراة');
  renderClocks();
  toast(`${message}${ratingSuffix(rating)}`, 5200);
}

function finishRatedResult(payload, computerCapMs = null) {
  const messages = {
    win: 'فزت على الكمبيوتر',
    loss: 'فاز الكمبيوتر',
    draw: 'انتهت المباراة بالتعادل'
  };
  if (payload) syncRatedClocks(payload, computerCapMs);
  finishGame(messages[payload?.result] || 'انتهت المباراة', payload?.rating || null);
}

function checkGuestGameResult() {
  if (game.in_checkmate()) {
    finishGame(game.turn() === 'b' ? 'فزت على الكمبيوتر' : 'فاز الكمبيوتر');
    return true;
  }
  if (game.in_draw()) {
    finishGame('انتهت المباراة بالتعادل');
    return true;
  }
  return false;
}

async function invokeComputer(body) {
  if (!supabase) throw new Error('Supabase unavailable');
  const { data, error } = await supabase.functions.invoke('computer-game', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function parseEngineLine(data) {
  const text = String(data ?? '');
  text.split(/\r?\n/).forEach((line) => {
    const msg = line.trim();
    if (!msg) return;
    if (msg === 'uciok' && uciResolver) {
      const resolve = uciResolver;
      uciResolver = null;
      resolve();
      return;
    }
    if (msg === 'readyok' && readyResolver) {
      const resolve = readyResolver;
      readyResolver = null;
      resolve();
      return;
    }
    if (msg.startsWith('bestmove ') && bestMoveResolver) {
      const move = msg.split(/\s+/)[1] || '(none)';
      const resolve = bestMoveResolver;
      bestMoveResolver = null;
      resolve(move);
    }
  });
}

function waitForEngineSignal(kind, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (kind === 'uci') uciResolver = null;
      if (kind === 'ready') readyResolver = null;
      reject(new Error(`engine ${kind} timeout`));
    }, timeout);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    if (kind === 'uci') uciResolver = done;
    else readyResolver = done;
  });
}

async function initEngine() {
  if (engineReady) return;
  if (engineInitPromise) return engineInitPromise;
  engineInitPromise = (async () => {
    try {
      if (typeof Worker !== 'function') throw new Error('Web Worker unavailable');
      engine = new Worker('vendor/stockfish/stockfish-18-lite-single.js');
      engine.onmessage = (event) => parseEngineLine(event.data);
      engine.onerror = (event) => {
        console.error('Stockfish worker error', event);
        engineFailed = true;
      };
      const uciWait = waitForEngineSignal('uci');
      engine.postMessage('uci');
      await uciWait;
      const readyWait = waitForEngineSignal('ready');
      engine.postMessage('isready');
      await readyWait;
      engineReady = true;
    } catch (error) {
      console.error(error);
      engineFailed = true;
      throw error;
    }
  })();
  return engineInitPromise;
}

function requestBestMove() {
  if (!engineReady || !engine || !selectedLevel) return Promise.reject(new Error('engine not ready'));
  const level = LEVELS[selectedLevel];
  engine.postMessage(`setoption name Skill Level value ${level.skill}`);
  engine.postMessage(`position fen ${game.fen()}`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      bestMoveResolver = null;
      reject(new Error('bestmove timeout'));
    }, 12000);
    bestMoveResolver = (move) => {
      clearTimeout(timer);
      resolve(move);
    };
    engine.postMessage(`go movetime ${level.movetime}`);
  });
}

async function computerTurn() {
  if (ratedMode || finished || thinking || game.turn() !== 'b') return;
  thinking = true;
  setComputerStatus('يفكر…');
  try {
    const best = await requestBestMove();
    if (finished) return;
    if (!best || best === '(none)' || best === '0000') {
      if (!checkGuestGameResult()) finishGame('تعذر على الكمبيوتر إكمال المباراة');
      return;
    }
    const move = game.move({
      from: best.slice(0, 2),
      to: best.slice(2, 4),
      promotion: best[4] || 'q'
    });
    if (!move) throw new Error(`invalid engine move: ${best}`);
    renderBoard(true);
    if (!checkGuestGameResult()) {
      switchClock('player');
      setComputerStatus('جاهز');
    }
  } catch (error) {
    console.error(error);
    if (!finished) finishGame('حدث خطأ في محرك الكمبيوتر');
  } finally {
    thinking = false;
  }
}

async function fetchRatedState() {
  if (!ratedMode || !ratedGameId) return null;
  try {
    return await invokeComputer({ action: 'state', game_id: ratedGameId });
  } catch (error) {
    console.error('computer state reconciliation failed', error);
    return null;
  }
}

async function submitRatedMove(move) {
  if (!ratedGameId || finished) return;
  thinking = true;
  setComputerStatus('يفكر…');
  try {
    const payload = await invokeComputer({
      action: 'move',
      game_id: ratedGameId,
      from: move.from,
      to: move.to,
      promotion: move.promotion || 'q'
    });
    if (!payload?.fen) throw new Error('Missing server position');
  const localComputerRemaining = currentClockMs('computer');
  game.load(payload.fen);
  renderBoard(true);
  syncRatedClocks(payload, localComputerRemaining);
  if (payload.status === 'finished') finishRatedResult(payload, localComputerRemaining);
  else setComputerStatus('جاهز');
  } catch (error) {
    console.error(error);
    const authoritative = await fetchRatedState();
    if (authoritative?.fen) {
      game.load(authoritative.fen);
      renderBoard(false);
      syncRatedClocks(authoritative);
      if (authoritative.status === 'finished') finishRatedResult(authoritative);
      else {
        setComputerStatus('جاهز');
        toast('تمت مزامنة المباراة مع الخادم.');
      }
    } else {
      game.undo();
      renderBoard(false);
      clockActiveSide = 'player';
      clockAnchorMs = Date.now();
      setComputerStatus('جاهز');
      toast('تعذر اعتماد الحركة. أُعيدت الرقعة إلى آخر وضع معتمد.');
    }
  } finally {
    thinking = false;
  }
}

function handleBoardInput(event) {
  if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
    if (!selectedLevel || !selectedMinutes || finished || thinking || game.turn() !== 'w') return false;
    if (currentClockMs('player') <= 0) {
      if (ratedMode) requestRatedTimeout();
      return false;
    }
    const piece = game.get(event.squareFrom);
    if (!piece || piece.color !== 'w') return false;
    showMoveHints(event.squareFrom);
    return true;
  }

  if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
    if (!selectedLevel || !selectedMinutes || finished || thinking || game.turn() !== 'w') return false;
    if (currentClockMs('player') <= 0) {
      if (ratedMode) requestRatedTimeout();
      return false;
    }
    const legal = game.moves({ square: event.squareFrom, verbose: true });
    const candidate = legal.find((move) => move.to === event.squareTo);
    if (!candidate) return false;
    clearMoveHints();
    const move = game.move({ from: event.squareFrom, to: event.squareTo, promotion: 'q' });
    if (!move) return false;

    if (ratedMode) {
    switchClock('computer');
    Promise.resolve().then(() => submitRatedMove(move));
  } else {
      switchClock('computer');
      if (!checkGuestGameResult()) setTimeout(computerTurn, 180);
    }
    return true;
  }

  if (event.type === INPUT_EVENT_TYPE.moveInputCanceled) clearMoveHints();
  return true;
}

function setPlayingLayout(levelKey, minutes, player = null) {
  const level = LEVELS[levelKey];
  const initialMs = minutes * 60_000;
  document.body.classList.remove('pregame');
  document.body.classList.add('live-game', 'computer-game');
  opponentSearchPanel.hidden = true;
  topPlayerLive.hidden = false;
  topNameEl.textContent = 'الكمبيوتر';
  topNameEl.removeAttribute('href');
  topLocationEl.textContent = `مستوى ${level.label} — ${minutes} دقائق — ±${level.points} نقطة`;
  topRatingEl.textContent = `±${level.points}`;
  bottomNameEl.textContent = player?.name || 'أنت';
  bottomLocationEl.textContent = ratedMode ? `مباراة نقاط ±${level.points}` : 'مباراة بدون نقاط';
  bottomRatingEl.textContent = ratedMode && Number.isFinite(Number(player?.rating)) ? String(player.rating) : '—';
  playerTimeMs = initialMs;
  computerTimeMs = initialMs;
  clockActiveSide = 'player';
  clockAnchorMs = Date.now();
  document.querySelectorAll('.clock-progress').forEach((el) => { el.style.display = ''; });
  if (reportBtn) {
    reportBtn.disabled = true;
    reportBtn.title = 'الإبلاغ غير متاح في مباراة الكمبيوتر';
  }
  if (resignBtn) resignBtn.disabled = false;
  if (drawOfferBtn) drawOfferBtn.disabled = false;
  if (endGraceBtn) endGraceBtn.disabled = false;
  if (endGraceCountdownEl) endGraceCountdownEl.hidden = true;
  const note = endGraceBtn?.querySelector('.grace-note');
  if (note) note.hidden = true;
  setComputerStatus('جاهز');
  startClockLoop();
}

async function startComputerGame(levelKey, minutes) {
  if (!LEVELS[levelKey] || selectedLevel !== levelKey || selectedMinutes || !TIME_CONTROLS.includes(Number(minutes))) return;
  selectedMinutes = Number(minutes);
  const buttons = [...document.querySelectorAll('#opponentTimeOptions .opponent-time-option, .opponent-time-options .opponent-time-option')];
  buttons.forEach((button) => { button.disabled = true; });
  const title = opponentSearchSetup?.querySelector('.opponent-search-title');
  if (title) title.textContent = 'جارٍ تجهيز المباراة…';

  try {
    let session = null;
    if (supabase) {
      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data?.session || null;
    }

    game.reset();
    finished = false;
    ratedMode = Boolean(session);
    ratedAccessToken = session?.access_token || null;
    ratedTimeoutPending = false;

    if (ratedMode) {
      const started = await invokeComputer({ action: 'start', level: levelKey, minutes });
      ratedGameId = started.game_id;
      currentRating = Number(started.rating);
      if (!ratedGameId || !started.fen) throw new Error('Rated computer game was not created');
      game.load(started.fen);
      setPlayingLayout(levelKey, selectedMinutes, { name: started.player_name, rating: started.rating });
      syncRatedClocks(started);
    } else {
      ratedGameId = null;
      currentRating = null;
      await initEngine();
      if (engineFailed) throw new Error('engine failed');
      setPlayingLayout(levelKey, selectedMinutes);
    }

    renderCoords();
    renderBoard(false);
  } catch (error) {
    console.error(error);
    selectedLevel = null;
    selectedMinutes = null;
    ratedMode = false;
    ratedGameId = null;
    ratedAccessToken = null;
    clearInterval(clockTimer);
    clockTimer = null;
    setupLevelChooser();
    toast('تعذر بدء مباراة الكمبيوتر.');
  }
}

async function resignComputerGame({ navigate = false, ask = false } = {}) {
  if (leaving) return;
  if (!selectedLevel || !selectedMinutes || finished) {
    if (navigate) location.href = 'index.html';
    return;
  }
  if (ask && !confirm(`هل تريد الاستسلام؟ سيتم خصم ${LEVELS[selectedLevel].points} نقطة إذا كنت مسجلًا.`)) return;

  leaving = true;
  try {
    if (ratedMode && ratedGameId) {
      const payload = await invokeComputer({ action: 'resign', game_id: ratedGameId });
      finishRatedResult(payload);
    } else {
      finishGame('استسلمت أمام الكمبيوتر');
    }
  } catch (error) {
    console.error(error);
    toast('تعذر اعتماد نهاية المباراة.');
  } finally {
    leaving = false;
    if (navigate) location.href = 'index.html';
  }
}

function addTimeChooserBack() {
  const existing = opponentSearchSetup?.querySelector('.computer-time-back');
  if (existing) existing.remove();
  const options = opponentSearchSetup?.querySelector('.opponent-time-options');
  if (!options) return;
  if (opponentSearchSetup) opponentSearchSetup.style.position = 'relative';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'computer-time-back';
  back.setAttribute('aria-label', 'الرجوع لاختيار مستوى الكمبيوتر');
  back.innerHTML = '<span aria-hidden="true">›</span>';
  back.style.cssText = 'position:absolute;inset-inline-end:16px;top:12px;width:64px;height:64px;border:1px solid rgba(224,181,103,.55);border-radius:16px;background:rgba(3,43,48,.28);color:#f6ead8;font:800 42px/1 Arial,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;z-index:3;';
  back.onclick = () => {
    back.remove();
    setupLevelChooser();
  };
  options.parentNode.insertBefore(back, options);
}

function setupTimeChooser(levelKey) {
  const level = LEVELS[levelKey];
  const title = opponentSearchSetup?.querySelector('.opponent-search-title');
  if (title) {
    title.textContent = `اختر زمن المباراة — مستوى ${level.label}`;
    title.style.setProperty('text-align', 'center', 'important');
    title.style.setProperty('font-size', 'clamp(18px, 4vw, 34px)', 'important');
    title.style.setProperty('line-height', '1.2', 'important');
    title.style.setProperty('white-space', 'nowrap', 'important');
    title.style.setProperty('width', '100%', 'important');
    title.style.setProperty('box-sizing', 'border-box', 'important');
    title.style.setProperty('padding-inline', '72px', 'important');
  }
  addTimeChooserBack();
  const buttons = [...document.querySelectorAll('.opponent-time-options .opponent-time-option')];
  buttons.forEach((button, index) => {
    const minutes = TIME_CONTROLS[index];
    button.disabled = false;
    button.removeAttribute('data-level');
    button.dataset.minutes = String(minutes);
    button.innerHTML = `<strong>${minutes}</strong><span>دقائق</span>`;
    button.onclick = () => startComputerGame(levelKey, minutes);
  });
  if (topPlayerCard) topPlayerCard.setAttribute('aria-label', 'اختيار زمن مباراة الكمبيوتر');
}

function setupLevelChooser() {
  opponentSearchSetup?.querySelector('.computer-time-back')?.remove();
  selectedLevel = null;
  selectedMinutes = null;
  if (opponentSearchWaiting) opponentSearchWaiting.hidden = true;
  if (opponentSearchSetup) opponentSearchSetup.hidden = false;
  if (topPlayerLive) topPlayerLive.hidden = true;
  const title = opponentSearchSetup?.querySelector('.opponent-search-title');
  if (title) {
    ['text-align', 'font-size', 'line-height', 'white-space', 'width', 'box-sizing', 'padding-inline'].forEach((prop) => title.style.removeProperty(prop));
    title.textContent = 'اختر مستوى الكمبيوتر — النقاط للمسجلين';
  }
  if (opponentSearchSetup) opponentSearchSetup.style.removeProperty('position');
  const buttons = [...document.querySelectorAll('.opponent-time-options .opponent-time-option')];
  const levels = [
    ['easy', 'سهل', '±5 نقاط'],
    ['medium', 'متوسط', '±10 نقاط'],
    ['hard', 'صعب', '±20 نقطة']
  ];
  buttons.forEach((button, index) => {
    const [key, label, sub] = levels[index];
    button.disabled = false;
    button.removeAttribute('data-minutes');
    button.dataset.level = key;
    button.innerHTML = `<strong>${label}</strong><span>${sub}</span>`;
    button.onclick = () => {
      if (selectedLevel) return;
      selectedLevel = key;
      setupTimeChooser(key);
    };
  });
  if (topPlayerCard) topPlayerCard.setAttribute('aria-label', 'اختيار مستوى الكمبيوتر');
  if (resignBtn) resignBtn.disabled = true;
  if (drawOfferBtn) drawOfferBtn.disabled = true;
  if (endGraceBtn) {
    endGraceBtn.disabled = false;
    endGraceBtn.onclick = () => resignComputerGame({ navigate: true });
  }
  if (leaveBtn) leaveBtn.onclick = () => resignComputerGame({ navigate: true });
  if (reportBtn) reportBtn.disabled = true;
}

resignBtn?.addEventListener('click', () => resignComputerGame({ ask: true }));

drawOfferBtn?.addEventListener('click', () => {
  if (!selectedLevel || !selectedMinutes || finished) return;
  toast('عرض التعادل غير متاح ضد الكمبيوتر.');
});

window.addEventListener('pagehide', () => {
  clearInterval(clockTimer);
  if (engine) engine.terminate();
  if (!ratedMode || !ratedGameId || !ratedAccessToken || finished || leaving || !cfg.url || !cfg.anonKey) return;
  fetch(`${cfg.url}/functions/v1/computer-game`, {
    method: 'POST',
    keepalive: true,
    headers: {
      Authorization: `Bearer ${ratedAccessToken}`,
      apikey: cfg.anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'resign', game_id: ratedGameId })
  }).catch(() => {});
});

setupLevelChooser();
renderCoords();
ensureBoard();
