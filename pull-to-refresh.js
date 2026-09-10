(() => {
  if (window.__shatranjPullToRefreshInstalled) return;
  window.__shatranjPullToRefreshInstalled = true;

  const touchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const mobileViewport = window.matchMedia?.('(max-width: 1024px)').matches ?? true;
  if (!touchDevice || !mobileViewport) return;

  const PULL_THRESHOLD = 78;
  const PULL_START_DISTANCE = 10;
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

  const reset = () => {
    startX = 0;
    startY = 0;
    pullDistance = 0;
    active = false;
    sourceTarget = null;
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
    reset();
    if (existingPregameRefreshOwnsGesture()) return;
    if (event.touches.length !== 1) return;
    if (startsInBlockedArea(event.target)) return;
    if (!scrollContextAtTop(event.target)) return;

    sourceTarget = event.target;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    active = true;
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!active || event.touches.length !== 1) return;
    if (!scrollContextAtTop(sourceTarget)) return reset();

    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;
    if (dy <= 0) return reset();
    if (Math.abs(dx) > dy * 0.72) return;

    pullDistance = dy;
    if (dy >= PULL_START_DISTANCE && event.cancelable) event.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', () => {
    const shouldRefresh = active && pullDistance >= PULL_THRESHOLD && scrollContextAtTop(sourceTarget);
    reset();
    if (shouldRefresh) location.reload();
  }, { passive: true });

  document.addEventListener('touchcancel', reset, { passive: true });
})();
