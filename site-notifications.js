(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 800;
  const MOBILE_RANKING_LIMIT = 5;
  const COUNTRY_FLAG_CODES = Object.freeze({
    'السعودية':'SA','الإمارات':'AE','الكويت':'KW','البحرين':'BH','قطر':'QA','عُمان':'OM','اليمن':'YE',
    'العراق':'IQ','الأردن':'JO','فلسطين':'PS','لبنان':'LB','سوريا':'SY','مصر':'EG','السودان':'SD',
    'ليبيا':'LY','تونس':'TN','الجزائر':'DZ','المغرب':'MA','موريتانيا':'MR','الصومال':'SO','جيبوتي':'DJ','جزر القمر':'KM'
  });

  function installWelcomeTickerFontSize() {
    const style = document.createElement('style');
    style.id = 'welcomeTickerFont16Styles';
    style.textContent = `#welcomeTicker .welcome-ticker-label,#welcomeTicker .welcome-ticker-item,#welcomeTicker .welcome-ticker-loading{font-size:16px!important}`;
    if (!document.getElementById(style.id)) document.head.appendChild(style);
  }

  function flagForCountry(country) {
    const code = COUNTRY_FLAG_CODES[String(country || '').trim()];
    if (!code) return '';
    return [...code].map(char => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');
  }

  function installWelcomeTickerFlags() {
    const style = document.createElement('style');
    style.id = 'welcomeTickerCountryFlagStyles';
    style.textContent = `#welcomeTicker .welcome-country-flag{font-size:14px!important;line-height:1;display:inline-block;margin-inline-end:5px;vertical-align:middle}`;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    const decorate = () => {
      document.querySelectorAll('#welcomeTicker .welcome-ticker-item').forEach(item => {
        if (item.dataset.countryFlagged === '1') return;
        const match = item.textContent.match(/—\s*([^،]+)(?:،|$)/);
        if (!match) return;
        const flag = flagForCountry(match[1]);
        if (!flag) return;

        const flagEl = document.createElement('span');
        flagEl.className = 'welcome-country-flag';
        flagEl.setAttribute('aria-hidden', 'true');
        flagEl.textContent = flag;
        item.prepend(flagEl);
        item.dataset.countryFlagged = '1';
      });
    };

    decorate();

    const ticker = document.getElementById('welcomeTicker');
    if (ticker && ticker.dataset.countryFlagObserver !== '1') {
      ticker.dataset.countryFlagObserver = '1';
      new MutationObserver(decorate).observe(ticker, { childList: true, subtree: true });
    }

    window.addEventListener('home-players-loaded', decorate);
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

  function installTournamentPageLink() {
    const headerTournaments = document.getElementById('headerTournaments');
    if (headerTournaments) headerTournaments.href = 'tournaments.html';
  }

  installWelcomeTickerFontSize();
  installWelcomeTickerFlags();
  installMobileRankingLimit();
  installTournamentPageLink();

  const core = document.createElement('script');
  core.src = 'site-notifications-core.js?v=20260905-mobile5';
  document.head.appendChild(core);
})();
