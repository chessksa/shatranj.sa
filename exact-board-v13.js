// cm-chessboard owns the board rendering. This file only fixes mobile layout flow.
(() => {
  const layout = document.querySelector('.layout');
  const side = document.querySelector('.side-panel');
  const stack = document.querySelector('.panel-stack');
  const boardPanel = document.querySelector('.board-panel');
  if (!layout || !side || !stack || !boardPanel) return;

  const mobileQuery = window.matchMedia('(max-width: 900px)');

  function clearMobileInlineLayout() {
    for (const [el, props] of [
      [side, ['display', 'width', 'height', 'align-self']],
      [stack, ['display', 'flex-direction', 'width', 'height', 'gap']]
    ]) {
      props.forEach((prop) => el.style.removeProperty(prop));
      if (!el.getAttribute('style')) el.removeAttribute('style');
    }
  }

  function syncBoardFlow() {
    if (mobileQuery.matches) {
      // Mobile Safari/Chrome can mishandle order across nested display:contents wrappers.
      // Make the board a direct flex child beside the player cards so order: 0..4 is reliable.
      if (boardPanel.parentElement !== stack) stack.appendChild(boardPanel);

      side.style.display = 'block';
      side.style.width = '100%';
      side.style.height = 'auto';
      side.style.alignSelf = 'stretch';

      stack.style.display = 'flex';
      stack.style.flexDirection = 'column';
      stack.style.width = '100%';
      stack.style.height = 'auto';
      stack.style.gap = '10px';
      return;
    }

    clearMobileInlineLayout();
    if (boardPanel.parentElement !== layout) layout.insertBefore(boardPanel, side);
  }

  syncBoardFlow();
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', syncBoardFlow);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(syncBoardFlow);
  }
})();
