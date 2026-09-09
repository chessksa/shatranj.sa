(() => {
  'use strict';

  const ORIGINAL_SRC = 'site-notifications-original.js?v=20260909-ranking10';
  const MOBILE_BREAKPOINT = 800;
  const MOBILE_RANKING_LIMIT = 10;
  const SAUDI_REGIONS = new Set([
    'الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير',
    'تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف'
  ]);

  const escapeHTML = (text) => String(text ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const countryForRegion = (region) => {
    const value = String(region || '').trim();
    return SAUDI_REGIONS.has(value) ? 'السعودية' : value;
  };

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
    if (!tbody) return;

    const players = mobileFilteredPlayers().slice(0, MOBILE_RANKING_LIMIT);
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

    tbody.innerHTML = rows.join('');
    const results = document.getElementById('results');
    if (results) results.textContent = `${players.length} لاعب`;
  }

  function queueMobileRender() {
    requestAnimationFrame(() => requestAnimationFrame(renderMobileTen));
  }

  async function loadOriginalPatched() {
    try {
      const response = await fetch(ORIGINAL_SRC, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let source = await response.text();
      source = source
        .replace('const MOBILE_RANKING_LIMIT = 5;', 'const MOBILE_RANKING_LIMIT = 10;')
        .replace("style.id = 'mobileRankingFiveStyles';", "style.id = 'mobileRankingTenStyles';");
      (0, eval)(source);
    } catch (error) {
      console.error('site notifications compatibility loader failed', error);
    }
  }

  window.addEventListener('home-players-loaded', queueMobileRender);
  document.addEventListener('change', event => {
    if (event.target?.id === 'regionFilter' || event.target?.id === 'cityFilter') queueMobileRender();
  });
  window.addEventListener('resize', queueMobileRender, { passive: true });

  loadOriginalPatched().finally(queueMobileRender);
})();
