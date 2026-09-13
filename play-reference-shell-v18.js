(() => {
  'use strict';

  const mobile = window.matchMedia('(max-width: 900px)');
  let hiddenNavigation = null;
  let scheduled = false;

  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
  const labels = ['الرئيسية', 'العب', 'الألغاز', 'حسابي', 'المزيد'];

  function scoreNavigationText(element) {
    const text = normalize(element?.textContent);
    if (!text) return 0;
    return labels.reduce((score, label) => score + (text.includes(label) ? 1 : 0), 0);
  }

  function looksLikeBottomNavigation(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.id === 'gameActions' || element.closest('#gameActions')) return false;
    if (scoreNavigationText(element) < 4) return false;

    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const classHint = /nav|dock|tab|bottom|menu|mobile/i.test(String(element.className || ''));
    const roleHint = element.matches('nav,footer,[role="navigation"]');
    const positionHint = style.position === 'fixed' || style.position === 'sticky';
    const bottomHint = rect.bottom >= window.innerHeight - 80 && rect.top > window.innerHeight * .45;

    return roleHint || classHint || positionHint || bottomHint;
  }

  function hideGlobalBottomNavigation() {
    if (!mobile.matches) return;

    if (hiddenNavigation?.isConnected) {
      hiddenNavigation.style.setProperty('display', 'none', 'important');
      return;
    }

    const preferred = [
      ...document.querySelectorAll('nav,footer,[role="navigation"],[class*="nav" i],[class*="dock" i],[class*="tab" i],[class*="bottom" i],[class*="menu" i]')
    ].reverse();

    let target = preferred.find(looksLikeBottomNavigation) || null;
    if (!target && document.body) {
      target = [...document.body.querySelectorAll('*')].reverse().find(looksLikeBottomNavigation) || null;
    }

    if (!target) return;
    hiddenNavigation = target;
    target.dataset.hiddenOnPlayPage = '1';
    target.style.setProperty('display', 'none', 'important');
  }

  function findBoardHeaderControl(header, leave) {
    if (!header) return null;
    const controls = [...header.querySelectorAll('button,a,[role="button"]')];
    return controls.find(control => {
      if (control === leave || control.id === 'reportBtn' || control.closest('#siteNotificationHost')) return false;
      const text = normalize(control.textContent);
      const aria = normalize(control.getAttribute('aria-label'));
      const title = normalize(control.getAttribute('title'));
      const identity = `${control.id || ''} ${control.className || ''}`;
      return text.includes('الرقعة') || aria.includes('رقعة') || title.includes('رقعة') || /board/i.test(identity);
    }) || null;
  }

  function enforceHeader() {
    if (!mobile.matches || !document.body.classList.contains('reference-play-layout')) return;

    const header = document.querySelector('.side-header');
    const leave = document.getElementById('leaveBtn');
    const leaveText = document.getElementById('leaveText');
    const notifications = document.getElementById('siteNotificationHost');
    const boardControl = findBoardHeaderControl(header, leave);

    if (leaveText) leaveText.style.setProperty('display', 'none', 'important');
    if (leave) {
      leave.setAttribute('aria-label', 'رجوع');
      leave.setAttribute('title', 'رجوع');
      leave.style.setProperty('position', 'absolute', 'important');
      leave.style.setProperty('right', '0', 'important');
      leave.style.setProperty('left', 'auto', 'important');
      leave.style.setProperty('top', '50%', 'important');
      leave.style.setProperty('transform', 'translateY(-50%)', 'important');
      leave.style.setProperty('width', '46px', 'important');
      leave.style.setProperty('min-width', '46px', 'important');
      leave.style.setProperty('height', '46px', 'important');
      leave.style.setProperty('border', '0', 'important');
      leave.style.setProperty('background', 'transparent', 'important');
      leave.style.setProperty('box-shadow', 'none', 'important');
      leave.style.setProperty('font-size', '0', 'important');
      leave.style.setProperty('z-index', '12', 'important');
    }

    document.querySelectorAll('.reference-board-control-v19').forEach(control => {
      if (control !== boardControl) control.classList.remove('reference-board-control-v19');
    });
    if (boardControl) {
      boardControl.classList.add('reference-board-control-v19');
      boardControl.style.setProperty('position', 'absolute', 'important');
      boardControl.style.setProperty('right', '54px', 'important');
      boardControl.style.setProperty('left', 'auto', 'important');
      boardControl.style.setProperty('top', '50%', 'important');
      boardControl.style.setProperty('transform', 'translateY(-50%)', 'important');
      boardControl.style.setProperty('z-index', '11', 'important');
    }

    if (notifications) notifications.style.setProperty('display', 'none', 'important');
  }

  function sync() {
    scheduled = false;
    if (!mobile.matches) return;
    enforceHeader();
    hideGlobalBottomNavigation();
  }

  function queueSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  queueSync();
  document.addEventListener('DOMContentLoaded', queueSync, { once: true });
  window.addEventListener('load', () => {
    queueSync();
    setTimeout(sync, 120);
    setTimeout(sync, 600);
  }, { once: true });

  const startObserver = () => {
    if (!document.body) return;
    new MutationObserver(queueSync).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  };
  if (document.body) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

  if (typeof mobile.addEventListener === 'function') mobile.addEventListener('change', queueSync);
  else if (typeof mobile.addListener === 'function') mobile.addListener(queueSync);
})();