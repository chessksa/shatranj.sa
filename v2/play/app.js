const BOARD_ID = 'v2-board';
const PIECE_ROOT = 'assets/pieces/';

const startingBackRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

function pieceAsset(color, type) {
  return `${PIECE_ROOT}${color}${type}.png`;
}

function startingPieceAt(rank, file) {
  if (rank === 8) return ['b', startingBackRank[file]];
  if (rank === 7) return ['b', 'p'];
  if (rank === 2) return ['w', 'p'];
  if (rank === 1) return ['w', startingBackRank[file]];
  return null;
}

function renderStartingBoard() {
  const board = document.getElementById(BOARD_ID);
  if (!board) return;
  const fragment = document.createDocumentFragment();

  for (let rank = 8; rank >= 1; rank -= 1) {
    for (let file = 0; file < 8; file += 1) {
      const square = document.createElement('div');
      const isLight = (rank + file) % 2 === 0;
      square.className = `v2-square ${isLight ? 'light' : 'dark'}`;
      square.setAttribute('role', 'gridcell');
      square.dataset.square = `${String.fromCharCode(97 + file)}${rank}`;

      const piece = startingPieceAt(rank, file);
      if (piece) {
        const image = document.createElement('img');
        image.className = 'v2-piece';
        image.src = pieceAsset(piece[0], piece[1]);
        image.alt = '';
        image.draggable = false;
        square.appendChild(image);
      }
      fragment.appendChild(square);
    }
  }

  board.replaceChildren(fragment);
}

renderStartingBoard();
