// cm-chessboard owns the board rendering. This file controls responsive layout flow
// and applies the approved mobile live-game presentation.
(() => {
  const layout = document.querySelector('.layout');
  const side = document.querySelector('.side-panel');
  const stack = document.querySelector('.panel-stack');
  const boardPanel = document.querySelector('.board-panel');
  if (!layout || !side || !stack || !boardPanel) return;

  const mobileQuery = window.matchMedia('(max-width: 900px)');
  const referenceCssId = 'playReferenceMobileV14';
  const historyScriptId = 'playReferenceHistoryV14';
  let boardObserver = null;

  function ensureReferenceStyles() {
    if (document.getElementById(referenceCssId)) return;
    const link = document.createElement('link');
    link.id = referenceCssId;
    link.rel = 'stylesheet';
    link.href = 'play-reference-mobile-v14.css?v=20260913-1';
    document.head.appendChild(link);
  }

  function clearMobileInlineLayout() {
    for (const [el, props] of [
      [side, ['display', 'width', 'height', 'align-self']],
      [stack, ['display', 'flex-direction', 'width', 'height', 'gap']]
    ]) {
      props.forEach((prop) => el.style.removeProperty(prop));
      if (!el.getAttribute('style')) el.removeAttribute('style');
    }
  }

  function isLiveMobile() {
    return mobileQuery.matches && document.body.classList.contains('live-game');
  }

  function ensureMoveStrip() {
    if (!isLiveMobile()) return null;
    let strip = document.getElementById('liveMoveStrip');
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'liveMoveStrip';
      strip.className = 'reference-move-strip';
      strip.setAttribute('aria-label', 'سجل الحركات');
      strip.innerHTML = '<span class="move-empty">…</span>';
      const sideHead = stack.querySelector('.side-head-stack');
      if (sideHead?.nextSibling) stack.insertBefore(strip, sideHead.nextSibling);
      else stack.prepend(strip);
    }
    return strip;
  }

  function ensureHistoryModule() {
    if (!isLiveMobile() || document.getElementById(historyScriptId)) return;
    ensureMoveStrip();
    const script = document.createElement('script');
    script.id = historyScriptId;
    script.type = 'module';
    script.src = 'play-reference-history-v14.mjs?v=20260913-1';
    document.body.appendChild(script);
  }

  function applyReferenceBoardPalette() {
    if (!isLiveMobile()) return;
    const board = document.getElementById('board');
    if (!board) return;
    board.querySelectorAll('.cm-chessboard .square.white').forEach((square) => {
      square.style.setProperty('fill', 'rgba(216,179,126,.92)', 'important');
    });
    board.querySelectorAll('.cm-chessboard .square.black').forEach((square) => {
      square.style.setProperty('fill', 'rgba(141,96,59,.92)', 'important');
    });
  }

  function watchReferenceBoardPalette() {
    if (!isLiveMobile()) return;
    const board = document.getElementById('board');
    if (!board || boardObserver) {
      applyReferenceBoardPalette();
      return;
    }
    let scheduled = false;
    boardObserver = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyReferenceBoardPalette();
      });
    });
    boardObserver.observe(board, { childList: true, subtree: true });
    applyReferenceBoardPalette();
  }

  function arrangeLiveMobile() {
    if (!isLiveMobile()) return;
    document.body.classList.add('reference-live-layout');

    const gameActions = document.getElementById('gameActions');
    if (gameActions && gameActions.parentElement !== stack) stack.appendChild(gameActions);

    ensureMoveStrip();
    ensureHistoryModule();
    watchReferenceBoardPalette();

    stack.style.gap = '0';
    requestAnimationFrame(applyReferenceBoardPalette);
    setTimeout(applyReferenceBoardPalette, 120);
  }

  function syncBoardFlow() {
    if (mobileQuery.matches) {
      // Mobile Safari/Chrome can mishandle order across nested display:contents wrappers.
      // Put the board into the same vertical flow as the player rows.
      if (boardPanel.parentElement !== stack) stack.appendChild(boardPanel);

      side.style.display = 'block';
      side.style.width = '100%';
      side.style.height = 'auto';
      side.style.alignSelf = 'stretch';

      stack.style.display = 'flex';
      stack.style.flexDirection = 'column';
      stack.style.width = '100%';
      stack.style.height = 'auto';
      stack.style.gap = isLiveMobile() ? '0' : '10px';

      arrangeLiveMobile();
      return;
    }

    document.body.classList.remove('reference-live-layout');
    clearMobileInlineLayout();
    if (boardPanel.parentElement !== layout) layout.insertBefore(boardPanel, side);
  }

  ensureReferenceStyles();
  syncBoardFlow();

  const runAfterOtherLayoutHandlers = () => setTimeout(syncBoardFlow, 0);
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', runAfterOtherLayoutHandlers);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(runAfterOtherLayoutHandlers);
  }

  const classObserver = new MutationObserver(() => runAfterOtherLayoutHandlers());
  classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('DOMContentLoaded', () => {
    runAfterOtherLayoutHandlers();
    setTimeout(arrangeLiveMobile, 80);
  }, { once: true });

  window.addEventListener('load', () => {
    arrangeLiveMobile();
    setTimeout(applyReferenceBoardPalette, 180);
  }, { once: true });
})();