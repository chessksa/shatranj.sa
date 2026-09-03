(() => {
  const frame = document.querySelector('.board-frame');
  const board = document.getElementById('board');
  if (!frame || !board) return;
  frame.classList.add('exact-board-preview');
  const activateLiveBoard = () => frame.classList.remove('exact-board-preview');
  board.addEventListener('pointerdown', activateLiveBoard, { once: true, capture: true });
  board.addEventListener('keydown', activateLiveBoard, { once: true, capture: true });
})();
