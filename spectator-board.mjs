import { Chessboard, COLOR, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';
import { Markers } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/extensions/markers/Markers.js';

const LAST_MOVE_MARKER = { class: 'marker-frame-last-move', slice: 'markerFrame', position: 'above' };

function ensureStyles() {
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
    theme.href = 'cm-chessboard-shatranj-v3.css?v=20260909-spectator2';
    theme.dataset.cmChessboardShatranj = '1';
    document.head.appendChild(theme);
  }
}

function forceBoardSquareColors(host) {
  host.querySelectorAll('.cm-chessboard .square.white').forEach((square) => {
    square.style.setProperty('fill','#d6cfbf','important');
  });
  host.querySelectorAll('.cm-chessboard .square.black').forEach((square) => {
    square.style.setProperty('fill','#246f77','important');
  });
}

export class SpectatorBoard {
  constructor(host, initialFen) {
    ensureStyles();
    this.host = host;
    this.host.classList.add('cm-board-host');
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
  }
}
