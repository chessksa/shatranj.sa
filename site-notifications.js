(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 800;
  const MOBILE_RANKING_LIMIT = 5;

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

  installMobileRankingLimit();

  const core = document.createElement('script');
  core.src = 'site-notifications-core.js?v=20260905-mobile5';
  document.head.appendChild(core);

  if (document.querySelector('header.home-header')) {
    import('./welcome-ticker-core.mjs?v=20260906-1')
      .then(({ initWelcomeTicker }) => initWelcomeTicker({
        supabaseUrl: 'https://zjxkxhsvltihucdacjrv.supabase.co',
        anonKey: 'sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ',
        limit: 10,
        refreshMs: 60000
      }))
      .catch(error => console.warn('welcome ticker failed to load', error));
  }
})();
