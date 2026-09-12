import { Chessboard, COLOR, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';
import { Markers } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/extensions/markers/Markers.js';
import { loadBoardPreferences } from './v2/board/controller.mjs';
import { getBoardThemeSolidPair } from './v2/board/themes.mjs';

const LAST_MOVE_MARKER = { class: 'marker-frame-last-move', slice: 'markerFrame', position: 'above' };

function applyResultColors() {
  const resultNode = document.getElementById('gameResult');
  if (!resultNode) return;

  const cards = [
    document.getElementById('whiteCard'),
    document.getElementById('blackCard'),
    document.getElementById('playerCard'),
    document.getElementById('computerCard')
  ].filter(Boolean);

  cards.forEach((card) => card.classList.remove('result-winner', 'result-loser', 'result-draw'));

  const result = String(resultNode.textContent || '').trim();
  if (!result || result === '—') return;

  if (result.includes('تعادل')) {
    cards.forEach((card) => card.classList.add('result-draw'));
    return;
  }

  let winner = null;
  let loser = null;
  if (result.includes('فوز الأبيض')) {
    winner = document.getElementById('whiteCard');
    loser = document.getElementById('blackCard');
  } else if (result.includes('فوز الأسود')) {
    winner = document.getElementById('blackCard');
    loser = document.getElementById('whiteCard');
  } else if (result.includes('فوز اللاعب')) {
    winner = document.getElementById('playerCard');
    loser = document.getElementById('computerCard');
  } else if (result.includes('فوز الكمبيوتر')) {
    winner = document.getElementById('computerCard');
    loser = document.getElementById('playerCard');
  }

  winner?.classList.add('result-winner');
  loser?.classList.add('result-loser');
}

function ensureSpectatorLayout() {
  if (!document.querySelector('link[data-spectator-play-layout]')) {
    const layout = document.createElement('link');
    layout.rel = 'stylesheet';
    layout.href = 'spectator-play-layout.css?v=20260910-viewfit1';
    layout.dataset.spectatorPlayLayout = '1';
    document.head.appendChild(layout);
  }
  document.documentElement.classList.add('spectator-play-layout-root');
  document.body.classList.add('spectator-play-layout');

  const resultNode = document.getElementById('gameResult');
  if (resultNode && !resultNode.dataset.resultColorObserver) {
    resultNode.dataset.resultColorObserver = '1';
    new MutationObserver(applyResultColors).observe(resultNode, { childList: true, characterData: true, subtree: true });
  }
  applyResultColors();
}

function ensureStyles() {
  ensureSpectatorLayout();
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
    theme.href = 'cm-chessboard-shatranj-v3.css?v=20260909-spectator3';
    theme.dataset.cmChessboardShatranj = '1';
    document.head.appendChild(theme);
  }
}

function forceBoardSquareColors(host) {
  const { theme } = loadBoardPreferences();
  const colors = getBoardThemeSolidPair(theme);
  host.querySelectorAll('.cm-chessboard .square.white').forEach((square) => {
    square.style.setProperty('fill',colors.light,'important');
  });
  host.querySelectorAll('.cm-chessboard .square.black').forEach((square) => {
    square.style.setProperty('fill',colors.dark,'important');
  });
}

export class SpectatorBoard {
  constructor(host, initialFen) {
    ensureStyles();
    this.host = host;
    this.host.classList.add('cm-board-host');
    this.host.style.setProperty('position','relative','important');
    this.host.style.setProperty('inset','auto','important');
    this.host.style.setProperty('height','auto','important');
    this.board = new Chessboard(host, {
      position: initialFen || 'start',
      orientation: COLOR.white,
      responsive: true,
      assetsUrl: 'assets/',
      extensions: [{ class: Markers, props: { autoMarkers: null, sprite: 'last-move-markers.svg' } }],
      style: {
        cssClass: 'shatranj',
        showCoordinates: false,
        borderType: BORDER_TYPE.none,
        pieces: { file: 'pieces/shatranj-approved-20260904.svg?v=20260905-3', tileSize: 40 },
        animationDuration: 180
      }
    });
    forceBoardSquareColors(this.host);
    this.observer = new MutationObserver(() => forceBoardSquareColors(this.host));
    this.observer.observe(this.host, { childList: true, subtree: true });
    this.storageHandler = (event) => {
      if (event.key === 'shatranj:v2:board-preferences') forceBoardSquareColors(this.host);
    };
    window.addEventListener('storage', this.storageHandler);
    applyResultColors();
  }

  setPosition(fen, lastMove = null) {
    if (!fen) return;
    this.board.setPosition(fen, false);
    this.board.removeMarkers?.(LAST_MOVE_MARKER);
    if (lastMove?.from && lastMove?.to) {
      this.board.addMarker?.(LAST_MOVE_MARKER, lastMove.from);
      this.board.addMarker?.(LAST_MOVE_MARKER, lastMove.to);
    }
    forceBoardSquareColors(this.host);
    applyResultColors();
  }
}
