(() => {
  'use strict';

  if (!document.getElementById('homeHero')) return;

  const header = document.querySelector('header.home-header') || document.querySelector('header');
  if (!header) return;

  const SAUDI_REGIONS = new Set([
    'الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير',
    'تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف'
  ]);

  const countryForRegion = value => {
    const region = String(value || '').trim();
    return SAUDI_REGIONS.has(region) ? 'السعودية' : region;
  };

  const style = document.createElement('style');
  style.id = 'homeWelcomeTickerStyles';
  style.textContent = `
    .welcome-ticker{height:34px;overflow:hidden;display:flex;align-items:center;background:#0a302f;color:#f7f3e7;border-top:1px solid rgba(197,163,77,.55);border-bottom:1px solid rgba(197,163,77,.55);position:relative;z-index:19}
    .welcome-ticker::before,.welcome-ticker::after{content:"";position:absolute;top:0;bottom:0;width:34px;z-index:2;pointer-events:none}
    .welcome-ticker::before{right:0;background:linear-gradient(270deg,#0a302f,rgba(10,48,47,0))}
    .welcome-ticker::after{left:0;background:linear-gradient(90deg,#0a302f,rgba(10,48,47,0))}
    .welcome-ticker-track{display:flex;align-items:center;width:max-content;min-width:max-content;direction:ltr;will-change:transform;animation:homeWelcomeTickerMove 42s linear infinite}
    .welcome-ticker:hover .welcome-ticker-track{animation-play-state:paused}
    .welcome-ticker-group{display:flex;align-items:center;flex:none}
    .welcome-ticker-item{direction:rtl;display:inline-flex;align-items:center;white-space:nowrap;font-size:12px;font-weight:800;line-height:1;padding:0 22px}
    .welcome-ticker-separator{width:5px;height:5px;border-radius:50%;background:#c5a34d;flex:none}
    .welcome-ticker-loading{padding:0 20px;font-size:12px;font-weight:800;white-space:nowrap}
    @keyframes homeWelcomeTickerMove{from{transform:translateX(-50%)}to{transform:translateX(0)}}
    @media(max-width:800px){.welcome-ticker{height:30px}.welcome-ticker-item{font-size:11px;padding:0 16px}.welcome-ticker-track{animation-duration:36s}}
    @media(prefers-reduced-motion:reduce){.welcome-ticker{overflow-x:auto}.welcome-ticker-track{animation:none;transform:none}.welcome-ticker-group:nth-child(2){display:none}}
  `;
  document.head.appendChild(style);

  let ticker = document.getElementById('welcomeTicker');
  if (!ticker) {
    ticker = document.createElement('div');
    ticker.id = 'welcomeTicker';
    ticker.className = 'welcome-ticker';
    ticker.setAttribute('role', 'region');
    ticker.setAttribute('aria-label', 'آخر الأعضاء المنضمين');

    const track = document.createElement('div');
    track.id = 'welcomeTickerTrack';
    track.className = 'welcome-ticker-track';
    const loading = document.createElement('span');
    loading.className = 'welcome-ticker-loading';
    loading.textContent = 'جاري تحميل أحدث الأعضاء...';
    track.appendChild(loading);
    ticker.appendChild(track);
    header.insertAdjacentElement('afterend', ticker);
  }

  const makeGroup = members => {
    const group = document.createElement('div');
    group.className = 'welcome-ticker-group';

    members.forEach(member => {
      const name = String(member?.name || 'لاعب جديد').trim() || 'لاعب جديد';
      const country = countryForRegion(member?.region) || 'دولة غير محددة';
      const city = String(member?.city || '').trim();

      const item = document.createElement('span');
      item.className = 'welcome-ticker-item';
      item.textContent = city
        ? `نرحب بانضمام ${name} — ${country}، ${city}`
        : `نرحب بانضمام ${name} — ${country}`;
      group.appendChild(item);

      const separator = document.createElement('span');
      separator.className = 'welcome-ticker-separator';
      separator.setAttribute('aria-hidden', 'true');
      group.appendChild(separator);
    });

    return group;
  };

  const render = rows => {
    const track = document.getElementById('welcomeTickerTrack');
    if (!track) return;

    const members = [...(Array.isArray(rows) ? rows : [])]
      .filter(row => row && row.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    if (!members.length) {
      track.innerHTML = '<span class="welcome-ticker-loading">مرحبًا بكم في شطرنج العرب</span>';
      return;
    }

    track.replaceChildren(makeGroup(members), makeGroup(members));
  };

  window.addEventListener('home-players-loaded', event => render(event.detail));
  if (Array.isArray(window.__HOME_PLAYERS__)) render(window.__HOME_PLAYERS__);
})();
