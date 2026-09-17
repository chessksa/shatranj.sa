import './inline-play.mjs?v=20260918-inline-play3';

const inlinePlayCss=document.createElement('link');
inlinePlayCss.rel='stylesheet';
inlinePlayCss.href='v2/home/inline-play.css?v=20260918-piece-center1';
document.head.appendChild(inlinePlayCss);

const css=document.createElement('link');
css.rel='stylesheet';
css.href='v2/home/desktop-board-shell-tune.css?v=20260918-no-tip-card1';
document.head.appendChild(css);

const cleanupCss=document.createElement('link');
cleanupCss.rel='stylesheet';
cleanupCss.href='v2/home/desktop-sidebar-cleanup.css?v=20260918-no-tip-card1';
document.head.appendChild(cleanupCss);

const statsOrderCss=document.createElement('style');
statsOrderCss.textContent=`@media(min-width:901px){
  .desktop-live-stat small{margin-top:0!important}
  .desktop-live-stat strong{margin-top:6px!important}
  .inline-play-square{position:relative!important}
  .inline-play-piece{width:94%!important;height:94%!important}
}`;
document.head.appendChild(statsOrderCss);

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

function labelMemberActions(){
  const actions=document.querySelector('.desktop-member-play-icons');
  if(!actions)return false;
  const items=[...actions.children];
  const labels=[
    {label:'العب',icon:'⚔'},
    {label:'كمبيوتر',icon:'▣'},
    {label:'دعوة',icon:'＋'},
    {label:'بطولة',icon:'♜'}
  ];
  items.forEach((item,index)=>{
    const meta=labels[index];
    if(!meta)return;
    item.classList.add('desktop-member-play-action');
    item.innerHTML=`<span class="desktop-member-play-label">${meta.label}</span><span class="desktop-member-play-symbol" aria-hidden="true">${meta.icon}</span>`;
  });
  return true;
}

function removeDailyTipCard(){
  document.querySelector('.desktop-tip-card')?.remove();
}

function restoreDashboardBlocks(){
  if(!desktop.matches)return false;
  const home=document.getElementById('desktopDashboardHome');
  const welcome=home?.querySelector('.desktop-welcome-card');
  if(!home||!welcome)return false;

  let stats=home.querySelector('.desktop-live-stats');
  if(!stats){
    stats=document.createElement('section');
    stats.className='desktop-live-stats';
    stats.setAttribute('aria-label','إحصاءات المنصة');
    stats.innerHTML=`
      <div class="desktop-live-stat"><small>المباريات الآن</small><strong id="desktopMatchesCount">0</strong></div>
      <div class="desktop-live-stat"><small>المتواجدون</small><strong id="desktopOnlineCount">0</strong></div>
      <div class="desktop-live-stat"><small>المشتركون</small><strong id="desktopPlayersCount">0</strong></div>`;
    welcome.insertAdjacentElement('afterend',stats);
  }

  let card=home.querySelector('.desktop-quick-card');
  if(!card){
    card=document.createElement('section');
    card.className='desktop-quick-card desktop-quick-card-no-title';
    const actions=document.createElement('div');
    actions.className='desktop-quick-actions';
    actions.append(
      makeQuickAction({id:'tournaments',label:'البطولات',sub:'شارك في البطولات',icon:'♜',href:'tournaments.html'}),
      makeQuickAction({id:'ranking',label:'الترتيب',sub:'عرض الترتيب',icon:'▥'}),
      makeQuickAction({id:'invite',label:'دعوة لاعب',sub:'ادعُ أصدقاءك',icon:'＋'}),
      makeQuickAction({id:'play',label:'ابدأ اللعب',sub:'مباراة جديدة',icon:'⚔',href:'#play'})
    );
    card.appendChild(actions);
    stats.insertAdjacentElement('afterend',card);
  }

  removeDailyTipCard();
  copyText('headerMatchesCount','desktopMatchesCount','0');
  copyText('headerOnlineCount','desktopOnlineCount','0');
  copyText('headerPlayersCount','desktopPlayersCount','0');
  labelMemberActions();
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

function removeSidebarFooter(){
  document.querySelector('.desktop-sidebar-footer')?.remove();
}

if(desktop.matches){
  removeSidebarFooter();
  removeDailyTipCard();
  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    removeSidebarFooter();
    if(restoreDashboardBlocks()||attempts>50){
      clearInterval(timer);
      bindTuneActions();
      watchCounts();
      labelMemberActions();
      removeSidebarFooter();
      removeDailyTipCard();
      setTimeout(()=>{restoreDashboardBlocks();labelMemberActions();removeSidebarFooter();removeDailyTipCard();},300);
      setTimeout(()=>{restoreDashboardBlocks();labelMemberActions();removeSidebarFooter();removeDailyTipCard();},1000);
    }
  },50);
}
