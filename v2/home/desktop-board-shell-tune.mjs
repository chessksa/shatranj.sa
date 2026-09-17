const css=document.createElement('link');
css.rel='stylesheet';
css.href='v2/home/desktop-board-shell-tune.css?v=20260918-correct-stats-actions1';
document.head.appendChild(css);

const desktop=window.matchMedia('(min-width:901px)');

function copyText(sourceId,targetId,fallback='0'){
  const source=document.getElementById(sourceId);
  const target=document.getElementById(targetId);
  if(target)target.textContent=source?.textContent?.trim()||fallback;
}

function makeQuickAction({id,label,sub,icon,href}){
  const el=href?document.createElement('a'):document.createElement('button');
  if(href)el.href=href;
  else el.type='button';
  el.className=`desktop-quick-action${id==='play'?' primary':''}`;
  el.dataset.tuneAction=id;
  el.innerHTML=`<span class="desktop-quick-copy"><strong>${label}</strong><small>${sub}</small></span><span class="desktop-quick-icon">${icon}</span>`;
  return el;
}

function restoreDashboardBlocks(){
  if(!desktop.matches)return false;
  const home=document.getElementById('desktopDashboardHome');
  const welcome=home?.querySelector('.desktop-welcome-card');
  const tip=home?.querySelector('.desktop-tip-card');
  if(!home||!welcome||!tip)return false;

  if(!home.querySelector('.desktop-live-stats')){
    const stats=document.createElement('section');
    stats.className='desktop-live-stats';
    stats.setAttribute('aria-label','إحصاءات المنصة');
    stats.innerHTML=`
      <div class="desktop-live-stat"><strong id="desktopMatchesCount">0</strong><small>المباريات الآن</small></div>
      <div class="desktop-live-stat"><strong id="desktopOnlineCount">0</strong><small>المتواجدون</small></div>
      <div class="desktop-live-stat"><strong id="desktopPlayersCount">0</strong><small>المشتركون</small></div>`;
    welcome.insertAdjacentElement('afterend',stats);
  }

  if(!home.querySelector('.desktop-quick-card')){
    const card=document.createElement('section');
    card.className='desktop-quick-card desktop-quick-card-no-title';
    const actions=document.createElement('div');
    actions.className='desktop-quick-actions';
    actions.append(
      makeQuickAction({id:'tournaments',label:'البطولات',sub:'شارك في البطولات',icon:'♜',href:'tournaments.html'}),
      makeQuickAction({id:'ranking',label:'الترتيب',sub:'عرض الترتيب',icon:'▥'}),
      makeQuickAction({id:'invite',label:'دعوة لاعب',sub:'ادعُ أصدقاءك',icon:'＋'}),
      makeQuickAction({id:'play',label:'ابدأ اللعب',sub:'مباراة جديدة',icon:'⚔',href:'play-v2.html?auto=1'})
    );
    card.appendChild(actions);
    tip.insertAdjacentElement('beforebegin',card);
  }

  copyText('headerMatchesCount','desktopMatchesCount','0');
  copyText('headerOnlineCount','desktopOnlineCount','0');
  copyText('headerPlayersCount','desktopPlayersCount','0');
  return true;
}

function bindTuneActions(){
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-tune-action]');
    if(!action)return;
    const id=action.dataset.tuneAction;
    if(id==='ranking'||id==='invite'){
      event.preventDefault();
      document.querySelector(`[data-desktop-nav="${id}"]`)?.click();
    }
  });
}

function watchCounts(){
  const observer=new MutationObserver(()=>{
    copyText('headerMatchesCount','desktopMatchesCount','0');
    copyText('headerOnlineCount','desktopOnlineCount','0');
    copyText('headerPlayersCount','desktopPlayersCount','0');
  });
  ['headerMatchesCount','headerOnlineCount','headerPlayersCount'].forEach(id=>{
    const node=document.getElementById(id);
    if(node)observer.observe(node,{childList:true,characterData:true,subtree:true});
  });
}

if(desktop.matches){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(restoreDashboardBlocks()||attempts>50){
      clearInterval(timer);
      bindTuneActions();
      watchCounts();
      setTimeout(restoreDashboardBlocks,300);
      setTimeout(restoreDashboardBlocks,1000);
    }
  },50);
}
