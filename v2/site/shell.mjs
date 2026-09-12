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
  const routeMap = {
    'puzzles.html':'puzzles','puzzle-battle.html':'puzzles','learn.html':'learn','train.html':'train','analysis.html':'analysis',
    'daily.html':'daily','variants.html':'variants','community.html':'community','clubs.html':'clubs',
    'club.html':'clubs','stats.html':'stats','notifications.html':'notifications'
  };
  const activeId = current === 'play-v2.html' ? 'play'
    : current === 'play-v10.html' && new URLSearchParams(query).get('computer') === '1' ? 'computer'
    : current === 'watch.html' || current.endsWith('-watch.html') ? 'watch'
    : current === 'tournaments.html' || current === 'tournaments-app.html' ? 'tournaments'
    : current === 'profile.html' || current === 'player.html' ? 'profile'
    : current === 'settings-v2.html' ? 'settings'
    : routeMap[current] || (current === 'index.html' || current === 'index-app.html' || !current ? 'home' : 'other');

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
    const note = document.createElement('div'); note.className = 'v2-global-note'; note.textContent = 'شطرنج العرب';
    sidebar.append(brand, nav, note);
    document.body.prepend(sidebar);
  }

  if (!document.querySelector('.v2-mobile-nav')) {
    const coreIds = ['home','play','puzzles','community','profile'];
    const mobile = document.createElement('nav');
    mobile.className = 'v2-mobile-nav';
    mobile.setAttribute('aria-label','التنقل السريع');
    for (const id of coreIds) {
      const item = SITE_NAV.find(entry => entry.id === id);
      const link = document.createElement('a');
      link.className = `v2-mobile-link ${id === activeId ? 'active' : ''}`;
      link.href = item.href;
      link.innerHTML = `<span class="v2-global-icon">${item.icon}</span><span>${item.label}</span>`;
      mobile.appendChild(link);
    }
    const moreIds = SITE_NAV.filter(item=>!coreIds.includes(item.id));
    const moreButton=document.createElement('button');
    moreButton.type='button';
    moreButton.className=`v2-mobile-link v2-mobile-more-button ${moreIds.some(item=>item.id===activeId)?'active':''}`;
    moreButton.innerHTML='<span class="v2-global-icon">☰</span><span>المزيد</span>';
    moreButton.setAttribute('aria-expanded','false');
    mobile.appendChild(moreButton);

    const more=document.createElement('div');
    more.className='v2-mobile-more';
    more.hidden=true;
    more.innerHTML=`<div class="v2-mobile-more-card"><div class="v2-mobile-more-head"><strong>كل الأقسام</strong><button type="button" aria-label="إغلاق">×</button></div><div class="v2-mobile-more-grid"></div></div>`;
    const grid=more.querySelector('.v2-mobile-more-grid');
    for(const item of moreIds){
      const link=document.createElement('a');
      link.className=`v2-mobile-more-link ${item.id===activeId?'active':''}`;
      link.href=item.href;
      link.innerHTML=`<span class="v2-global-icon">${item.icon}</span><span>${item.label}</span>`;
      grid.appendChild(link);
    }
    const close=()=>{more.hidden=true;moreButton.setAttribute('aria-expanded','false')};
    moreButton.addEventListener('click',()=>{const opening=more.hidden;more.hidden=!opening;moreButton.setAttribute('aria-expanded',String(opening))});
    more.querySelector('.v2-mobile-more-head button').addEventListener('click',close);
    more.addEventListener('click',(event)=>{if(event.target===more)close()});
    document.body.append(more,mobile);
  }

  function addPhase3Links(){
    if(activeId==='home'){
      const actions=document.querySelector('.home-board-actions');
      if(actions&&!actions.querySelector('[data-phase3="variants"]')){
        const variants=document.createElement('a');variants.className='btn light';variants.href='variants.html';variants.dataset.phase3='variants';variants.textContent='Chess960';
        const battle=document.createElement('a');battle.className='btn light';battle.href='puzzle-battle.html';battle.dataset.phase3='battle';battle.textContent='Puzzle Battle';
        actions.append(variants,battle);
      }
    }
    if(activeId==='puzzles'){
      const head=document.querySelector('.platform-head');
      if(head&&!head.querySelector('[data-phase3="battle"]')){
        const link=document.createElement('a');link.className='platform-btn';link.href='puzzle-battle.html';link.dataset.phase3='battle';link.textContent=current==='puzzle-battle.html'?'الألغاز':'Puzzle Battle';head.appendChild(link);
      }
    }
  }

  async function refreshPhase3Progress(){
    try{
      const api=await import('../platform/api.mjs');
      if(!api.supabase)return;
      const {data:{session}}=await api.supabase.auth.getSession();
      if(!session)return;
      await api.rpc('v3_refresh_achievements');
    }catch(error){
      console.debug('Phase 3 progress refresh skipped',error?.message||error);
    }
  }

  addPhase3Links();
  void refreshPhase3Progress();
}
