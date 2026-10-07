import './inline-play.mjs?v=20261006-learn-board1';

const inlinePlayCss=document.createElement('link');
inlinePlayCss.rel='stylesheet';
inlinePlayCss.href='v2/home/inline-play.css?v=20260918-piece-black-thin1';
document.head.appendChild(inlinePlayCss);

const css=document.createElement('link');
css.rel='stylesheet';
css.href='v2/home/desktop-board-shell-tune.css?v=20260918-no-tip-card1';
document.head.appendChild(css);

const cleanupCss=document.createElement('link');
cleanupCss.rel='stylesheet';
cleanupCss.href='v2/home/desktop-sidebar-cleanup.css?v=20261007-sidebar-bg2';
document.head.appendChild(cleanupCss);

const memberCardCss=document.createElement('link');
memberCardCss.rel='stylesheet';
memberCardCss.href='v2/home/desktop-member-card-v2.css?v=20261007-member-card2';
document.head.appendChild(memberCardCss);

const boardThemeCss=document.createElement('link');
boardThemeCss.rel='stylesheet';
boardThemeCss.href='v2/home/board-theme-override.css?v=20261006-frame-teal10';
document.head.appendChild(boardThemeCss);


const statsOrderCss=document.createElement('style');
statsOrderCss.textContent=`@media(min-width:901px){
  .desktop-live-stat small{margin-top:0!important}
  .desktop-live-stat strong{margin-top:6px!important}
  .inline-play-square{position:relative!important}
  .inline-play-piece{width:94%!important;height:94%!important}
}`;
document.head.appendChild(statsOrderCss);

const desktop=window.matchMedia('(min-width:901px)');
const FILES=['a','b','c','d','e','f','g','h'];
const WHITE_BOARD_ORDER=[8,7,6,5,4,3,2,1].flatMap(rank=>FILES.map(file=>`${file}${rank}`));

function normalizeBoardGrid(grid){
  if(!grid)return;
  grid.style.setProperty('direction','ltr','important');
  const squares=[...grid.querySelectorAll(':scope > [data-square]')];
  if(squares.length!==64)return;

  for(const square of squares){
    const name=String(square.dataset.square||'');
    const fileIndex=FILES.indexOf(name[0]);
    const rank=Number(name[1]);
    if(fileIndex<0||rank<1||rank>8)continue;

    square.style.setProperty('grid-column',String(fileIndex+1),'important');
    square.style.setProperty('grid-row',String(9-rank),'important');

    const isLight=(fileIndex+rank)%2===0;
    square.classList.toggle('light',isLight);
    square.classList.toggle('dark',!isLight);
  }

  const bySquare=new Map(squares.map(square=>[square.dataset.square,square]));
  const ordered=WHITE_BOARD_ORDER.map(name=>bySquare.get(name)).filter(Boolean);
  if(ordered.length!==64)return;
  if(ordered.some((square,index)=>squares[index]!==square))grid.append(...ordered);
}

function normalizeInlineBoardOrientation(){
  normalizeBoardGrid(document.getElementById('inlinePlayBoardGrid'));
  normalizeBoardGrid(document.getElementById('inlineComputerBoardGrid'));
}

function watchInlineBoardOrientation(){
  const observer=new MutationObserver(()=>normalizeInlineBoardOrientation());
  observer.observe(document.body,{childList:true,subtree:true});
  normalizeInlineBoardOrientation();
}

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
  watchInlineBoardOrientation();
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
      setTimeout(()=>{restoreDashboardBlocks();labelMemberActions();removeSidebarFooter();removeDailyTipCard();normalizeInlineBoardOrientation();},300);
      setTimeout(()=>{restoreDashboardBlocks();labelMemberActions();removeSidebarFooter();removeDailyTipCard();normalizeInlineBoardOrientation();},1000);
    }
  },50);
}