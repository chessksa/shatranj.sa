import { SITE_NAV } from './nav.mjs';

const skip = /(?:^|\/)(?:admin|profile-section)\.html$/;
if (!skip.test(location.pathname)) {
  document.querySelectorAll('a[href]').forEach((anchor)=>{
    const raw=anchor.getAttribute('href')||'';
    if(!/(?:^|\/)play(?:-v10)?\.html/i.test(raw)) return;
    try{
      const url=new URL(raw,location.href);
      if(url.searchParams.get('computer')==='1') return;
      anchor.setAttribute('href','play-v2.html?auto=1');
    }catch{}
  });

  const current = location.pathname.split('/').pop() || 'index.html';
  const query = location.search;
  const activeId = current === 'play-v2.html' ? 'play'
    : current === 'play-v10.html' && new URLSearchParams(query).get('computer') === '1' ? 'computer'
    : current === 'watch.html' || current.endsWith('-watch.html') ? 'watch'
    : current === 'tournaments.html' || current === 'tournaments-app.html' ? 'tournaments'
    : current === 'profile.html' || current === 'player.html' ? 'profile'
    : current === 'settings-v2.html' ? 'settings'
    : current === 'index.html' || current === 'index-app.html' || !current ? 'home'
    : 'other';

  document.body.classList.add('v2-shell-active',`v2-route-${activeId}`);
  if (!document.querySelector('.v2-global-sidebar')) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'v2-global-sidebar';
    sidebar.setAttribute('aria-label','التنقل الرئيسي');
    const brand = document.createElement('a');
    brand.className = 'v2-global-brand';
    brand.href = 'index.html';
    brand.innerHTML = '<span class="v2-global-brand-mark">♞</span><span class="v2-global-brand-copy">شطرنج<br>العرب</span>';
    const nav = document.createElement('nav');
    nav.className = 'v2-global-nav';
    for (const item of SITE_NAV) {
      const link = document.createElement('a');
      link.className = `v2-global-link ${item.id === activeId ? 'active' : ''}`;
      link.href = item.href;
      link.innerHTML = `<span class="v2-global-icon">${item.icon}</span><span>${item.label}</span>`;
      nav.appendChild(link);
    }
    const spacer = document.createElement('div'); spacer.className = 'v2-global-spacer';
    const note = document.createElement('div'); note.className = 'v2-global-note'; note.textContent = 'شطرنج العرب';
    sidebar.append(brand, nav, spacer, note);
    document.body.prepend(sidebar);
  }

  if (!document.querySelector('.v2-mobile-nav')) {
    const ids = ['home','play','watch','tournaments','profile'];
    const mobile = document.createElement('nav');
    mobile.className = 'v2-mobile-nav';
    mobile.setAttribute('aria-label','التنقل السريع');
    for (const id of ids) {
      const item = SITE_NAV.find(entry => entry.id === id);
      const link = document.createElement('a');
      link.className = `v2-mobile-link ${id === activeId ? 'active' : ''}`;
      link.href = item.href;
      link.innerHTML = `<span class="v2-global-icon">${item.icon}</span><span>${item.label}</span>`;
      mobile.appendChild(link);
    }
    document.body.appendChild(mobile);
  }
}
