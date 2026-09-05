import { Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const LEVELS = {
  easy: { skill: 2, movetime: 140, label: 'سهل', points: 5 },
  medium: { skill: 8, movetime: 320, label: 'متوسط', points: 10 },
  hard: { skill: 16, movetime: 700, label: 'صعب', points: 20 }
};

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
  clearMoveHints();
  if (cmBoard?.disableMoveInput) cmBoard.disableMoveInput();
  setComputerStatus('انتهت المباراة');
  toast(`${message}${ratingSuffix(rating)}`, 5200);
}

function finishRatedResult(payload) {
  const messages = {
    win: 'فزت على الكمبيوتر',
    loss: 'فاز الكمبيوتر',
    draw: 'انتهت المباراة بالتعادل'
  };
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
    if (!checkGuestGameResult()) setComputerStatus('جاهز');
  } catch (error) {
    console.error(error);
    finishGame('حدث خطأ في محرك الكمبيوتر');
  } finally {
    thinking = false;
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
    game.load(payload.fen);
    renderBoard(true);
    if (payload.status === 'finished') {
      finishRatedResult(payload);
    } else {
      setComputerStatus('جاهز');
    }
  } catch (error) {
    console.error(error);
    game.undo();
    renderBoard(false);
    setComputerStatus('جاهز');
    toast('تعذر اعتماد الحركة. أُعيدت الرقعة إلى آخر وضع معتمد.');
  } finally {
    thinking = false;
  }
}

function handleBoardInput(event) {
  if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
    if (!selectedLevel || finished || thinking || game.turn() !== 'w') return false;
    const piece = game.get(event.squareFrom);
    if (!piece || piece.color !== 'w') return false;
    showMoveHints(event.squareFrom);
    return true;
  }

  if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
    if (!selectedLevel || finished || thinking || game.turn() !== 'w') return false;
    const legal = game.moves({ square: event.squareFrom, verbose: true });
    const candidate = legal.find((move) => move.to === event.squareTo);
    if (!candidate) return false;
    clearMoveHints();
    const move = game.move({ from: event.squareFrom, to: event.squareTo, promotion: 'q' });
    if (!move) return false;
    renderBoard(false);

    if (ratedMode) {
      Promise.resolve().then(() => submitRatedMove(move));
    } else if (!checkGuestGameResult()) {
      setTimeout(computerTurn, 180);
    }
    return true;
  }

  if (event.type === INPUT_EVENT_TYPE.moveInputCanceled) {
    clearMoveHints();
  }
  return true;
}

function setPlayingLayout(levelKey, player = null) {
  const level = LEVELS[levelKey];
  document.body.classList.remove('pregame');
  document.body.classList.add('live-game', 'computer-game');
  opponentSearchPanel.hidden = true;
  topPlayerLive.hidden = false;
  topNameEl.textContent = 'الكمبيوتر';
  topNameEl.removeAttribute('href');
  topLocationEl.textContent = `مستوى ${level.label} — ±${level.points} نقطة`;
  topRatingEl.textContent = `±${level.points}`;
  bottomNameEl.textContent = player?.name || 'أنت';
  bottomLocationEl.textContent = ratedMode ? `مباراة نقاط ±${level.points}` : 'مباراة بدون نقاط';
  bottomRatingEl.textContent = ratedMode && Number.isFinite(Number(player?.rating)) ? String(player.rating) : '—';
  topClockEl.textContent = '∞';
  bottomClockEl.textContent = '∞';
  document.querySelectorAll('.clock-progress').forEach((el) => { el.style.display = 'none'; });
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
}

async function startComputerGame(levelKey) {
  if (!LEVELS[levelKey] || selectedLevel) return;
  selectedLevel = levelKey;
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

    if (ratedMode) {
      const started = await invokeComputer({ action: 'start', level: levelKey });
      ratedGameId = started.game_id;
      currentRating = Number(started.rating);
      if (!ratedGameId || !started.fen) throw new Error('Rated computer game was not created');
      game.load(started.fen);
      setPlayingLayout(levelKey, { name: started.player_name, rating: started.rating });
    } else {
      ratedGameId = null;
      currentRating = null;
      await initEngine();
      if (engineFailed) throw new Error('engine failed');
      setPlayingLayout(levelKey);
    }

    renderCoords();
    renderBoard(false);
  } catch (error) {
    console.error(error);
    selectedLevel = null;
    ratedMode = false;
    ratedGameId = null;
    ratedAccessToken = null;
    buttons.forEach((button) => { button.disabled = false; });
    if (title) title.textContent = 'تعذر بدء المباراة — حاول مرة أخرى';
    toast('تعذر بدء مباراة الكمبيوتر.');
  }
}

async function resignComputerGame({ navigate = false, ask = false } = {}) {
  if (leaving) return;
  if (!selectedLevel || finished) {
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

function setupLevelChooser() {
  if (opponentSearchWaiting) opponentSearchWaiting.hidden = true;
  if (opponentSearchSetup) opponentSearchSetup.hidden = false;
  if (topPlayerLive) topPlayerLive.hidden = true;
  const title = opponentSearchSetup?.querySelector('.opponent-search-title');
  if (title) title.textContent = 'اختر مستوى الكمبيوتر — النقاط للمسجلين';
  const buttons = [...document.querySelectorAll('.opponent-time-options .opponent-time-option')];
  const levels = [
    ['easy', 'سهل', '±5 نقاط'],
    ['medium', 'متوسط', '±10 نقاط'],
    ['hard', 'صعب', '±20 نقطة']
  ];
  buttons.forEach((button, index) => {
    const [key, label, sub] = levels[index];
    button.removeAttribute('data-minutes');
    button.dataset.level = key;
    button.innerHTML = `<strong>${label}</strong><span>${sub}</span>`;
    button.addEventListener('click', () => startComputerGame(key));
  });
  if (topPlayerCard) topPlayerCard.setAttribute('aria-label', 'اختيار مستوى الكمبيوتر');
  if (resignBtn) resignBtn.disabled = true;
  if (drawOfferBtn) drawOfferBtn.disabled = true;
  if (endGraceBtn) {
    endGraceBtn.disabled = false;
    endGraceBtn.addEventListener('click', () => resignComputerGame({ navigate: true }));
  }
  if (leaveBtn) leaveBtn.addEventListener('click', () => resignComputerGame({ navigate: true }));
  if (reportBtn) reportBtn.disabled = true;
}

resignBtn?.addEventListener('click', () => resignComputerGame({ ask: true }));

drawOfferBtn?.addEventListener('click', () => {
  if (!selectedLevel || finished) return;
  toast('عرض التعادل غير متاح ضد الكمبيوتر.');
});

window.addEventListener('pagehide', () => {
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
