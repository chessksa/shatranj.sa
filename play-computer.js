import { Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';

const LEVELS = {
  easy: { skill: 2, movetime: 140, label: 'سهل' },
  medium: { skill: 8, movetime: 320, label: 'متوسط' },
  hard: { skill: 16, movetime: 700, label: 'صعب' }
};

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
  return cmBoard;
}

function renderBoard(animated = true) {
  ensureBoard().setPosition(game.fen(), animated);
}

function setComputerStatus(text) {
  if (!topPlayerLive) return;
  const status = topPlayerLive.querySelector('.status');
  if (status) status.textContent = text;
}

function finishGame(message) {
  finished = true;
  thinking = false;
  clearMoveHints();
  if (cmBoard?.disableMoveInput) cmBoard.disableMoveInput();
  setComputerStatus('انتهت المباراة');
  toast(`${message} — لا تؤثر هذه المباراة على نقاطك.`, 5000);
}

function checkGameResult() {
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
  if (finished || thinking || game.turn() !== 'b') return;
  thinking = true;
  setComputerStatus('يفكر…');
  try {
    const best = await requestBestMove();
    if (!best || best === '(none)' || best === '0000') {
      if (!checkGameResult()) finishGame('تعذر على الكمبيوتر إكمال المباراة');
      return;
    }
    const move = game.move({
      from: best.slice(0, 2),
      to: best.slice(2, 4),
      promotion: best[4] || 'q'
    });
    if (!move) throw new Error(`invalid engine move: ${best}`);
    renderBoard(true);
    if (!checkGameResult()) setComputerStatus('جاهز');
  } catch (error) {
    console.error(error);
    finishGame('حدث خطأ في محرك الكمبيوتر');
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
    if (!legal.some((move) => move.to === event.squareTo)) return false;
    clearMoveHints();
    const move = game.move({ from: event.squareFrom, to: event.squareTo, promotion: 'q' });
    if (!move) return false;
    Promise.resolve().then(() => {
      renderBoard(false);
      if (!checkGameResult()) setTimeout(computerTurn, 180);
    });
    return true;
  }

  if (event.type === INPUT_EVENT_TYPE.moveInputCanceled) {
    clearMoveHints();
  }
  return true;
}

function setPlayingLayout(levelKey) {
  const level = LEVELS[levelKey];
  document.body.classList.remove('pregame');
  document.body.classList.add('live-game', 'computer-game');
  opponentSearchPanel.hidden = true;
  topPlayerLive.hidden = false;
  topNameEl.textContent = 'الكمبيوتر';
  topNameEl.removeAttribute('href');
  topLocationEl.textContent = `مستوى ${level.label}`;
  topRatingEl.textContent = '—';
  bottomNameEl.textContent = 'أنت';
  bottomLocationEl.textContent = 'مباراة تدريبية';
  bottomRatingEl.textContent = '—';
  topClockEl.textContent = '∞';
  bottomClockEl.textContent = '∞';
  document.querySelectorAll('.clock-progress').forEach((el) => { el.style.display = 'none'; });
  if (reportBtn) {
    reportBtn.disabled = true;
    reportBtn.title = 'الإبلاغ غير متاح في مباراة الكمبيوتر';
  }
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
  if (title) title.textContent = 'جارٍ تحميل الكمبيوتر…';
  try {
    await initEngine();
    if (engineFailed) throw new Error('engine failed');
    game.reset();
    setPlayingLayout(levelKey);
    renderCoords();
    renderBoard(false);
  } catch (error) {
    console.error(error);
    selectedLevel = null;
    buttons.forEach((button) => { button.disabled = false; });
    if (title) title.textContent = 'تعذر تحميل الكمبيوتر — حاول مرة أخرى';
    toast('تعذر تحميل محرك Stockfish.');
  }
}

function setupLevelChooser() {
  if (opponentSearchWaiting) opponentSearchWaiting.hidden = true;
  if (opponentSearchSetup) opponentSearchSetup.hidden = false;
  if (topPlayerLive) topPlayerLive.hidden = true;
  const title = opponentSearchSetup?.querySelector('.opponent-search-title');
  if (title) title.textContent = 'اختر مستوى الكمبيوتر';
  const buttons = [...document.querySelectorAll('.opponent-time-options .opponent-time-option')];
  const levels = [
    ['easy', 'سهل', 'للتدريب'],
    ['medium', 'متوسط', 'متوازن'],
    ['hard', 'صعب', 'تحدٍ قوي']
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
    endGraceBtn.addEventListener('click', () => { location.href = 'index.html'; });
  }
  if (leaveBtn) leaveBtn.addEventListener('click', () => { location.href = 'index.html'; });
  if (reportBtn) reportBtn.disabled = true;
}

resignBtn?.addEventListener('click', () => {
  if (!selectedLevel || finished) return;
  if (!confirm('هل تريد الاستسلام؟')) return;
  finishGame('استسلمت أمام الكمبيوتر');
});

drawOfferBtn?.addEventListener('click', () => {
  if (!selectedLevel || finished) return;
  toast('عرض التعادل غير متاح ضد الكمبيوتر.');
});

window.addEventListener('beforeunload', () => {
  if (engine) engine.terminate();
});

setupLevelChooser();
renderCoords();
ensureBoard();
