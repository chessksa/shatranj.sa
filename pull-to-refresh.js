(() => {
  if (window.__shatranjPullToRefreshInstalled) return;
  window.__shatranjPullToRefreshInstalled = true;

  const touchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const mobileViewport = window.matchMedia?.('(max-width: 1024px)').matches ?? true;
  if (!touchDevice || !mobileViewport) return;

  const PULL_THRESHOLD = 132;
  const PULL_START_DISTANCE = 10;
  const MAX_PAGE_OFFSET = 132;
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
  let indicatorTimer = 0;

  const indicatorStyleId = 'shatranj-pull-refresh-style';
  if (!document.getElementById(indicatorStyleId)) {
    const style = document.createElement('style');
    style.id = indicatorStyleId;
    style.textContent = `
      #shatranj-pull-refresh-indicator{
        position:fixed;
        z-index:2147483000;
        top:-48px;
        left:50%;
        width:42px;
        height:42px;
        margin-left:-21px;
        display:grid;
        place-items:center;
        border-radius:50%;
        background:rgba(4,39,41,.96);
        border:1px solid rgba(216,182,101,.62);
        box-shadow:0 6px 18px rgba(0,0,0,.28);
        opacity:0;
        pointer-events:none;
        transition:top 160ms cubic-bezier(.2,.8,.2,1),opacity 120ms ease;
      }
      #shatranj-pull-refresh-indicator .pull-refresh-dots{
        position:relative;
        width:28px;
        height:28px;
        will-change:transform;
      }
      #shatranj-pull-refresh-indicator .pull-refresh-dot{
        position:absolute;
        left:50%;
        top:50%;
        width:5px;
        height:5px;
        margin:-2.5px 0 0 -2.5px;
        border-radius:50%;
        background:#d8b665;
        box-shadow:0 0 5px rgba(216,182,101,.38);
        transform:rotate(var(--dot-angle)) translateY(-10.5px);
        transform-origin:2.5px 2.5px;
      }
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(1){--dot-angle:0deg;opacity:1}
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(2){--dot-angle:45deg;opacity:.92}
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(3){--dot-angle:90deg;opacity:.84}
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(4){--dot-angle:135deg;opacity:.76}
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(5){--dot-angle:180deg;opacity:.68}
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(6){--dot-angle:225deg;opacity:.60}
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(7){--dot-angle:270deg;opacity:.52}
      #shatranj-pull-refresh-indicator .pull-refresh-dot:nth-child(8){--dot-angle:315deg;opacity:.44}
      #shatranj-pull-refresh-indicator.refreshing .pull-refresh-dots{
        animation:shatranjPullDotsSpin .72s linear infinite;
      }
      @keyframes shatranjPullDotsSpin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(style);
  }

  const refreshIndicator = document.createElement('div');
  refreshIndicator.id = 'shatranj-pull-refresh-indicator';
  refreshIndicator.setAttribute('aria-hidden', 'true');
  refreshIndicator.innerHTML = '<span class="pull-refresh-dots"><i class="pull-refresh-dot"></i><i class="pull-refresh-dot"></i><i class="pull-refresh-dot"></i><i class="pull-refresh-dot"></i><i class="pull-refresh-dot"></i><i class="pull-refresh-dot"></i><i class="pull-refresh-dot"></i><i class="pull-refresh-dot"></i></span>';
  document.documentElement.appendChild(refreshIndicator);
  const refreshDots = refreshIndicator.querySelector('.pull-refresh-dots');

  const setIndicatorProgress = (offset, rawDistance = 0) => {
    clearTimeout(indicatorTimer);
    refreshIndicator.classList.remove('refreshing');
    const progress = Math.max(0, Math.min(1, rawDistance / PULL_THRESHOLD));
    const top = Math.min(16, -46 + offset * 0.62);
    refreshIndicator.style.transition = 'none';
    refreshIndicator.style.top = `${top}px`;
    refreshIndicator.style.opacity = offset > 3 ? String(Math.min(1, 0.2 + progress * 0.8)) : '0';
    if (refreshDots) refreshDots.style.transform = `rotate(${Math.round(progress * 420)}deg)`;
  };

  const hideRefreshIndicator = (animate = true) => {
    clearTimeout(indicatorTimer);
    refreshIndicator.classList.remove('refreshing');
    refreshIndicator.style.transition = animate
      ? 'top 180ms cubic-bezier(.2,.8,.2,1),opacity 150ms ease'
      : 'none';
    refreshIndicator.style.top = '-48px';
    refreshIndicator.style.opacity = '0';
    indicatorTimer = setTimeout(() => {
      if (active || !refreshDots) return;
      refreshDots.style.removeProperty('transform');
    }, 200);
  };

  const showRefreshingIndicator = () => {
    clearTimeout(indicatorTimer);
    if (refreshDots) refreshDots.style.removeProperty('transform');
    refreshIndicator.style.transition = 'top 160ms cubic-bezier(.2,.8,.2,1),opacity 100ms ease';
    refreshIndicator.style.top = '14px';
    refreshIndicator.style.opacity = '1';
    refreshIndicator.classList.add('refreshing');
  };

  const clearGestureState = () => {
    startX = 0;
    startY = 0;
    pullDistance = 0;
    active = false;
    sourceTarget = null;
  };

  const setPageOffset = (distance, animate = false) => {
    if (!document.body) return 0;
    clearTimeout(settleTimer);
    const offset = Math.max(0, Math.min(MAX_PAGE_OFFSET, distance));
    document.body.style.willChange = 'transform';
    document.body.style.transition = animate ? 'transform 190ms cubic-bezier(.2,.8,.2,1)' : 'none';
    document.body.style.transform = `translate3d(0, ${offset}px, 0)`;
    return offset;
  };

  const restorePagePosition = () => {
    if (!document.body) return;
    clearTimeout(settleTimer);
    document.body.style.willChange = 'transform';
    document.body.style.transition = 'transform 190ms cubic-bezier(.2,.8,.2,1)';
    document.body.style.transform = 'translate3d(0, 0, 0)';
    hideRefreshIndicator(true);
    settleTimer = setTimeout(() => {
      if (active || !document.body) return;
      document.body.style.removeProperty('transform');
      document.body.style.removeProperty('transition');
      document.body.style.removeProperty('will-change');
    }, 220);
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

  document.addEventListener('touchstart', (event) => {
    clearGestureState();
    if (event.touches.length !== 1) return;
    if (startsInBlockedArea(event.target)) return;
    if (!scrollContextAtTop(event.target)) return;

    clearTimeout(settleTimer);
    hideRefreshIndicator(false);
    if (document.body) {
      document.body.style.transition = 'none';
      document.body.style.transform = 'translate3d(0, 0, 0)';
    }

    sourceTarget = event.target;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    active = true;
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (event) => {
    if (!active || event.touches.length !== 1) return;
    if (!scrollContextAtTop(sourceTarget)) return cancelPull();

    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;
    if (dy <= 0) return cancelPull();
    if (Math.abs(dx) > dy * 0.72) return cancelPull();

    pullDistance = dy;
    if (dy < PULL_START_DISTANCE) return;

    const elasticDistance = Math.min(MAX_PAGE_OFFSET, (dy - PULL_START_DISTANCE) * 0.78);
    const offset = setPageOffset(elasticDistance);
    setIndicatorProgress(offset, dy);
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  }, { passive: false, capture: true });

  document.addEventListener('touchend', (event) => {
    if (!active) return;
    const shouldRefresh = pullDistance >= PULL_THRESHOLD && scrollContextAtTop(sourceTarget);
    const ownedPullGesture = pullDistance >= PULL_START_DISTANCE;

    clearGestureState();
    if (ownedPullGesture) event.stopImmediatePropagation();
    if (!shouldRefresh) return restorePagePosition();

    setPageOffset(74, true);
    showRefreshingIndicator();
    setTimeout(() => location.reload(), 120);
  }, { passive: true, capture: true });

  document.addEventListener('touchcancel', (event) => {
    if (active && pullDistance >= PULL_START_DISTANCE) event.stopImmediatePropagation();
    cancelPull();
  }, { passive: true, capture: true });
})();
