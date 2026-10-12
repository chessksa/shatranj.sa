const tuneAssetVersion=encodeURIComponent(document.querySelector('meta[name="shatranj-asset-version"]')?.content||'20261009-fresh-ui-refresh-v1');
// Start the real online-match controller; its CSS is already preloaded once by index.html.
await import(`./inline-play.mjs?v=${tuneAssetVersion}`);
await import(`./inline-play.mjs?v=${tuneAssetVersion}`);

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
  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    removeSidebarFooter();
    if(restoreDashboardBlocks()||attempts>50){
      clearInterval(timer);
      watchCounts();
      normalizeInlineBoardOrientation();
    }
  },50);
}