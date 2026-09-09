(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 800;
  const MOBILE_RANKING_LIMIT = 5;
  const COUNTRY_FLAG_CODES = Object.freeze({
    'السعودية':'SA','الإمارات':'AE','الكويت':'KW','البحرين':'BH','قطر':'QA','عُمان':'OM','اليمن':'YE',
    'العراق':'IQ','الأردن':'JO','فلسطين':'PS','لبنان':'LB','سوريا':'SY','مصر':'EG','السودان':'SD',
    'ليبيا':'LY','تونس':'TN','الجزائر':'DZ','المغرب':'MA','موريتانيا':'MR','الصومال':'SO','جيبوتي':'DJ','جزر القمر':'KM'
  });
  const SAUDI_REGIONS = new Set([
    'الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير',
    'تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف'
  ]);
  const TOURNAMENT_RESULTS_API = Object.freeze({
    url: 'https://zjxkxhsvltihucdacjrv.supabase.co',
    key: 'sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ'
  });

  function installWelcomeTickerFontSize() {
    const style = document.createElement('style');
    style.id = 'welcomeTickerFont16Styles';
    style.textContent = `#welcomeTicker .welcome-ticker-label,#welcomeTicker .welcome-ticker-item,#welcomeTicker .welcome-ticker-loading{font-size:16px!important}`;
    if (!document.getElementById(style.id)) document.head.appendChild(style);
  }

  function flagCodeForCountry(country) {
    return COUNTRY_FLAG_CODES[String(country || '').trim()] || '';
  }

  function installWelcomeTickerFlags() {
    const style = document.createElement('style');
    style.id = 'welcomeTickerCountryFlagStyles';
    style.textContent = `#welcomeTicker .welcome-country-flag{width:18px!important;height:13px!important;display:inline-block!important;flex:0 0 18px;object-fit:cover;border-radius:2px;margin-inline-end:6px;vertical-align:middle;box-shadow:0 0 0 1px rgba(255,255,255,.18)}`;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    const decorate = () => {
      document.querySelectorAll('#welcomeTicker .welcome-ticker-item').forEach(item => {
        [...item.childNodes].forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(' / ')) {
            node.textContent = node.textContent.replace(' / ',' - ');
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(' — ')) {
            node.textContent = node.textContent.replace(' — ',' - ');
          }
        });

        if (item.dataset.countryFlagged === '1') return;
        const match = item.textContent.match(/-\s*([^،]+)(?:،|$)/);
        if (!match) return;
        const code = flagCodeForCountry(match[1]);
        if (!code) return;

        const flagEl = document.createElement('img');
        flagEl.className = 'welcome-country-flag';
        flagEl.alt = '';
        flagEl.setAttribute('aria-hidden', 'true');
        flagEl.decoding = 'async';
        flagEl.src = `https://flagcdn.com/${code.toLowerCase()}.svg`;
        flagEl.onerror = () => flagEl.remove();
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

  function tickerPlayers() {
    return [...(Array.isArray(window.__HOME_PLAYERS__) ? window.__HOME_PLAYERS__ : [])]
      .filter(player => player && player.id && player.created_at)
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0,20);
  }

  function installWelcomeTickerInteractions() {
    const style = document.createElement('style');
    style.id = 'welcomeTickerInteractionStyles';
    style.textContent = `#welcomeTicker:hover .welcome-ticker-track,#welcomeTicker:focus-within .welcome-ticker-track{animation-play-state:paused!important}#welcomeTicker .welcome-player-link{color:inherit;text-decoration:none;font:inherit;font-weight:inherit;cursor:pointer}#welcomeTicker .welcome-player-link:hover,#welcomeTicker .welcome-player-link:focus-visible{text-decoration:underline;text-underline-offset:2px}`;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    const decorateLinks = () => {
      const players = tickerPlayers();
      if (!players.length) return;

      document.querySelectorAll('#welcomeTicker .welcome-ticker-item').forEach((item,index) => {
        if (item.dataset.playerLinked === '1' || item.querySelector('.welcome-player-link')) return;
        const player = players[index % players.length];
        if (!player?.id) return;

        const textNode = [...item.childNodes].find(node =>
          node.nodeType === Node.TEXT_NODE && node.textContent.includes(' - ')
        );
        if (!textNode) return;

        const fullText = textNode.textContent;
        const divider = ' - ';
        const splitAt = fullText.indexOf(divider);
        if (splitAt <= 0) return;

        const link = document.createElement('a');
        link.className = 'welcome-player-link';
        link.href = `player.html?id=${encodeURIComponent(player.id)}`;
        link.textContent = fullText.slice(0,splitAt);
        link.setAttribute('aria-label', `فتح صفحة ${link.textContent}`);

        textNode.textContent = fullText.slice(splitAt);
        item.insertBefore(link,textNode);
        item.dataset.playerLinked = '1';
      });
    };

    decorateLinks();

    const ticker = document.getElementById('welcomeTicker');
    if (ticker && ticker.dataset.playerLinkObserver !== '1') {
      ticker.dataset.playerLinkObserver = '1';
      new MutationObserver(decorateLinks).observe(ticker, { childList: true, subtree: true });
    }

    window.addEventListener('home-players-loaded',decorateLinks);
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

  function installDesktopHomeFit() {
    const style = document.createElement('style');
    style.id = 'desktopHomeFitStyles';
    style.textContent = `
      @media(min-width:901px){
        body.home-signed-in{height:100dvh!important;min-height:0!important;overflow:hidden!important;grid-template-rows:64px 34px 34px minmax(0,1fr) 38px!important}
        body.home-signed-in .home-hero{grid-row:4!important;min-height:0!important;overflow:hidden!important}
        body.home-signed-in #ranking{grid-row:4!important}
        body.home-signed-in #ranking{min-height:0!important;overflow:hidden!important}
        body.home-signed-in footer{grid-row:5!important}

        body.home-signed-in .home-hero .home-board-actions{
          display:grid!important;
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          grid-template-rows:repeat(2,88px)!important;
          grid-auto-rows:88px!important;
          gap:10px!important;
          align-content:start!important;
          align-items:stretch!important;
          height:auto!important;
          min-height:0!important;
        }
        body.home-signed-in .home-hero .hero-play-btn{grid-column:1!important;grid-row:1!important}
        body.home-signed-in .home-hero .home-invite-wrap{grid-column:2!important;grid-row:1!important}
        body.home-signed-in .home-hero .hero-computer-btn{grid-column:1!important;grid-row:2!important}
        body.home-signed-in .home-hero .hero-tournaments-btn{grid-column:2!important;grid-row:2!important}
      }

      @media(min-width:901px) and (max-height:700px){
        body.home-signed-in{height:100dvh!important;min-height:0!important;overflow:hidden!important}
        body.home-signed-in .home-hero{padding:8px 0 6px!important}
        body.home-signed-in .home-hero h1{margin:5px 0 4px!important;font-size:clamp(34px,4vw,46px)!important}
        body.home-signed-in .home-hero p{margin-bottom:8px!important;font-size:16px!important}
        body.home-signed-in .hero-live-stats{margin-bottom:8px!important}
        body.home-signed-in .hero-stat{min-height:64px!important}
        body.home-signed-in .home-hero .home-board-actions{
          grid-template-rows:repeat(2,70px)!important;
          grid-auto-rows:70px!important;
          gap:8px!important;
        }
        body.home-signed-in .home-hero .home-board-actions>.btn,
        body.home-signed-in .home-hero .home-invite-wrap,
        body.home-signed-in .home-hero .home-invite-wrap>.btn{
          height:70px!important;
          min-height:70px!important;
        }
      }
    `;
    if (!document.getElementById(style.id)) document.head.appendChild(style);
  }

  function tournamentCountryForRegion(region) {
    const value = String(region || '').trim();
    return SAUDI_REGIONS.has(value) ? 'السعودية' : value;
  }

  function tournamentApiUrl(path, params) {
    const base = TOURNAMENT_RESULTS_API.url.replace(/\/$/, '');
    const query = new URLSearchParams(params).toString();
    return `${base}/rest/v1/${path}?${query}`;
  }

  async function tournamentApiGet(path, params) {
    const response = await fetch(tournamentApiUrl(path, params), {
      headers: {
        apikey: TOURNAMENT_RESULTS_API.key,
        Authorization: `Bearer ${TOURNAMENT_RESULTS_API.key}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`tournament results request failed: ${response.status}`);
    return response.json();
  }

  function installTournamentResultsTicker() {
    const welcomeTicker = document.getElementById('welcomeTicker');
    if (!welcomeTicker) return;

    const style = document.createElement('style');
    style.id = 'tournamentResultsTickerStyles';
    style.textContent = `
      #tournamentResultsTicker{width:100%;height:34px;display:flex;align-items:center;overflow:hidden;background:#0a302f;color:#f7f3e7;border-top:0;border-bottom:1px solid rgba(197,163,77,.55);position:relative;z-index:18;flex:none;direction:rtl}
      #tournamentResultsTicker .welcome-ticker-label,#tournamentResultsTicker .welcome-ticker-item,#tournamentResultsTicker .welcome-ticker-loading{font-size:16px!important}
      #tournamentResultsTicker .tournament-name-highlight{color:#ffbd73;font-weight:900}
      #tournamentResultsTicker .tournament-winner-link{color:inherit;text-decoration:none;font:inherit;font-weight:900;cursor:pointer}
      #tournamentResultsTicker .tournament-winner-link:hover,#tournamentResultsTicker .tournament-winner-link:focus-visible{text-decoration:underline;text-underline-offset:2px}
      #tournamentResultsTicker .tournament-country-flag{width:18px;height:13px;display:inline-block;flex:0 0 18px;object-fit:cover;border-radius:2px;margin:0 6px;vertical-align:middle;box-shadow:0 0 0 1px rgba(255,255,255,.18)}
      #tournamentResultsTicker:hover .welcome-ticker-track,#tournamentResultsTicker:focus-within .welcome-ticker-track{animation-play-state:paused!important}
      @media(min-width:901px){
        body:not(.home-signed-in){grid-template-rows:auto 34px 34px auto auto auto auto!important}
        body:not(.home-signed-in) .home-header{grid-row:1!important}
        body:not(.home-signed-in) #welcomeTicker{grid-row:2!important}
        body:not(.home-signed-in) #tournamentResultsTicker{grid-column:1/-1!important;grid-row:3!important}
        body:not(.home-signed-in) .home-hero{grid-row:4!important}
        body:not(.home-signed-in) #ranking{grid-row:4/6!important}
        body:not(.home-signed-in) .home-features{grid-row:5!important}
        body:not(.home-signed-in) #register{grid-row:6!important}
        body:not(.home-signed-in) footer{grid-row:7!important}
        body.home-signed-in #welcomeTicker{grid-row:2!important}
        body.home-signed-in #tournamentResultsTicker{grid-column:1/-1!important;grid-row:3!important}
      }
      @media(max-width:900px){
        #welcomeTicker{order:2!important}
        #tournamentResultsTicker{order:3!important}
        .home-hero{order:4!important}
        #ranking{order:5!important}
        .home-features{order:6!important}
        #register{order:7!important}
        footer{order:8!important}
      }
      @media(max-width:800px){#tournamentResultsTicker{height:30px}#tournamentResultsTicker .welcome-ticker-label,#tournamentResultsTicker .welcome-ticker-item,#tournamentResultsTicker .welcome-ticker-loading{font-size:14px!important}}
      @media(max-width:430px){#tournamentResultsTicker .welcome-ticker-label{padding:0 8px}#tournamentResultsTicker .welcome-ticker-item{padding:0 12px}}
    `;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    let ticker = document.getElementById('tournamentResultsTicker');
    if (!ticker) {
      ticker = document.createElement('div');
      ticker.id = 'tournamentResultsTicker';
      ticker.className = 'welcome-ticker tournament-results-ticker';
      ticker.setAttribute('role', 'region');
      ticker.setAttribute('aria-label', 'نتائج البطولات');

      const label = document.createElement('span');
      label.className = 'welcome-ticker-label';
      label.textContent = 'نتائج البطولات';

      const viewport = document.createElement('div');
      viewport.className = 'welcome-ticker-viewport';

      const track = document.createElement('div');
      track.id = 'tournamentResultsTickerTrack';
      track.className = 'welcome-ticker-track welcome-ticker-single';

      const loading = document.createElement('span');
      loading.className = 'welcome-ticker-loading';
      loading.textContent = 'جاري تحميل نتائج البطولات';

      track.appendChild(loading);
      viewport.appendChild(track);
      ticker.append(label, viewport);
      welcomeTicker.insertAdjacentElement('afterend', ticker);
    }

    const renderFallback = text => {
      const track = document.getElementById('tournamentResultsTickerTrack');
      if (!track) return;
      track.className = 'welcome-ticker-track welcome-ticker-single';
      const item = document.createElement('span');
      item.className = 'welcome-ticker-loading';
      item.textContent = text;
      track.replaceChildren(item);
    };

    const buildGroup = results => {
      const group = document.createElement('div');
      group.className = 'welcome-ticker-group';

      results.forEach(result => {
        const item = document.createElement('span');
        item.className = 'welcome-ticker-item tournament-results-item';
        item.appendChild(document.createTextNode('مبروك لـ '));

        const winner = document.createElement('a');
        winner.className = 'tournament-winner-link';
        winner.href = `player.html?id=${encodeURIComponent(result.player.id)}`;
        winner.textContent = result.player.name || 'لاعب';
        winner.setAttribute('aria-label', `فتح صفحة ${winner.textContent}`);
        item.appendChild(winner);

        const code = flagCodeForCountry(result.country);
        if (code) {
          const flag = document.createElement('img');
          flag.className = 'tournament-country-flag';
          flag.alt = '';
          flag.setAttribute('aria-hidden', 'true');
          flag.decoding = 'async';
          flag.src = `https://flagcdn.com/${code.toLowerCase()}.svg`;
          flag.onerror = () => flag.remove();
          item.appendChild(flag);
        }

        const location = result.city ? `${result.country}، ${result.city}` : result.country;
        item.appendChild(document.createTextNode(` ${location} لفوزه ببطولة `));

        const tournament = document.createElement('strong');
        tournament.className = 'tournament-name-highlight';
        tournament.textContent = result.tournament.name;
        item.appendChild(tournament);
        group.appendChild(item);

        const separator = document.createElement('span');
        separator.className = 'welcome-ticker-separator';
        separator.setAttribute('aria-hidden', 'true');
        group.appendChild(separator);
      });

      return group;
    };

    let loading = false;
    let lastSignature = '';

    async function refreshTournamentResults() {
      if (loading) return;
      loading = true;
      try {
        const tournaments = await tournamentApiGet('tournaments', {
          select: 'id,name,winner_player_id,finished_at',
          status: 'eq.finished',
          winner_player_id: 'not.is.null',
          order: 'finished_at.desc',
          limit: '10'
        });

        const latest = [...(Array.isArray(tournaments) ? tournaments : [])]
          .filter(row => row && row.id && row.winner_player_id && row.finished_at)
          .slice(0, 10);

        if (!latest.length) {
          lastSignature = '';
          renderFallback('لا توجد نتائج بطولات حتى الآن');
          return;
        }

        const winnerIds = [...new Set(latest.map(row => row.winner_player_id))];
        const players = await tournamentApiGet('public_players', {
          select: 'id,name,region,city',
          id: `in.(${winnerIds.join(',')})`
        });
        const playerById = new Map((Array.isArray(players) ? players : []).map(player => [player.id, player]));

        const results = latest.map(tournament => {
          const player = playerById.get(tournament.winner_player_id);
          if (!player) return null;
          const country = tournamentCountryForRegion(player.region) || 'دولة غير محددة';
          return {
            tournament,
            player,
            country,
            city: String(player.city || '').trim()
          };
        }).filter(Boolean);

        if (!results.length) {
          renderFallback('لا توجد نتائج بطولات حتى الآن');
          return;
        }

        const signature = results.map(result => `${result.tournament.id}|${result.player.id}|${result.tournament.finished_at}`).join(';');
        if (signature === lastSignature) return;
        lastSignature = signature;

        const track = document.getElementById('tournamentResultsTickerTrack');
        if (!track) return;
        track.className = 'welcome-ticker-track';
        track.replaceChildren(buildGroup(results), buildGroup(results));
      } catch (error) {
        console.warn('tournament results ticker unavailable', error);
        if (!lastSignature) renderFallback('تعذر تحميل نتائج البطولات');
      } finally {
        loading = false;
      }
    }

    refreshTournamentResults();
    setInterval(refreshTournamentResults, 300000);
  }

  function installTournamentPageLink() {
    const headerTournaments = document.getElementById('headerTournaments');
    if (headerTournaments) headerTournaments.href = 'tournaments.html';
  }

  installWelcomeTickerFontSize();
  installWelcomeTickerFlags();
  installWelcomeTickerInteractions();
  installMobileRankingLimit();
  installDesktopHomeFit();
  installTournamentPageLink();
  installTournamentResultsTicker();

  const core = document.createElement('script');
  core.src = 'site-notifications-core.js?v=20260905-mobile5';
  document.head.appendChild(core);
})();
