// cm-chessboard owns the board rendering. This file controls responsive layout flow
// and applies the approved mobile play-page presentation.
(() => {
  const layout = document.querySelector('.layout');
  const side = document.querySelector('.side-panel');
  const stack = document.querySelector('.panel-stack');
  const boardPanel = document.querySelector('.board-panel');
  if (!layout || !side || !stack || !boardPanel) return;

  const mobileQuery = window.matchMedia('(max-width: 900px)');
  const referenceCssId = 'playReferenceMobileV14';
  const pregameCssId = 'playReferencePregameV15';
  const historyScriptId = 'playReferenceHistoryV14';
  let boardObserver = null;

  let computerFitFrame = 0;

  // Prefer a full-width chessboard. The mobile computer stylesheet compacts
  // the header/player rows and permits scrolling only on unusually short screens.
  // Safari visualViewport reports the usable height excluding browser chrome.
  function fitMobileComputerGame() {
    const root = document.documentElement;
    if (!mobileQuery.matches ||
        !document.body.classList.contains('computer-game') ||
        !document.body.classList.contains('live-game')) {
      root.style.removeProperty('--computer-mobile-visible-height');
      root.style.removeProperty('--computer-mobile-board-size');
      return;
    }

    const visualHeight = Number(window.visualViewport?.height) || window.innerHeight;
    const viewportHeight = Math.floor(Math.min(window.innerHeight || visualHeight, visualHeight));
    const screenWidth = Math.floor(root.clientWidth || window.innerWidth);
    if (viewportHeight <= 0 || screenWidth <= 0) return;

    if (root.style.getPropertyValue('--computer-mobile-visible-height') !== viewportHeight + 'px') {
      root.style.setProperty('--computer-mobile-visible-height', viewportHeight + 'px');
    }
    // Preserve the complete 8x8 board at the phone's full content width.
    if (root.style.getPropertyValue('--computer-mobile-board-size') !== screenWidth + 'px') {
      root.style.setProperty('--computer-mobile-board-size', screenWidth + 'px');
    }
  }

  function scheduleMobileComputerFit() {
    if (computerFitFrame) cancelAnimationFrame(computerFitFrame);
    computerFitFrame = requestAnimationFrame(() => {
      computerFitFrame = 0;
      fitMobileComputerGame();
    });
  }


  function ensureReferenceStyles() {
    if (!document.getElementById(referenceCssId)) {
      const link = document.createElement('link');
      link.id = referenceCssId;
      link.rel = 'stylesheet';
      link.href = 'play-reference-mobile-v14.css?v=20261011-computer-fullwidth-v1';
      document.head.appendChild(link);
    }
    if (!document.getElementById(pregameCssId)) {
      const link = document.createElement('link');
      link.id = pregameCssId;
      link.rel = 'stylesheet';
      link.href = 'play-reference-pregame-v15.css?v=20260913-1';
      document.head.appendChild(link);
    }
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

  function isPregameMobile() {
    return mobileQuery.matches && document.body.classList.contains('pregame');
  }

  function isReferenceMobile() {
    return isLiveMobile() || isPregameMobile();
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
    script.src = 'play-reference-history-v14.mjs?v=20260913-2';
    document.body.appendChild(script);
  }

  function applyReferenceBoardPalette() {
    if (!isReferenceMobile()) return;
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
    if (!isReferenceMobile()) return;
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

  function arrangeReferenceMobile() {
    if (!isReferenceMobile()) {
      document.body.classList.remove('reference-play-layout');
      return;
    }

    document.body.classList.add('reference-play-layout');

    const gameActions = document.getElementById('gameActions');
    if (gameActions && gameActions.parentElement !== stack) stack.appendChild(gameActions);

    if (isLiveMobile()) {
      ensureMoveStrip();
      ensureHistoryModule();
    }

    watchReferenceBoardPalette();
    stack.style.gap = '0';
    requestAnimationFrame(applyReferenceBoardPalette);
    setTimeout(applyReferenceBoardPalette, 120);
  }

  function clearDesktopComputerLocksOnMobile() {
    if (!document.body.classList.contains('computer-game')) return;
    const importantLocks = [
      [layout, ['grid-template-columns']],
      [side, ['width', 'min-width', 'max-width', 'box-sizing']],
      [stack, ['display', 'width', 'min-width', 'max-width', 'overflow',
        'box-sizing', 'grid-template-rows', 'grid-auto-rows', 'align-content']],
      [document.getElementById('gameActions'), ['grid-row', 'height', 'min-height', 'max-height', 'box-sizing']],
      ...['topPlayerCard', 'bottomPlayerCard'].map(id => [
        document.getElementById(id),
        ['grid-row', 'height', 'min-height', 'max-height', 'flex', 'width',
          'min-width', 'max-width', 'justify-self', 'overflow', 'box-sizing']
      ])
    ];
    for (const [element, properties] of importantLocks) {
      if (!element) continue;
      properties.forEach(property => {
        if (element.style.getPropertyPriority(property) === 'important') {
          element.style.removeProperty(property);
        }
      });
    }
  }

  function syncBoardFlow() {
    if (mobileQuery.matches) {
      clearDesktopComputerLocksOnMobile();
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
      stack.style.gap = isReferenceMobile() ? '0' : '10px';

      arrangeReferenceMobile();
      scheduleMobileComputerFit();
      return;
    }

    document.body.classList.remove('reference-play-layout');
    scheduleMobileComputerFit();
    clearMobileInlineLayout();
    if (boardPanel.parentElement !== layout) layout.insertBefore(boardPanel, side);
  }

  ensureReferenceStyles();
  syncBoardFlow();

  const runAfterOtherLayoutHandlers = () => setTimeout(syncBoardFlow, 0);
  window.addEventListener('resize', scheduleMobileComputerFit, { passive: true });
  window.addEventListener('orientationchange', scheduleMobileComputerFit, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleMobileComputerFit, { passive: true });
  window.visualViewport?.addEventListener('scroll', scheduleMobileComputerFit, { passive: true });
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', runAfterOtherLayoutHandlers);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(runAfterOtherLayoutHandlers);
  }

  const classObserver = new MutationObserver(() => runAfterOtherLayoutHandlers());
  classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('DOMContentLoaded', () => {
    runAfterOtherLayoutHandlers();
    setTimeout(() => { arrangeReferenceMobile(); scheduleMobileComputerFit(); }, 80);
  }, { once: true });

  window.addEventListener('load', () => {
    arrangeReferenceMobile();
    setTimeout(applyReferenceBoardPalette, 180);
    scheduleMobileComputerFit();
  }, { once: true });
})();
