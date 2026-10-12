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
  let chooserHudObserver = null;
  const chooserHudObserved = new WeakSet();

  // Fit the full player card before allocating the remaining space to the
  // chooser board. Use visualViewport for Safari's changing browser bars.
  // Live games retain their existing edge-to-edge full-width board.
  function fitMobileComputerGame() {
    const root = document.documentElement;
    const classes = document.body.classList;
    const isComputer = mobileQuery.matches && classes.contains('computer-game');
    const isPregame = isComputer && classes.contains('pregame');
    const isLive = isComputer && classes.contains('live-game');
    if (!isPregame && !isLive) {
      root.style.removeProperty('--computer-mobile-visible-height');
      root.style.removeProperty('--computer-mobile-board-size');
      root.style.removeProperty('--computer-mobile-pregame-board-size');
      return;
    }

    const visualHeight = Number(window.visualViewport?.height) || window.innerHeight;
    const viewportHeight = Math.floor(Math.min(window.innerHeight || visualHeight, visualHeight));
    const screenWidth = Math.floor(root.clientWidth || window.innerWidth);
    if (viewportHeight <= 0 || screenWidth <= 0) return;

    if (root.style.getPropertyValue('--computer-mobile-visible-height') !== viewportHeight + 'px') {
      root.style.setProperty('--computer-mobile-visible-height', viewportHeight + 'px');
    }

    if (isLive) {
      root.style.removeProperty('--computer-mobile-pregame-board-size');
      if (root.style.getPropertyValue('--computer-mobile-board-size') !== screenWidth + 'px') {
        root.style.setProperty('--computer-mobile-board-size', screenWidth + 'px');
      }
      return;
    }

    root.style.removeProperty('--computer-mobile-board-size');
    const page = document.getElementById('gamePage');
    const header = stack.querySelector('.side-head-stack');
    const chooser = document.getElementById('topPlayerCard');
    const player = document.getElementById('bottomPlayerCard');
    if (!page || !header || !chooser || !player) return;

    const reserved = [header, chooser, player].reduce(
      (total, element) => total + element.getBoundingClientRect().height, 0
    );
    const pagePadding = parseFloat(getComputedStyle(page).paddingBottom) || 0;
    // A small buffer covers Safari's fractional measurements/safe-area changes.
    const available = Math.floor(viewportHeight - reserved - pagePadding - 8);
    const boardSize = Math.min(screenWidth, Math.max(220, available));
    if (root.style.getPropertyValue('--computer-mobile-pregame-board-size') !== boardSize + 'px') {
      root.style.setProperty('--computer-mobile-pregame-board-size', boardSize + 'px');
    }

    if (typeof ResizeObserver === 'function') {
      chooserHudObserver ||= new ResizeObserver(scheduleMobileComputerFit);
      [header, chooser, player].forEach(element => {
        if (chooserHudObserved.has(element)) return;
        chooserHudObserved.add(element);
        chooserHudObserver.observe(element);
      });
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
      link.href = 'play-reference-mobile-v14.css?v=20261012-stable-board-wood4-v5';
      document.head.appendChild(link);
    }
    if (!document.getElementById(pregameCssId)) {
      const link = document.createElement('link');
      link.id = pregameCssId;
      link.rel = 'stylesheet';
      link.href = 'play-reference-pregame-v15.css?v=20261012-stable-board-wood4-v5';
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

  // On mobile use the original Wood 4 image only; no old brown SVG overlays.
  function applyReferenceBoardPalette() {
    if (!isReferenceMobile()) return;
    const board = document.getElementById('board');
    if (!board) return;
    board.querySelectorAll('.cm-chessboard .square.white').forEach((square) => {
      square.style.setProperty('fill', 'transparent', 'important');
    });
    board.querySelectorAll('.cm-chessboard .square.black').forEach((square) => {
      square.style.setProperty('fill', 'transparent', 'important');
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
