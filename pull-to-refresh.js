(() => {
  if (window.__shatranjPullToRefreshInstalled) return;
  window.__shatranjPullToRefreshInstalled = true;

  const touchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const mobileViewport = window.matchMedia?.('(max-width: 1024px)').matches ?? true;
  if (!touchDevice || !mobileViewport) return;

  const PULL_THRESHOLD = 78;
  const PULL_START_DISTANCE = 10;
  const MAX_PAGE_OFFSET = 74;
  const BLOCK_SELECTOR = [
    'input',
    'textarea',
    'select',
    '[contenteditable="true"]',
    '.board',
    '.board-shell',
    '.board-frame',
    '.cm-chessboard',
    '[class*="chessboard"]',
    '[data-no-pull-refresh]'
  ].join(',');

  let startX = 0;
  let startY = 0;
  let pullDistance = 0;
  let active = false;
  let sourceTarget = null;
  let settleTimer = 0;

  const clearGestureState = () => {
    startX = 0;
    startY = 0;
    pullDistance = 0;
    active = false;
    sourceTarget = null;
  };

  const setPageOffset = (distance, animate = false) => {
    if (!document.body) return;
    clearTimeout(settleTimer);
    const offset = Math.max(0, Math.min(MAX_PAGE_OFFSET, distance));
    document.body.style.willChange = 'transform';
    document.body.style.transition = animate ? 'transform 180ms cubic-bezier(.2,.8,.2,1)' : 'none';
    document.body.style.transform = `translate3d(0, ${offset}px, 0)`;
  };

  const restorePagePosition = () => {
    if (!document.body) return;
    clearTimeout(settleTimer);
    document.body.style.willChange = 'transform';
    document.body.style.transition = 'transform 180ms cubic-bezier(.2,.8,.2,1)';
    document.body.style.transform = 'translate3d(0, 0, 0)';
    settleTimer = setTimeout(() => {
      if (active || !document.body) return;
      document.body.style.removeProperty('transform');
      document.body.style.removeProperty('transition');
      document.body.style.removeProperty('will-change');
    }, 210);
  };

  const cancelPull = () => {
    clearGestureState();
    restorePagePosition();
  };

  const elementTarget = (target) => target instanceof Element ? target : target?.parentElement || null;

  const startsInBlockedArea = (target) => {
    const element = elementTarget(target);
    return Boolean(element?.closest(BLOCK_SELECTOR));
  };

  const scrollContextAtTop = (target) => {
    let element = elementTarget(target);
    while (element && element !== document.body && element !== document.documentElement) {
      const style = getComputedStyle(element);
      const canScrollY = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2;
      if (canScrollY && element.scrollTop > 1) return false;
      element = element.parentElement;
    }

    const root = document.scrollingElement;
    return window.scrollY <= 1 && (!root || root.scrollTop <= 1);
  };

  const existingPregameRefreshOwnsGesture = () =>
    Boolean(document.getElementById('mobilePullRefresh') && document.body?.classList.contains('pregame'));

  document.addEventListener('touchstart', (event) => {
    clearGestureState();
    if (event.touches.length !== 1) return;
    if (startsInBlockedArea(event.target)) return;
    if (!scrollContextAtTop(event.target)) return;

    clearTimeout(settleTimer);
    if (document.body) {
      document.body.style.transition = 'none';
      document.body.style.transform = 'translate3d(0, 0, 0)';
    }

    sourceTarget = event.target;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    active = true;
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!active || event.touches.length !== 1) return;
    if (!scrollContextAtTop(sourceTarget)) return cancelPull();

    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;
    if (dy <= 0) return cancelPull();
    if (Math.abs(dx) > dy * 0.72) return cancelPull();

    pullDistance = dy;
    if (dy < PULL_START_DISTANCE) return;

    const elasticDistance = Math.min(MAX_PAGE_OFFSET, (dy - PULL_START_DISTANCE) * 0.62);
    setPageOffset(elasticDistance);
    if (event.cancelable) event.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', () => {
    const legacyPregameRefresh = existingPregameRefreshOwnsGesture();
    const threshold = legacyPregameRefresh ? 72 : PULL_THRESHOLD;
    const shouldRefresh = active && pullDistance >= threshold && scrollContextAtTop(sourceTarget);

    clearGestureState();
    if (!shouldRefresh) return restorePagePosition();

    setPageOffset(42, true);
    if (!legacyPregameRefresh) setTimeout(() => location.reload(), 90);
  }, { passive: true });

  document.addEventListener('touchcancel', cancelPull, { passive: true });
})();
