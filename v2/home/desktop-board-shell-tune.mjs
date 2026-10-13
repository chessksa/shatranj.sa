const tuneAssetVersion=encodeURIComponent(document.querySelector('meta[name="shatranj-asset-version"]')?.content||'20261009-fresh-ui-refresh-v1');
// Load online-match interactions in parallel, without blocking the home counters
// or keeping the whole page hidden if a match-controller dependency is slow.
void import(`./inline-play.mjs?v=${tuneAssetVersion}`)
  .catch(error=>console.error('تعذر تحميل محرك اللعب المباشر',error));

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

function restoreDashboardBlocks(){
  if(!desktop.matches)return false;
  const home=document.getElementById('desktopDashboardHome');
  // The legacy welcome card was replaced by personal statistics. A stale
  // .desktop-welcome-card check previously blocked platform counters and kept
  // the whole homepage behind the loading gate until its 20s timeout.
  const personalStats=home?.querySelector('#desktopHomeStatistics.desktop-home-statistics');
  const champions=home?.querySelector('.desktop-champions-grid');
  if(!home||!personalStats||!champions)return false;

  let stats=home.querySelector('.desktop-live-stats');
  if(!stats){
    stats=document.createElement('section');
    stats.className='desktop-live-stats';
    stats.setAttribute('aria-label','إحصاءات المنصة');
    stats.innerHTML=`
      <div class="desktop-live-stat" data-live-stat="matches"><small>المباريات الآن</small><strong id="desktopMatchesCount">0</strong><span class="desktop-live-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 3 4 4-4 4-4-4 4-4Zm10 10 4 4-4 4-4-4 4-4Z"/><path d="m9 9 6 6M4 20l3-3M17 7l3-3"/></svg></span></div>
      <div class="desktop-live-stat" data-live-stat="online"><small>المتواجدون</small><strong id="desktopOnlineCount">0</strong><span class="desktop-live-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 19v-2a5.5 5.5 0 0 1 11 0v2"/><circle cx="18" cy="7" r="3" fill="currentColor" stroke="none"/><path d="M18 13v6"/></svg></span></div>
      <div class="desktop-live-stat" data-live-stat="players"><small>المشتركون</small><strong id="desktopPlayersCount">0</strong><span class="desktop-live-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5"/></svg></span></div>`;
    // Platform counters lead the dashboard, before the portrait champion cards.
    home.prepend(stats);
  }else if(stats!==home.firstElementChild){
    home.prepend(stats);
  }

  copyText('headerMatchesCount','desktopMatchesCount','0');
  copyText('headerOnlineCount','desktopOnlineCount','0');
  copyText('headerPlayersCount','desktopPlayersCount','0');
  return true;
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
  watchInlineBoardOrientation();
  // Mount counters immediately when possible; otherwise wait only for the
  // canonical dashboard shell. Never give up while it is still initializing.
  if(restoreDashboardBlocks()){
    watchCounts();
  }else{
    const timer=setInterval(()=>{
      removeSidebarFooter();
      if(restoreDashboardBlocks()){
        clearInterval(timer);
        watchCounts();
        normalizeInlineBoardOrientation();
      }
    },50);
  }
}