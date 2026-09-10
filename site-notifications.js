(() => {
  'use strict';

  const ORIGINAL_SRC = 'site-notifications-original.js?v=20260909-ranking10b';
  const MOBILE_BREAKPOINT = 800;
  const MOBILE_RANKING_LIMIT = 10;
  const SAUDI_REGIONS = new Set([
    'الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير',
    'تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف'
  ]);

  let renderingMobileTen = false;

  const escapeHTML = (text) => String(text ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const countryForRegion = (region) => {
    const value = String(region || '').trim();
    return SAUDI_REGIONS.has(value) ? 'السعودية' : value;
  };

  function installTournamentTickerMotion() {
    if (document.getElementById('tournamentTickerMotionStyles')) return;
    const style = document.createElement('style');
    style.id = 'tournamentTickerMotionStyles';
    style.textContent = `
      /* Welcome ticker top gold divider */
      #welcomeTicker{border-top:1px solid rgba(197,163,77,.55)!important;}
      #tournamentResultsTicker .welcome-ticker-track{
        animation-duration:52s!important;
      }
      #tournamentResultsTicker .tournament-ticker-single{
        animation-name:tournamentTickerSingleMove!important;
        animation-duration:52s!important;
        animation-timing-function:linear!important;
        animation-iteration-count:infinite!important;
        will-change:transform;
      }
      @keyframes tournamentTickerSingleMove{
        from{transform:translateX(-100vw)}
        to{transform:translateX(100vw)}
      }
      @media(prefers-reduced-motion:reduce){
        #tournamentResultsTicker .tournament-ticker-single{animation:none!important;transform:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installHeroTitleLineup() {
    if (document.getElementById('heroTitleLineupStyles')) return;
    const style = document.createElement('style');
    style.id = 'heroTitleLineupStyles';
    style.textContent = `
      .home-hero h1{
        width:100%!important;
        max-width:760px!important;
        margin-inline:auto!important;
        text-align:center!important;
        white-space:nowrap!important;
        font-size:clamp(30px,4vw,52px)!important;
        letter-spacing:-.6px!important;
      }
      .home-hero h1 span{display:inline!important}
      .home-hero .hero-live-stats{
        width:100%!important;
        max-width:760px!important;
        margin-inline:auto!important;
      }
      @media(max-width:700px){
        .home-hero h1{
          font-size:clamp(24px,7.2vw,34px)!important;
          letter-spacing:-.35px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installMobileRankingFrame() {
    if (document.getElementById('mobileRankingTenFixedFrame')) return;
    const style = document.createElement('style');
    style.id = 'mobileRankingTenFixedFrame';
    style.textContent = `
      @media(max-width:${MOBILE_BREAKPOINT}px){
        #ranking .table-card{
          height:210px!important;
          min-height:210px!important;
          max-height:210px!important;
          overflow:hidden!important;
        }
        #ranking .table-wrap{
          height:100%!important;
          min-height:0!important;
          max-height:100%!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch;
          overscroll-behavior:contain!important;
        }
        #ranking table{height:auto!important;min-height:0!important}
        #ranking thead th{
          position:sticky!important;
          top:0!important;
          z-index:6!important;
          background:#0b4143!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installCompactProfileIconGrid() {
    if (document.getElementById('compactProfileIconGridStyles')) return;
    if (!document.querySelector('.dashboard-icon-row')) return;
    const style = document.createElement('style');
    style.id = 'compactProfileIconGridStyles';
    style.textContent = `
      @media(max-width:820px){
        .dashboard-icon-row{
          grid-template-columns:repeat(5,minmax(0,1fr))!important;
          overflow-x:hidden!important;
          gap:5px!important;
          padding-bottom:0!important;
        }
        .dashboard-icon-item{
          min-width:0!important;
          min-height:64px!important;
          padding:6px 3px!important;
          gap:4px!important;
        }
        .dashboard-icon-label{
          white-space:normal!important;
          overflow:visible!important;
          text-overflow:clip!important;
          font-size:11px!important;
          line-height:1.15!important;
          text-align:center!important;
        }
      }
      @media(max-width:380px){
        .dashboard-icon-row{gap:4px!important;}
        .dashboard-icon-item{min-height:62px!important;padding:5px 2px!important;}
        .dashboard-icon-label{font-size:10px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function mobileFilteredPlayers() {
    const players = Array.isArray(window.__HOME_PLAYERS__) ? window.__HOME_PLAYERS__ : [];
    const country = document.getElementById('regionFilter')?.value?.trim() || '';
    const city = document.getElementById('cityFilter')?.value?.trim() || '';

    return players.filter(player => {
      const playerCountry = countryForRegion(player.region);
      const playerCity = String(player.city || '').trim();
      return (!country || playerCountry === country) && (!city || playerCity.includes(city));
    });
  }

  function renderMobileTen() {
    if (!window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches) return;

    const tbody = document.getElementById('tbody');
    if (!tbody || renderingMobileTen) return;

    const players = mobileFilteredPlayers().slice(0, MOBILE_RANKING_LIMIT);
    if (!window.__HOME_PLAYERS__ || !Array.isArray(window.__HOME_PLAYERS__)) return;

    const rows = [];

    for (let index = 0; index < MOBILE_RANKING_LIMIT; index += 1) {
      const player = players[index];
      if (!player) {
        rows.push(`
          <tr class="ranking-placeholder">
            <td class="rank-number">${index + 1}</td>
            <td></td><td></td><td></td><td></td>
          </tr>`);
        continue;
      }

      rows.push(`
        <tr>
          <td class="rank-number">${index + 1}</td>
          <td>
            <a class="player-name player-profile-link" href="player.html?id=${encodeURIComponent(player.id)}">${escapeHTML(player.name)}</a>
            ${player.username ? `<span class="player-username">@${escapeHTML(player.username)}</span>` : ''}
          </td>
          <td>${escapeHTML(countryForRegion(player.region))}</td>
          <td>${escapeHTML(player.city)}</td>
          <td class="rating">${escapeHTML(player.rating ?? 1500)}</td>
        </tr>`);
    }

    renderingMobileTen = true;
    tbody.innerHTML = rows.join('');
    const results = document.getElementById('results');
    if (results) results.textContent = `${players.length} لاعب`;
    renderingMobileTen = false;
  }

  function queueMobileRender() {
    requestAnimationFrame(() => requestAnimationFrame(renderMobileTen));
  }

  function installRankingObserver() {
    const tbody = document.getElementById('tbody');
    if (!tbody || tbody.dataset.tenPlayerObserver === '1') return;
    tbody.dataset.tenPlayerObserver = '1';

    new MutationObserver(() => {
      if (renderingMobileTen) return;
      if (!window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches) return;
      const rowCount = tbody.querySelectorAll(':scope > tr').length;
      if (rowCount !== MOBILE_RANKING_LIMIT) queueMobileRender();
    }).observe(tbody, { childList:true });
  }

  async function loadOriginalPatched() {
    try {
      const response = await fetch(ORIGINAL_SRC, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let source = await response.text();

      const fallbackOld = `    const renderFallback = text => {
      const track = document.getElementById('tournamentResultsTickerTrack');
      if (!track) return;
      track.className = 'welcome-ticker-track welcome-ticker-single';
      const item = document.createElement('span');
      item.className = 'welcome-ticker-loading';
      item.textContent = text;
      track.replaceChildren(item);
    };`;

      const fallbackNew = `    const renderFallback = text => {
      const track = document.getElementById('tournamentResultsTickerTrack');
      if (!track) return;
      track.className = 'welcome-ticker-track';

      const buildFallbackGroup = () => {
        const group = document.createElement('div');
        group.className = 'welcome-ticker-group';

        for (let index = 0; index < 10; index += 1) {
          const item = document.createElement('span');
          item.className = 'welcome-ticker-loading';
          item.textContent = text;
          group.appendChild(item);

          const separator = document.createElement('span');
          separator.className = 'welcome-ticker-separator';
          separator.setAttribute('aria-hidden', 'true');
          group.appendChild(separator);
        }

        return group;
      };

      track.replaceChildren(buildFallbackGroup(), buildFallbackGroup());
    };`;

      if (source.includes(fallbackOld)) source = source.replace(fallbackOld, fallbackNew);

      source = source
        .replace('const MOBILE_RANKING_LIMIT = 5;', 'const MOBILE_RANKING_LIMIT = 10;')
        .replace("style.id = 'mobileRankingFiveStyles';", "style.id = 'mobileRankingTenStyles';")
        .replace(/site-notifications-core\.js\?v=[A-Za-z0-9._-]+/g, 'site-notifications-core.js?v=20260910-admin-home1')
        .replace(
          /track\.className = 'welcome-ticker-track welcome-ticker-single';/g,
          "track.className = 'welcome-ticker-track tournament-ticker-single';"
        );
      (0, eval)(source);
    } catch (error) {
      console.error('site notifications compatibility loader failed', error);
    }
  }

  installTournamentTickerMotion();
  installHeroTitleLineup();
  installMobileRankingFrame();
  installCompactProfileIconGrid();
  installRankingObserver();

  window.addEventListener('home-players-loaded', () => {
    installRankingObserver();
    queueMobileRender();
  });
  document.addEventListener('change', event => {
    if (event.target?.id === 'regionFilter' || event.target?.id === 'cityFilter') queueMobileRender();
  });
  window.addEventListener('resize', queueMobileRender, { passive: true });

  loadOriginalPatched().finally(() => {
    installRankingObserver();
    queueMobileRender();
  });
})();