(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 800;
  const MOBILE_RANKING_LIMIT = 5;

  function installWelcomeTickerFontSize() {
    const style = document.createElement('style');
    style.id = 'welcomeTickerFont16Styles';
    style.textContent = `#welcomeTicker .welcome-ticker-label,#welcomeTicker .welcome-ticker-item,#welcomeTicker .welcome-ticker-loading{font-size:16px!important}`;
    if (!document.getElementById(style.id)) document.head.appendChild(style);
  }

  function isMobileRanking() {
    return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  }

  function installMobileRankingLimit() {
    const style = document.createElement('style');
    style.id = 'mobileRankingFiveStyles';
    style.textContent = `@media(max-width:${MOBILE_BREAKPOINT}px){#ranking #tbody tr:nth-child(n+${MOBILE_RANKING_LIMIT + 1}){display:none!important}}`;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    const syncCount = () => {
      const result = document.getElementById('results');
      if (!result) return;

      const match = result.textContent.match(/\d+/);
      const current = Number(match ? match[0] : 0);
      const stored = Number(result.dataset.fullRankingCount || 0);

      if (isMobileRanking()) {
        const expected = Math.min(stored || current, MOBILE_RANKING_LIMIT);
        if (!stored || current !== expected) {
          result.dataset.fullRankingCount = String(current);
        }
        const fullCount = Number(result.dataset.fullRankingCount || current);
        result.textContent = `${Math.min(fullCount, MOBILE_RANKING_LIMIT)} لاعب`;
      } else if (stored) {
        result.textContent = `${stored} لاعب`;
      }
    };

    syncCount();

    const tbody = document.getElementById('tbody');
    if (tbody && tbody.dataset.mobileRankingObserver !== '1') {
      tbody.dataset.mobileRankingObserver = '1';
      new MutationObserver(syncCount).observe(tbody, { childList: true });
    }

    window.addEventListener('resize', syncCount, { passive: true });
  }

  installWelcomeTickerFontSize();
  installMobileRankingLimit();

  const core = document.createElement('script');
  core.src = 'site-notifications-core.js?v=20260905-mobile5';
  document.head.appendChild(core);
})();
