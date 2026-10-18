import { renderApprovedPreview } from './move-notebook.mjs?v=20261019-premove-watch-analysis-v1';
import { renderCapturedPieces } from '../play/captured-pieces.mjs?v=20261018-premove-review-v1';
import { supabase } from '../platform/api.mjs';
import { populateHomeSideRail } from './home-side-rail.mjs?v=20261012-large-daily-board-v3';
import { mountPersonalStatistics } from './personal-statistics.mjs?v=20261014-home-stats-points-v2';
import { loadBoardPreferences, applyBoardPreferences } from '../board/controller.mjs?v=20261013-live-home-board-v1';
const desktopAssetVersion=encodeURIComponent(document.querySelector('meta[name="shatranj-asset-version"]')?.content||'20261009-fresh-ui-refresh-v1');
// Game-mode modules load only when chosen. A slow chess-engine or CDN import
// must never hold the whole desktop homepage behind its startup curtain.
function optionalMode(file,mountMethod,stopMethod,viewClass){
  let loaded=null;
  let generation=0;
  return {
    mount(body,options){
      const current=++generation;
      loaded ||= import(`./${file}?v=${desktopAssetVersion}`).catch(error=>{
        loaded=null;
        throw error;
      });
      void loaded.then(module=>{
        if(current!==generation || !body?.isConnected ||
           !document.getElementById('desktopDashboardView')?.classList.contains(viewClass))return;
        module[mountMethod](body,options);
      }).catch(error=>{
        if(current!==generation || !body?.isConnected)return;
        console.error('تعذر فتح قسم الشطرنج',file,error);
        const message=document.createElement('p');
        message.className='desktop-dashboard-message-card';
        message.textContent='تعذر تحميل هذا القسم حاليًا. حاول فتحه مجددًا.';
        body.replaceChildren(message);
      });
    },
    stop(){
      ++generation;
      if(loaded)void loaded.then(module=>module[stopMethod]()).catch(()=>{});
    }
  };
}
const computerMode=optionalMode('inline-computer.mjs','mountInlineComputer','stopInlineComputer','computer-view');
const puzzlesMode=optionalMode('inline-puzzles.mjs','mountInlinePuzzles','stopInlinePuzzles','puzzle-view');
const learnMode=optionalMode('inline-learn.mjs','mountInlineLearn','stopInlineLearn','learn-view');
const mountInlineComputer=(...args)=>computerMode.mount(...args);
const stopInlineComputer=()=>computerMode.stop();
const mountInlinePuzzles=(...args)=>puzzlesMode.mount(...args);
const stopInlinePuzzles=()=>puzzlesMode.stop();
const mountInlineLearn=(...args)=>learnMode.mount(...args);
const stopInlineLearn=()=>learnMode.stop();
let spectatorModulePromise=null;
const spectatorModule=()=>spectatorModulePromise||(spectatorModulePromise=import(`./inline-tournament-spectator.mjs?v=${desktopAssetVersion}`).catch(error=>{spectatorModulePromise=null;throw error;}));
function stopSpectatingTournament(){
  if(spectatorModulePromise)void spectatorModulePromise.then(module=>module.stopInlineTournamentSpectator()).catch(error=>console.warn('تعذر إيقاف المتابعة',error));
}
if(!document.querySelector('link[data-desktop-board-shell]')){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.dataset.desktopBoardShell='1';
  const url=new URL('./desktop-board-shell.css',import.meta.url);
  url.searchParams.set('v',desktopAssetVersion);
  css.href=url.href;
  document.head.insertBefore(css,document.querySelector('link[href*="site-charcoal-theme.css"]'));
}

const desktop=window.matchMedia('(min-width:901px)');
if(desktop.matches && document.querySelector('#homeHero')){
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let rankingAnchor=null;
  let rankingNode=null;
  let inviteAnchor=null;
  let inviteNode=null;
  // Desktop permissions are not inferred from the visible navigation or URL.
  let desktopSignedIn=false;
  let desktopAdminAccess=false;
  let desktopAccessRequest=0;

  function syncMainBoardPreferences(){
    const board=document.getElementById('homeBoardPreview');
    if(board)applyBoardPreferences(board,loadBoardPreferences());
  }

  // The settings picker is embedded in an iframe within the center column.
  // Synchronize immediately without replacing the board, its pieces or game state.
  function watchMainBoardPreferences(){
    window.addEventListener('message',event=>{
      const frame=document.querySelector('#desktopDashboardViewBody .desktop-dashboard-embed');
      if(event.origin!==location.origin || event.source!==frame?.contentWindow ||
         event.data?.type!=='shatranj:board-preferences-updated')return;
      syncMainBoardPreferences();
    });
    window.addEventListener('storage',event=>{
      if(event.key==='shatranj:v2:board-preferences'||event.key===null)syncMainBoardPreferences();
    });
    window.addEventListener('pageshow',syncMainBoardPreferences);
  }

  function setDesktopActionVisibility(element,visible,display='flex'){
    if(!element)return;
    element.hidden=!visible;
    // The theme uses display:...!important; hide must override it.
    element.style.setProperty('display',visible?display:'none','important');
  }

  function applyDesktopPermissions(signedIn=false,isAdmin=false){
    desktopSignedIn=!!signedIn;
    desktopAdminAccess=desktopSignedIn&&!!isAdmin;
    const bottom=document.querySelector('.desktop-sidebar-bottom');
    setDesktopActionVisibility(bottom,desktopSignedIn,'grid');
    setDesktopActionVisibility(bottom?.querySelector('[data-desktop-nav="settings"]'),desktopSignedIn);
    setDesktopActionVisibility(bottom?.querySelector('[data-desktop-nav="admin"]'),desktopAdminAccess);
    setDesktopActionVisibility(bottom?.querySelector('[data-desktop-action="logout"]'),desktopSignedIn);
  }

  function leaveForbiddenDesktopView(){
    const current=location.hash.replace(/^#/,'');
    if((current==='admin'&&!desktopAdminAccess)||(current==='settings'&&!desktopSignedIn)){
      showDashboard('home');
    }
  }

  async function refreshDesktopPermissions(){
    const request=++desktopAccessRequest;
    if(!supabase){
      applyDesktopPermissions(false,false);
      leaveForbiddenDesktopView();
      return;
    }
    try{
      const {data,error}=await supabase.auth.getSession();
      if(request!==desktopAccessRequest)return;
      if(error)throw error;
      if(!data?.session?.user?.id){
        applyDesktopPermissions(false,false);
        leaveForbiddenDesktopView();
        return;
      }
      applyDesktopPermissions(true,false);
      let adminAllowed=false;
      try{
        const {data:access,error:accessError}=await supabase.rpc('admin_get_access');
        if(accessError)throw accessError;
        adminAllowed=!!(Array.isArray(access)?access[0]:access);
      }catch(error){
        console.warn('تعذر التحقق من صلاحية لوحة الإدارة',error);
      }
      if(request!==desktopAccessRequest)return;
      applyDesktopPermissions(true,adminAllowed);
      leaveForbiddenDesktopView();
    }catch(error){
      if(request!==desktopAccessRequest)return;
      console.warn('تعذر التحقق من جلسة المستخدم',error);
      applyDesktopPermissions(false,false);
      leaveForbiddenDesktopView();
    }
  }

  function buildBoard(){
    let preview=document.getElementById('homeBoardPreview');
    if(!preview)return;
    /* The homepage preview used to be an <a> linked to the legacy play page.
       Replace it on desktop with a neutral container so puzzle/computer clicks
       can never trigger the old anchor navigation. Inline play owns navigation. */
    if(preview.tagName==='A'){
      const neutral=document.createElement('div');
      neutral.id=preview.id;
      neutral.className=preview.className;
      neutral.removeAttribute('href');
      neutral.classList.remove('protected-play');
      neutral.setAttribute('role','button');
      neutral.setAttribute('tabindex','0');
      preview.replaceWith(neutral);
      preview=neutral;
    }else{
      preview.removeAttribute('href');
      preview.classList.remove('protected-play');
    }
    preview.classList.add('desktop-board-preview');
    preview.setAttribute('aria-label','فتح اللعب');
    renderApprovedPreview(preview);
    const stage=document.createElement('div');
    stage.className='desktop-board-stage';
    preview.parentNode.insertBefore(stage,preview);
    stage.appendChild(preview);
  }

  // Homepage-only action cards occupy measured free space on the LEFT of the
  // approved chessboard. They never resize, move, or cover the board.
  function buildHomeSideRail(){
    const stage=document.querySelector('.desktop-board-stage');
    const preview=document.getElementById('homeBoardPreview');
    if(!stage||!preview||stage.querySelector('.desktop-home-side-rail'))return;
    const rail=document.createElement('aside');
    rail.className='desktop-home-side-rail';
    rail.setAttribute('aria-label','أنشطة بجانب الرقعة');
    rail.hidden=true;
    rail.innerHTML=`
      <section class="desktop-home-side-card desktop-home-daily-card">
        <div class="desktop-daily-puzzle-heading">
          <h3>لغز اليوم - اضغط على الرقعة للحل</h3>
        </div>
        <div class="desktop-mini-puzzle-board" role="button" tabindex="0"
          data-home-side-action="daily" aria-label="لغز اليوم: اضغط على الرقعة للحل"></div>
        <div class="desktop-mini-puzzle-solvers" aria-live="polite">
          <span>حلّوا لغز اليوم</span>
          <strong data-daily-solver-count>0</strong>
        </div>
      </section>
      <section class="desktop-home-side-card desktop-home-friend-card">
        <h3>مباراة مقترحة</h3>
        <div class="desktop-suggested-friend">
          <strong class="desktop-suggested-name" data-suggested-friend-name>جارٍ اختيار صديق…</strong>
        </div>
        <label class="desktop-suggested-time" data-suggested-time-label hidden>
          <span>اختر وقت المباراة</span>
          <select data-suggested-time aria-label="اختر وقت المباراة">
            <option value="" selected>اختر الوقت</option>
            <option value="5">5 دقائق</option>
            <option value="10">10 دقائق</option>
            <option value="15">15 دقيقة</option>
          </select>
        </label>
        <button type="button" data-home-side-action="friend">اختيار صديق</button>
        <small class="desktop-suggested-message" data-suggested-message role="status" hidden></small>
      </section>`;
    stage.appendChild(rail);
    populateHomeSideRail(rail);
    rail.addEventListener('click',event=>{
      const button=event.target.closest('[data-home-side-action]');
      if(!button||!rail.contains(button))return;
      if(button.dataset.homeSideAction==='daily'){
        if(!document.body.classList.contains('home-signed-in')){
          document.getElementById('desktopGuestLogin')?.click();
          return;
        }
        showDashboard('puzzles',{initialPuzzleMode:'daily'});
      }else if(button.dataset.homeSideAction==='friend'){
        if(!document.body.classList.contains('home-signed-in')){
          document.getElementById('desktopGuestLogin')?.click();
          return;
        }
        showDashboard('invite');
      }
    });
    const sync=()=>{
      // These two idle activities persist across dashboard navigation.
      // Only an actual started online/computer game owns the left-hand space:
      // openMoveNotebook() sets this exact class and mounts the notation panel.
      const notebookActive=document.body.classList.contains('desktop-move-notebook-active');
      const freeSpace=Math.floor(
        preview.getBoundingClientRect().left-stage.getBoundingClientRect().left
      )-12;
      const canShow=!notebookActive&&freeSpace>=125;
      rail.hidden=!canShow;
      if(canShow)rail.style.width=Math.min(250,freeSpace)+'px';
    };
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    observer.observe(preview,{attributes:true,attributeFilter:['class']});
    if(typeof ResizeObserver!=='undefined'){
      const sizes=new ResizeObserver(sync);
      sizes.observe(stage);
      sizes.observe(preview);
    }
    window.addEventListener('resize',sync,{passive:true});
    window.addEventListener('pageshow',sync);
    requestAnimationFrame(sync);
  }

  function captureMoveTargets(){
    rankingNode=document.getElementById('ranking');
    if(rankingNode?.parentNode){
      rankingAnchor=document.createComment('desktop-ranking-anchor');
      rankingNode.parentNode.insertBefore(rankingAnchor,rankingNode);
    }
    inviteNode=document.querySelector('.home-invite-wrap');
    if(inviteNode?.parentNode){
      inviteAnchor=document.createComment('desktop-invite-anchor');
      inviteNode.parentNode.insertBefore(inviteAnchor,inviteNode);
    }
  }

  function restoreMovedContent(){
    if(rankingNode&&rankingAnchor?.parentNode&&rankingNode.parentNode!==rankingAnchor.parentNode){
      rankingAnchor.parentNode.insertBefore(rankingNode,rankingAnchor.nextSibling);
    }
    if(inviteNode&&inviteAnchor?.parentNode&&inviteNode.parentNode!==inviteAnchor.parentNode){
      inviteAnchor.parentNode.insertBefore(inviteNode,inviteAnchor.nextSibling);
    }
  }

  /* Filled pictograms matching the approved sidebar reference. */
  const SIDEBAR_ICONS={
    home:'<path d="M12 2.8 1.7 11.4h2.9V21h6v-6h2.8v6h6v-9.6h2.9z" fill="currentColor"/>',
    play:'<path d="M10.6 2.5c1.7-.7 4.5.1 6.1 2.5.7 1 .8 2.3.4 3.5l-1.8 2.8 2.7 5.2H6.4L5.3 12l2.9-3.7-.7-2.8 3.1 1.1V2.5Zm-.5 5.4a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8" fill="currentColor"/><path d="M5.3 18h13.4l1.4 3H3.9Z" fill="currentColor"/>',
    tournaments:'<path d="M7 2h10v3h4v5c0 3.3-2.2 5.4-5.4 5.6A5.5 5.5 0 0 1 13 18v2h4v2H7v-2h4v-2a5.5 5.5 0 0 1-2.6-2.4C5.2 15.4 3 13.3 3 10V5h4V2Zm0 5H5v3c0 1.6.8 2.6 2.5 3C7.2 11.7 7 9.9 7 7Zm10 0c0 2.9-.2 4.7-.5 6C18.2 12.6 19 11.6 19 10V7Z" fill="currentColor"/>',
    ranking:'<rect x="2" y="14" width="5.3" height="8" rx="1" fill="currentColor"/><rect x="9.3" y="8" width="5.3" height="14" rx="1" fill="currentColor"/><rect x="16.6" y="2" width="5.3" height="20" rx="1" fill="currentColor"/>',
    watch:'<circle cx="12" cy="12" r="10.2" fill="currentColor"/><path d="m10 7 7 5-7 5z" fill="#343230"/>',
    computer:'<rect x="5" y="7" width="14" height="13" rx="3" fill="currentColor"/><path d="M12 4V2M8 3.5h8M2 11v5m20-5v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="12" r="1.2" fill="#343230"/><circle cx="15" cy="12" r="1.2" fill="#343230"/><path d="M9 16h6" stroke="#343230" stroke-width="1.8" stroke-linecap="round"/>',
    puzzles:'<path d="M9 2h5v4a2.5 2.5 0 1 1 5 0h3v6h-3.4a2.5 2.5 0 1 0 0 5H22v5h-7v-3a2.5 2.5 0 0 0-5 0v3H2v-7h3a2.5 2.5 0 1 0 0-5H2V2h7z" fill="currentColor"/>',
    learn:'<path d="m1 9 11-6 11 6-11 6z" fill="currentColor"/><path d="M5 12.7V17c4.2 3.5 9.8 3.5 14 0v-4.3l-7 3.8zM22 10v8" fill="currentColor" stroke="currentColor" stroke-linecap="round"/>',
    invite:'<circle cx="8" cy="8" r="4" fill="currentColor"/><circle cx="17" cy="8" r="3.5" fill="currentColor"/><path d="M1 20v-2c0-3.1 2.9-5.1 7-5.1s7 2 7 5.1v2H1Zm15 0v-2c0-1.7-.6-3-1.6-4.1C18.9 13.3 23 15.4 23 18v2z" fill="currentColor"/>',
    settings:'<path d="m10 1.5-.5 2.4-2 1L5.2 4 3 7.5l1.8 1.8v2.4L3 13.5 5.2 17l2.3-.9 2 1 .5 2.4h4l.5-2.4 2-1 2.3.9 2.2-3.5-1.8-1.8V9.3L21 7.5 18.8 4l-2.3.9-2-1-.5-2.4z" fill="currentColor" transform="translate(0 1)"/><circle cx="12" cy="12" r="3.1" fill="#343230"/>',
    admin:'<path d="m12 1.8 9 4.5V12c0 5.3-3.5 9-9 10.2C6.5 21 3 17.3 3 12V6.3z" fill="currentColor"/><path d="M12 5.5 7 8v4c0 3 1.8 5.1 5 6.1 3.2-1 5-3.1 5-6.1V8Z" fill="#343230"/><path d="m9.5 12.2 1.6 1.6 3.7-3.7" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    logout:'<path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="m15 5 7 7-7 7v-5H9v-4h6z" fill="currentColor"/>'
  };
  function sidebarIcon(key){
    return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">'+(SIDEBAR_ICONS[key]||SIDEBAR_ICONS.play)+'</svg>';
  }
  function navItem({id,label,icon,href='#'}){
    const local=String(href||'').startsWith('#');
    const item=document.createElement(local?'button':'a');
    item.className='v2-global-link desktop-home-nav-link';
    if(local)item.type='button';
    else item.href=href;
    item.dataset.desktopNav=id;
    item.setAttribute('aria-label',label);
    item.title=label;
    item.innerHTML='<span class="desktop-home-nav-icon">'+sidebarIcon(icon)+'</span><span class="desktop-home-nav-label">'+label+'</span>';
    return item;
  }
  function forceSidebarSurface(){
    document.querySelector('.v2-global-sidebar')?.classList.add('desktop-sidebar-refined');
  }
  function buildSidebar(){
    const sidebar=document.querySelector('.v2-global-sidebar');
    const nav=sidebar?.querySelector('.v2-global-nav');
    if(!sidebar||!nav)return;
    sidebar.querySelector('.v2-global-brand')?.remove();
    sidebar.querySelector('.desktop-sidebar-brand')?.remove();
    sidebar.querySelector('.desktop-member-card')?.remove();
    sidebar.querySelector('.desktop-sidebar-bottom')?.remove();
    sidebar.querySelector('.desktop-sidebar-footer')?.remove();


    // User picture takes the first icon slot. Do not recreate a name/score panel.
    const member=document.createElement('div');
    member.className='desktop-member-card desktop-sidebar-avatar-card';
    member.innerHTML=[
      '<button type="button" class="desktop-member-profile desktop-sidebar-avatar-button" title="حسابي" aria-label="حسابي">',
      '<span class="desktop-member-avatar-wrap">',
      '<img id="desktopMemberAvatar" class="desktop-member-avatar" alt="الصورة الشخصية" hidden>',
      '<span id="desktopMemberFallback" class="desktop-member-fallback" aria-hidden="true"></span>',
      '<i class="desktop-member-online-dot" aria-hidden="true"></i></span></button>',
      '<span class="desktop-member-status" id="desktopMemberStatus" hidden><span>متصل الآن</span></span>'
    ].join('');
    sidebar.insertBefore(member,nav);

    // The main navigation now includes only primary sections; game modes live under Play Now.
    nav.replaceChildren(
      navItem({id:'home',label:'الرئيسية',icon:'home',href:'#home'}),
      navItem({id:'play',label:'العب الآن',icon:'play',href:'#play-options'}),
      navItem({id:'tournaments',label:'البطولات',icon:'tournaments',href:'#tournaments'}),
      navItem({id:'ranking',label:'الترتيب',icon:'ranking',href:'#ranking'}),
      navItem({id:'watch',label:'شاهد',icon:'watch',href:'#watch'}),
      navItem({id:'puzzles',label:'الألغاز',icon:'puzzles',href:'#puzzles'}),
      navItem({id:'learn',label:'التعلم',icon:'learn',href:'#learn'})
    );

    const bottom=document.createElement('div');
    bottom.className='desktop-sidebar-bottom';
    const settings=navItem({id:'settings',label:'الإعدادات',icon:'settings',href:'#settings'});
    const admin=navItem({id:'admin',label:'لوحة الإدارة',icon:'admin',href:'#admin'});
    const logout=document.createElement('button');
    logout.type='button';
    logout.className='desktop-sidebar-logout';
    logout.dataset.desktopAction='logout';
    logout.setAttribute('aria-label','تسجيل الخروج');
    logout.title='تسجيل الخروج';
    logout.innerHTML='<span class="desktop-home-nav-icon">'+sidebarIcon('logout')+'</span><span>تسجيل الخروج</span>';
    bottom.append(settings,admin,logout);
    sidebar.append(bottom);
    applyDesktopPermissions(false,false);
    forceSidebarSurface();
  }

  function buildDashboard(){
    document.getElementById('desktopDashboardColumn')?.remove();
    const column=document.createElement('aside');
    column.id='desktopDashboardColumn';
    column.className='desktop-dashboard-column';
    column.innerHTML=`
      <div id="desktopDashboardHome" class="desktop-dashboard-home">
        <section class="desktop-champions-grid" aria-label="أبطال شطرنج العرب">
          <a class="desktop-champion-card" data-champion="week" href="#ranking" aria-label="بطل الأسبوع">
            <span class="desktop-champion-title">
              <span class="desktop-champion-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M8.2 12 6 21l6-3 6 3-2.2-9"/><path d="m10 8 1.4 1.4 2.8-3"/></svg>
            </span>
            <strong>بطل الأسبوع</strong></span>
            <span class="desktop-champion-name">جارٍ التحديث…</span>
            <span class="desktop-champion-result"><b class="desktop-champion-count">—</b><small class="desktop-champion-meta">فوز</small></span>
          </a>
          <a class="desktop-champion-card" data-champion="month" href="#ranking" aria-label="بطل الشهر">
            <span class="desktop-champion-title">
              <span class="desktop-champion-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v7a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v3a4 4 0 0 0 4 4M17 6h3v3a4 4 0 0 1-4 4"/><path d="M12 16v3M8 21h8"/></svg>
            </span>
            <strong>بطل الشهر</strong></span>
            <span class="desktop-champion-name">جارٍ التحديث…</span>
            <span class="desktop-champion-result"><b class="desktop-champion-count">—</b><small class="desktop-champion-meta">فوز</small></span>
          </a>
          <a class="desktop-champion-card" data-champion="site" href="#ranking" aria-label="بطل الموقع">
            <span class="desktop-champion-title">
              <span class="desktop-champion-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 5 4 4-7 4 7 5-4-2 11H5L3 8Z"/><path d="M5 22h14"/></svg>
            </span>
            <strong>بطل الموقع</strong></span>
            <span class="desktop-champion-name">جارٍ التحديث…</span>
            <span class="desktop-champion-result"><b class="desktop-champion-count">—</b><small class="desktop-champion-meta">نقطة</small></span>
          </a>
        </section>
        <section id="desktopHomeStatistics" class="desktop-home-statistics" aria-labelledby="desktopHomeStatisticsTitle">
          <header class="desktop-statistics-header">
            <strong id="desktopHomeStatisticsTitle">الإحصاءات</strong>
            <span id="desktopStatisticsStatus" aria-live="polite">بيانات إنجازاتك في شطرنج العرب</span>
            <button type="button" data-stats-login hidden>تسجيل الدخول</button>
          </header>
          <div class="desktop-statistics-group desktop-statistics-group-play">
            <div class="desktop-statistics-row" data-stat-row="bullet"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3c-5 .1-9.4 2.6-12 7l7 7c4.4-2.6 6.9-7 7-12l-2-2Z"/><path d="m7 10-3 1-2 5 5-2m7 3-1 3-5 2 2-5M7 17l-4 4m1-7-2 2"/><circle cx="15" cy="9" r="1.5"/></svg></span><span>سريع</span></span><strong data-stat-value="bullet" dir="ltr">—</strong></div>
            <div class="desktop-statistics-row" data-stat-row="blitz"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 2 4 14h7l-1 8 10-13h-7l.5-7Z"/></svg></span><span>متوسط</span></span><strong data-stat-value="blitz" dir="ltr">—</strong></div>
            <div class="desktop-statistics-row" data-stat-row="rapid"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="9"/><path d="M12 13V7M9 2h6M12 4v1M17.5 8.5l2-2"/></svg></span><span>عادي</span></span><strong data-stat-value="rapid" dir="ltr">—</strong></div>
            <div class="desktop-statistics-row" data-stat-row="games"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M6.5 3v7M17.5 14v7"/></svg></span><span>المباريات</span></span><strong data-stat-value="games" dir="ltr">—</strong></div>
            <div class="desktop-statistics-row" data-stat-row="points" aria-label="اسم اللاعب ومجموع نقاط اللعب"><span class="desktop-statistics-label"><span data-stats-player-name>اللاعب</span></span><strong data-stat-value="points" dir="ltr">—</strong></div>
          </div>
          <div class="desktop-statistics-group desktop-statistics-group-more">
            <div class="desktop-statistics-row" data-stat-row="puzzles"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h5v4a2.5 2.5 0 1 1 5 0h2v6h-4a2.5 2.5 0 1 0 0 5h4v5h-8v-4a2.5 2.5 0 1 0-5 0v4H2v-8h4a2.5 2.5 0 1 0 0-5H2V2h8z"/></svg></span><span>الألغاز</span></span><strong data-stat-value="puzzles" dir="ltr">—</strong></div>
            <div class="desktop-statistics-row" data-stat-row="lessons"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 10-6 10 6-10 6-10-6Z"/><path d="M6 12v6c4 3 8 3 12 0v-6M22 9v8"/></svg></span><span>الدروس</span></span><strong data-stat-value="lessons" dir="ltr">—</strong></div>
            <div class="desktop-statistics-row" data-stat-row="wins"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10v7a5 5 0 0 1-10 0V3Z"/><path d="M7 5H4v4c0 3 1 4 4 4M17 5h3v4c0 3-1 4-4 4M12 15v5m-5 2h10"/></svg></span><span>الانتصارات</span></span><strong data-stat-value="wins" dir="ltr">—</strong></div>
            <div class="desktop-statistics-row" data-stat-row="achievements"><span class="desktop-statistics-label"><span class="desktop-statistics-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="m8.5 12-2 9 5.5-3 5.5 3-2-9"/><path d="m10 8 1.3 1.3 2.9-2.9"/></svg></span><span>الإنجازات</span></span><strong data-stat-value="achievements" dir="ltr">—</strong></div>
          </div>
        </section>
      </div>
      <section id="desktopDashboardView" class="desktop-dashboard-view" hidden>
        <header class="desktop-dashboard-view-head"><strong id="desktopDashboardViewTitle">الترتيب</strong><button id="desktopDashboardBack" type="button">الرئيسية</button></header>
        <div id="desktopDashboardViewBody" class="desktop-dashboard-view-body"></div>
      </section>`;

    document.body.appendChild(column);
    column.querySelector('#desktopDashboardBack').addEventListener('click',()=>showDashboard('home'));
  }

  // Public, verified ranking data only. Never announce an invented weekly
  // or monthly winner when there have been no recorded wins.
  async function refreshDesktopChampions(){
    const grid=document.querySelector('#desktopDashboardHome .desktop-champions-grid');
    if(!grid||!supabase)return;
    try{
      const {data,error}=await supabase.rpc('get_public_home_champions');
      if(error)throw error;
      for(const kind of ['week','month','site']){
        const card=grid.querySelector(`[data-champion="${kind}"]`);
        if(!card)continue;
        const name=card.querySelector('.desktop-champion-name');
        const count=card.querySelector('.desktop-champion-count');
        const meta=card.querySelector('.desktop-champion-meta');
        const champion=data?.[kind];
        card.classList.toggle('has-champion',Boolean(champion?.id));
        name.textContent=champion?.name||'بانتظار النتائج';
        // Exactly one line per card. Site points are plain digits (1980),
        // not a grouped number (1,980); wins are also displayed compactly.
        count.textContent=champion
          ? String(Number(kind==='site'?champion.rating:champion.wins))
          : '—';
        meta.textContent=kind==='site'?'نقطة':'فوز';
        card.title=kind==='site'
          ? 'بطل الموقع حسب أعلى نقاط'
          : `الأكثر فوزًا خلال آخر ${kind==='week'?'7':'30'} أيام`;
        card.href=champion?.id
          ? `player.html?id=${encodeURIComponent(champion.id)}`
          : '#ranking';
        card.setAttribute('aria-label',
          `${kind==='week'?'بطل الأسبوع':kind==='month'?'بطل الشهر':'بطل الموقع'}: ${name.textContent}، ${count.textContent} ${meta.textContent}`);
      }
    }catch(error){
      console.warn('تعذر تحميل أبطال الموقع',error);
      grid.querySelectorAll('.desktop-champion-card').forEach(card=>{
        card.querySelector('.desktop-champion-name').textContent='تعذر تحديث النتائج';
        card.querySelector('.desktop-champion-count').textContent='—';
      });
    }
  }

  function setActiveNav(id){
    document.querySelectorAll('.desktop-home-nav-link').forEach(link=>{
      const active=link.dataset.desktopNav===(['play-options','computer','invite','variants'].includes(id)?'play':id);
      link.classList.toggle('active',active);
      if(active)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    forceSidebarSurface();
  }

  function showViewTitle(title){
    const titleNode=document.getElementById('desktopDashboardViewTitle');
    if(titleNode)titleNode.textContent=title;
  }

  function tournamentView(body){
    embeddedPageView(body,'tournaments.html','البطولات');
  }

  function inviteView(body){
    inviteNode=document.querySelector('.home-invite-wrap')||inviteNode;
    if(inviteNode){
      if(!inviteAnchor&&inviteNode.parentNode){
        inviteAnchor=document.createComment('desktop-invite-anchor');
        inviteNode.parentNode.insertBefore(inviteAnchor,inviteNode);
      }
      body.appendChild(inviteNode);
      requestAnimationFrame(()=>document.getElementById('homeInviteToggle')?.click());
      return;
    }
    const card=document.createElement('div');
    card.className='desktop-dashboard-message-card';
    card.innerHTML='<h3>دعوة لاعب</h3><p>ابحث عن اللاعب من داخل الموقع وأرسل له دعوة مباشرة.</p>';
    body.appendChild(card);
  }



  // Variant games reuse the existing approved chessboard; the center column
  // holds controls only, and the existing variant engine owns the moves.
  let variantGeneration=0;
  let variantDisposer=null;
  function stopVariants(){
    ++variantGeneration;
    if(variantDisposer){
      variantDisposer();
      variantDisposer=null;
    }
    const preview=document.getElementById('homeBoardPreview');
    if(preview?.classList.contains('inline-variants-active')){
      preview.classList.remove('inline-variants-active');
      renderApprovedPreview(preview);
    }
  }

  async function variantsView(body){
    const generation=++variantGeneration;
    const preview=document.getElementById('homeBoardPreview');
    if(!preview){
      body.textContent='تعذر فتح الرقعة الرئيسية.';
      return;
    }
    const panel=document.createElement('section');
    panel.className='inline-variants-panel';
    panel.setAttribute('aria-label','نماذج اللعب');
    panel.innerHTML=`
      <header class="inline-variants-title"><h2>نماذج اللعب</h2><p>اختر النموذج، ثم ابدأ البحث عن خصم</p></header>
      <section class="inline-variants-players">
        <div id="blackPlayer" class="inline-variant-player">
          <span><strong id="blackName">الأسود</strong><small id="blackMeta"></small></span>
          <strong id="blackClock" class="inline-variant-clock">10:00</strong>
        </div>
        <div id="whitePlayer" class="inline-variant-player">
          <span><strong id="whiteName">الأبيض</strong><small id="whiteMeta"></small></span>
          <strong id="whiteClock" class="inline-variant-clock">10:00</strong>
        </div>
      </section>
      <div id="variantStatus" class="inline-variant-status" role="status">جارٍ تجهيز نماذج اللعب…</div>
      <div class="inline-variant-actions">
        <button type="button" id="variantDraw" disabled>تعادل</button>
        <button type="button" id="variantResign" disabled>استسلام</button>
      </div>
      <section class="inline-variant-controls">
        <label for="variantMode">نموذج اللعب</label>
        <select id="variantMode" aria-label="نموذج اللعب">
          <option value="chess960">شطرنج 960</option>
          <option value="threecheck">الكش الثلاثي</option>
          <option value="kingofthehill">ملك التل</option>
          <option value="crazyhouse">البيت المجنون</option>
          <option value="atomic">الشطرنج الذري</option>
          <option value="antichess">الشطرنج العكسي</option>
          <option value="horde">شطرنج الحشد</option>
          <option value="racingkings">سباق الملوك</option>
        </select>
        <p id="variantModeInfo" class="inline-variant-rules"></p>
        <div class="inline-variant-options">
          <select id="variantTime" aria-label="وقت المباراة">
            <option value="300,0">5 دقائق</option>
            <option value="600,0" selected>10 دقائق</option>
            <option value="900,10">15 + 10</option>
          </select>
          <select id="variantRated" aria-label="نظام المباراة">
            <option value="1">نقاط</option>
            <option value="0">ودي</option>
          </select>
        </div>
        <div class="inline-variant-queue-buttons">
          <button type="button" id="variantQueue">ابدأ البحث</button>
          <button type="button" id="variantCancel" disabled>إلغاء</button>
        </div>
        <div id="variantQueueState" role="status"></div>
      </section>
      <div id="variantBlackPocket" class="inline-variant-pocket variant-pocket" aria-label="جيب الأسود"></div>
      <div id="variantWhitePocket" class="inline-variant-pocket variant-pocket" aria-label="جيب الأبيض"></div>
      <section class="inline-variant-games-panel">
        <h3>مبارياتي في الأنماط</h3>
        <div id="variantGames" class="inline-variant-games">جارٍ التحميل…</div>
      </section>`;
    body.appendChild(panel);
    const board=document.createElement('div');
    board.id='variantBoard';
    board.className='desktop-board-grid variant-board';
    board.setAttribute('role','grid');
    board.setAttribute('aria-label','الرقعة الرئيسية لنماذج اللعب');
    preview.classList.add('inline-variants-active');
    preview.replaceChildren(board);
    try{
      const {mountVariantGame}=await import(`../../v3/variants/app.mjs?v=${desktopAssetVersion}`);
      if(generation!==variantGeneration||!body.isConnected)return;
      const dispose=await mountVariantGame({boardElement:board,scope:body,embedded:true});
      if(generation!==variantGeneration||!body.isConnected){
        dispose?.();
        return;
      }
      variantDisposer=dispose;
    }catch(error){
      if(generation!==variantGeneration||!body.isConnected)return;
      console.error('تعذر تشغيل نماذج اللعب في الرقعة الرئيسية',error);
      preview.classList.remove('inline-variants-active');
      renderApprovedPreview(preview);
      const status=panel.querySelector('#variantStatus');
      if(status)status.textContent='تعذر تحميل نماذج اللعب. حاول إعادة فتح القائمة.';
    }
  }

  // Single desktop entry point for online games, friends, computer, and variants.
  let selectedPlayChoice='';
  function playOptionsView(body){
    const panel=document.createElement('section');
    panel.className='desktop-play-options';
    panel.setAttribute('aria-label','اختر طريقة اللعب');
    panel.innerHTML=[
      '<h2 class="desktop-play-options-intro">اختر طريقة اللعب</h2>',
      '<section class="desktop-play-online-choice" aria-label="اللعب عبر الإنترنت">',
        '<h3>اللعب عبر الإنترنت</h3>',
        '<p>اختر وقت المباراة</p>',
        '<div class="desktop-play-time-options" role="group" aria-label="وقت المباراة">',
          '<button type="button" data-play-minutes="5" aria-pressed="false">5 دقائق</button>',
          '<button type="button" data-play-minutes="10" aria-pressed="true" class="is-selected">10 دقائق</button>',
          '<button type="button" data-play-minutes="15" aria-pressed="false">15 دقيقة</button>',
        '</div>',
        '<button type="button" class="desktop-play-primary" data-play-choice="quick">بدء المباراة</button>',
      '</section>',
      '<nav class="desktop-play-choice-list" aria-label="طرق اللعب">',
        '<button type="button" data-play-choice="computer"><span class="desktop-play-choice-icon">'+sidebarIcon('computer')+'</span><span>اللعب ضد الكمبيوتر</span></button>',
        '<button type="button" data-play-choice="friend"><span class="desktop-play-choice-icon">'+sidebarIcon('invite')+'</span><span>اللعب مع صديق</span></button>',
        '<button type="button" data-play-choice="variants"><span class="desktop-play-choice-icon">'+sidebarIcon('puzzles')+'</span><span>نماذج اللعب</span></button>',
      '</nav>'
    ].join('');
    body.appendChild(panel);
    panel.querySelectorAll('.desktop-play-choice-list [data-play-choice]').forEach(button=>{
      const selected=button.dataset.playChoice===selectedPlayChoice;
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    let selectedMinutes=10;
    panel.addEventListener('click',event=>{
      const time=event.target.closest('[data-play-minutes]');
      if(time&&panel.contains(time)){
        selectedMinutes=Number(time.dataset.playMinutes);
        panel.querySelectorAll('[data-play-minutes]').forEach(button=>{
          const selected=button===time;
          button.classList.toggle('is-selected',selected);
          button.setAttribute('aria-pressed',String(selected));
        });
        return;
      }
      const choice=event.target.closest('[data-play-choice]');
      if(!choice||!panel.contains(choice))return;
      const type=choice.dataset.playChoice;
      if(type!=='quick'){
        selectedPlayChoice=type;
        panel.querySelectorAll('.desktop-play-choice-list [data-play-choice]').forEach(button=>{
          const selected=button===choice;
          button.classList.toggle('is-selected',selected);
          button.setAttribute('aria-pressed',String(selected));
        });
      }
      if(type==='quick'){
        window.dispatchEvent(new CustomEvent('desktop:inline-play-open',{
          detail:{minutes:selectedMinutes,autoStart:true}
        }));
      }else if(type==='computer'){
        showDashboard('computer');
      }else if(type==='friend'){
        showDashboard('invite');
      }else if(type==='variants'){
        showDashboard('variants');
      }
    });
  }

  function computerView(body){
    mountInlineComputer(body);
  }

  // Public profiles replace only the center-column content. Keep the board,
  // live-match clocks and subscriptions intact while inspecting an opponent.
  const playerIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function playerProfilePanel(){
    const column=document.getElementById('desktopDashboardColumn');
    if(!column)return null;
    let panel=document.getElementById('desktopPublicPlayerPanel');
    if(panel)return panel;
    panel=document.createElement('section');
    panel.id='desktopPublicPlayerPanel';
    panel.className='desktop-public-player-panel';
    panel.hidden=true;
    panel.innerHTML='<header class="desktop-public-player-toolbar"><strong>بيانات اللاعب</strong><button type="button" id="desktopPublicPlayerBack">العودة</button></header><iframe class="desktop-public-player-frame" title="بيانات اللاعب" referrerpolicy="same-origin"></iframe>';
    panel.querySelector('#desktopPublicPlayerBack').addEventListener('click',()=>{panel.hidden=true;});
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'){panel.hidden=true;event.preventDefault();}
    });
    column.appendChild(panel);
    return panel;
  }
  function closePublicPlayerPanel(){
    const panel=document.getElementById('desktopPublicPlayerPanel');
    if(panel)panel.hidden=true;
  }
  function openPublicPlayerPanel(playerId){
    if(!desktop.matches||!playerIdPattern.test(String(playerId||'')))return false;
    const panel=playerProfilePanel();
    if(!panel)return false;
    const frame=panel.querySelector('iframe');
    const src='player.html?id='+encodeURIComponent(playerId)+'&embed=panel';
    if(frame.getAttribute('src')!==src)frame.src=src;
    panel.hidden=false;
    panel.querySelector('#desktopPublicPlayerBack')?.focus({preventScroll:true});
    return true;
  }

  function embeddedPageView(body,page,title){
    const frame=document.createElement('iframe');
    frame.className='desktop-dashboard-embed';
    frame.title=title;
    frame.loading='eager';
    frame.src=`${page}?embed=panel&v=${desktopAssetVersion}`;
    // Named players inside other same-origin panels (such as tournament tables)
    // use the same desktop profile surface, not a nested navigation.
    frame.addEventListener('load',()=>{
      try{
        frame.contentDocument?.addEventListener('click',event=>{
          const link=event.target.closest?.('a[href*="player.html?id="]');
          if(!link)return;
          const target=new URL(link.getAttribute('href'),frame.contentWindow.location.href);
          const id=target.searchParams.get('id')||'';
          if(target.origin!==location.origin||!target.pathname.endsWith('/player.html')
            ||!playerIdPattern.test(id))return;
          event.preventDefault();
          event.stopImmediatePropagation();
          openPublicPlayerPanel(id);
        },true);
      }catch(error){console.warn('تعذر ربط ملفات اللاعبين بالعمود الأوسط',error)}
    });
    body.appendChild(frame);
  }

  // Spectators see the same two player cards as online play, but never receive
  // search, draw, resign, or move buttons. The match selector remains between them.
  function createWatchPlayerCard(color){
    const card=document.createElement('section');
    card.className='inline-play-player-card desktop-watch-player-card';
    card.dataset.watchCard=color;
    card.hidden=true;
    card.innerHTML=`
      <span class="inline-play-player-avatar" aria-label="صورة اللاعب">
        <img data-watch-photo="${color}" alt="صورة اللاعب" hidden>
        <span class="inline-play-avatar-fallback" data-watch-avatar="${color}" aria-hidden="true">♟</span>
      </span>
      <div class="inline-play-player-copy">
        <a class="inline-play-player-name" data-watch-name="${color}">—</a>
        <span class="inline-play-player-meta" data-watch-rating="${color}">—</span>
        <span class="inline-play-captured" data-watch-captured="${color}" aria-label="القطع المفقودة">—</span>
        <span class="inline-play-status" data-watch-status="${color}">مشاهدة فقط</span>
      </div>
      <time class="inline-play-clock" data-watch-clock="${color}">--:--</time>`;
    return card;
  }
  function watchView(body){
    const top=createWatchPlayerCard('b');
    const bottom=createWatchPlayerCard('w');
    const list=document.createElement('div');
    list.className='desktop-watch-match-list';
    embeddedPageView(list,'watch.html','المباريات الحالية والمنتهية');
    body.append(top,list,bottom);
  }
  // Resolve verified people behind spectator cards; names are not unique IDs.
  async function hydrateWatchCardProfiles(panel,gameId,gameType){
    if(!supabase||!['human_v2','computer'].includes(gameType))return;
    try{
      const {data,error}=await supabase.rpc('get_public_match_player_ids',{
        p_game_id:gameId,p_game_type:gameType
      });
      if(error)throw error;
      if(panel.dataset.watchGameId!==gameId||!panel.isConnected)return;
      const ids=Array.isArray(data)?data[0]:data;
      for(const color of ['w','b']){
        const card=panel.querySelector('[data-watch-card="'+color+'"]');
        if(!card)continue;
        const isComputer=gameType==='computer'&&color==='b';
        const id=String(color==='w'?ids?.white_player_id||'':ids?.black_player_id||'');
        const name=card.querySelector('[data-watch-name]');
        const picture=card.querySelector('[data-watch-photo]');
        const fallback=card.querySelector('[data-watch-avatar]');
        if(name){
          if(playerIdPattern.test(id))name.href='player.html?id='+encodeURIComponent(id);
          else name.removeAttribute('href');
        }
        if(!picture||!fallback)continue;
        const src=isComputer?'assets/computer-avatar.svg?v=20261018-profile-portraits-v1':
          playerIdPattern.test(id)?supabase.storage.from('avatars').getPublicUrl(id+'/avatar.webp').data.publicUrl:'';
        if(picture.dataset.watchImageSource===src)continue;
        picture.dataset.watchImageSource=src;
        picture.hidden=true;
        fallback.hidden=false;
        picture.onload=()=>{
          if(picture.dataset.watchImageSource!==src)return;
          picture.hidden=false;fallback.hidden=true;
        };
        picture.onerror=()=>{
          if(picture.dataset.watchImageSource!==src)return;
          picture.hidden=true;fallback.hidden=false;
        };
        if(src)picture.src=src;else picture.removeAttribute('src');
      }
    }catch(error){
      console.warn('تعذر تحديث صور لاعبي المشاهدة',error);
    }
  }

  function updateWatchPlayerCards(detail){
    const panel=document.querySelector('#desktopDashboardView.watch-view .desktop-dashboard-view-body');
    if(!panel||!detail||panel.dataset.watchGameId!==detail.gameId)return;
    for(const color of ['b','w']){
      const card=panel.querySelector('[data-watch-card="'+color+'"]');
      if(!card)continue;
      const name=String(color==='w'?detail.whiteName:detail.blackName)||'لاعب';
      const freshRating=color==='w'?detail.whiteRating:detail.blackRating;
      const listedRating=color==='w'?panel.dataset.watchWhiteRating:panel.dataset.watchBlackRating;
      const rating=freshRating!==null&&freshRating!==undefined?freshRating:
        (listedRating&&Number.isFinite(Number(listedRating))?Number(listedRating):null);
      const nameEl=card.querySelector('[data-watch-name]');
      const meta=card.querySelector('[data-watch-rating]');
      const fallback=card.querySelector('[data-watch-avatar]');
      if(nameEl)nameEl.textContent=name;
      if(meta)meta.textContent=Number.isFinite(Number(rating))&&rating!==null?
        'النقاط '+Math.round(Number(rating)):(color==='w'?'الأبيض':'الأسود');
      if(fallback)fallback.textContent=name.trim().charAt(0).toUpperCase()||'♟';
      renderCapturedPieces(card.querySelector('[data-watch-captured]'),detail.fen||'',color);
      const status=card.querySelector('[data-watch-status]');
      const active=detail.status==='مشاهدة مباشرة'&&detail.turn===color;
      const finished=detail.status==='انتهت المباراة'||detail.status==='finished';
      const result=String(detail.result||'').trim().toLowerCase();
      // The computer is black in public computer games. For all games,
      // leave both cards neutral when the result cannot be verified.
      const winnerColor=['1-0','win'].includes(result)?'w':
        ['0-1','loss'].includes(result)?'b':null;
      const draw=finished&&['1/2-1/2','draw'].includes(result);
      const winner=finished&&winnerColor===color;
      const loser=finished&&winnerColor!==null&&winnerColor!==color;
      card.classList.toggle('turn',active&&!finished);
      card.classList.toggle('result-winner',winner);
      card.classList.toggle('result-loser',loser);
      card.classList.toggle('result-draw',draw);
      if(status)status.textContent=winner?'الفائز':loser?'الخاسر':draw?'تعادل':
        active?'دوره الآن':detail.status||'مشاهدة فقط';
    }
    panel.querySelectorAll('.desktop-watch-player-card').forEach(card=>{card.hidden=false;});
  }

  /* Keep ranking row height matched to the live column, without scrolling. */
  let rankingFitQueued=false;
  function fitRankingToPanel(){
    const panel=document.getElementById('desktopDashboardView');
    if(!panel||panel.hidden||!panel.classList.contains('ranking-view'))return;
    const table=panel.querySelector('#ranking .table-wrap table');
    const wrap=panel.querySelector('#ranking .table-wrap');
    if(!table||!wrap)return;
    const top=table.getBoundingClientRect().top;
    const bottom=wrap.getBoundingClientRect().bottom;
    const rows=[...table.querySelectorAll('thead tr, tbody tr')];
    if(!rows.length||!Number.isFinite(top)||!Number.isFinite(bottom)||bottom<=top)return;
    // Reserve one pixel for the sole bottom divider on the table wrapper.
    const available=Math.floor(bottom-top-1);
    if(available<=0)return;
    const rowHeight=available/rows.length;
    table.style.setProperty('--ranking-row-height',rowHeight+'px');
    table.style.setProperty('--ranking-table-height',available+'px');
    table.style.setProperty('height',available+'px','important');
    rows.forEach((row,index)=>{
      const height=index===rows.length-1?available-rowHeight*index:rowHeight;
      row.style.setProperty('height',height+'px','important');
      [...row.cells].forEach(cell=>cell.style.setProperty('height',height+'px','important'));
    });
  }
  function scheduleRankingFit(){
    if(rankingFitQueued)return;
    rankingFitQueued=true;
    requestAnimationFrame(()=>{
      rankingFitQueued=false;
      fitRankingToPanel();
    });
  }

  function ensureApprovedHomePieces(){
    const target=document.getElementById('homeBoardPreview');
    const home=document.getElementById('desktopDashboardHome');
    if(!target||!home||home.hidden)return;
    if(target.classList.contains('inline-tournament-spectator')
      || target.classList.contains('inline-play-active')
      || target.classList.contains('inline-computer-active')
      || target.classList.contains('inline-puzzle-active')
      || target.classList.contains('inline-learn-active')
      || target.classList.contains('inline-variants-active'))return;
    if(target.querySelectorAll('.desktop-board-square > .desktop-board-preview-piece').length!==32){
      renderApprovedPreview(target);
    }
  }
  const DASHBOARD_ROUTES=new Set(['home','play-options','variants','ranking','tournaments','watch','settings','invite','computer','puzzles','learn','profile','admin']);
  let lastDashboardView='home';
  function showDashboard(id='home',{preserveRoute=false,initialPuzzleMode='rated'}={}){
    closePublicPlayerPanel();
    // Navigation always ends active online play before touching the home chessboard.
    window.dispatchEvent(new CustomEvent('desktop:inline-play-stop'));
    stopVariants();
    if(id==='admin'&&!desktopAdminAccess)id='home';
    if(id==='settings'&&!desktopSignedIn)id='home';
    if(!preserveRoute&&DASHBOARD_ROUTES.has(id)){
      const url=new URL(location.href);
      url.hash='#'+(id==='puzzles'&&initialPuzzleMode==='daily'?'puzzles-daily':id);
      history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }
    if(id!=='computer') stopInlineComputer();
    if(id!=='puzzles') stopInlinePuzzles();
    if(id!=='learn') stopInlineLearn();
    // Spectator stays on the main board while the guest selects another match
    // in the watch panel. Restore the approved board on any other route.
    if(!['tournaments','watch'].includes(id)
      ||(id==='tournaments'&&lastDashboardView==='watch')
      ||(id==='watch'&&lastDashboardView==='tournaments')) stopSpectatingTournament();
    lastDashboardView=id;
    const home=document.getElementById('desktopDashboardHome');
    const view=document.getElementById('desktopDashboardView');
    const body=document.getElementById('desktopDashboardViewBody');
    if(!home||!view||!body)return;

    view.classList.toggle('play-options-view',id==='play-options');
    view.classList.toggle('variants-view',id==='variants');
    view.classList.toggle('computer-view',id==='computer');
    view.classList.toggle('ranking-view',id==='ranking');
    view.classList.toggle('puzzle-view',id==='puzzles');
    view.classList.toggle('learn-view',id==='learn');
    view.classList.toggle('profile-view',id==='profile');
    view.classList.toggle('embedded-view',['tournaments','watch','settings','admin'].includes(id));
    view.classList.toggle('watch-view',id==='watch');
    view.classList.toggle('admin-view',id==='admin');
    restoreMovedContent();
    body.replaceChildren();

    if(id==='home'){
      home.hidden=false;
      view.hidden=true;
      setActiveNav('home');
      ensureApprovedHomePieces();
      window.dispatchEvent(new CustomEvent('shatranj:home-statistics-refresh'));
      return;
    }

    home.hidden=true;
    view.hidden=false;
    setActiveNav(id);

    if(id==='play-options'){
      showViewTitle('العب الآن');
      playOptionsView(body);
      return;
    }
    if(id==='variants'){
      showViewTitle('نماذج اللعب');
      void variantsView(body);
      return;
    }
    if(id==='profile'){
      showViewTitle('الملف الشخصي');
      if(document.body.classList.contains('home-signed-in')){
        embeddedPageView(body,'profile.html','الملف الشخصي');
      }else{
        const note=document.createElement('div');
        note.className='desktop-dashboard-message-card';
        note.textContent='سجّل الدخول لعرض ملفك الشخصي.';
        body.appendChild(note);
      }
      return;
    }
    if(id==='ranking'){
      showViewTitle('الترتيب');
      rankingNode=document.getElementById('ranking')||rankingNode;
      if(rankingNode){
        body.appendChild(rankingNode);
        scheduleRankingFit();
      }else tournamentView(body);
      return;
    }
    if(id==='invite'){
      showViewTitle('دعوة لاعب');
      inviteView(body);
      return;
    }
    if(id==='tournaments'){
      showViewTitle('البطولات');
      tournamentView(body);
      return;
    }
    if(id==='watch'){
      showViewTitle('شاهد');
      watchView(body);
      return;
    }
    if(id==='admin'){
      showViewTitle('لوحة الإدارة');
      embeddedPageView(body,'admin.html','لوحة إدارة شطرنج العرب');
      return;
    }
    if(id==='settings'){
      showViewTitle('الإعدادات');
      if(document.body.classList.contains('home-signed-in')){
        embeddedPageView(body,'settings-v2.html','الإعدادات');
      }else{
        document.getElementById('desktopGuestLogin')?.click();
        showDashboard('home');
      }
      return;
    }
    if(id==='computer'){
      showViewTitle('اللعب مع الكمبيوتر');
      computerView(body);
      return;
    }
    if(id==='puzzles'){
      showViewTitle('الألغاز');
      mountInlinePuzzles(body,{initialMode:initialPuzzleMode});
      return;
    }
    if(id==='learn'){
      showViewTitle('تعلّم');
      mountInlineLearn(body);
      return;
    }
    showDashboard('home');
  }

  // Keep the existing watch listing in the middle column on desktop.
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('[data-live-matches-watch]');
    if(!link||!link.hasAttribute('href')||!window.matchMedia('(min-width:901px)').matches)return;
    event.preventDefault();
    showDashboard('watch');
  });

  function copyText(sourceId,targetId,fallback='0'){
    const source=document.getElementById(sourceId);
    const target=document.getElementById(targetId);
    if(target)target.textContent=source?.textContent?.trim()||fallback;
  }

  function formatLastSeen(value){
    if(!value)return 'غير متصل';
    const time=new Date(value).getTime();
    if(!Number.isFinite(time))return 'غير متصل';
    const seconds=Math.max(0,Math.floor((Date.now()-time)/1000));
    if(seconds<60)return 'قبل أقل من دقيقة';
    const minutes=Math.floor(seconds/60);
    if(minutes===1)return 'قبل دقيقة';
    if(minutes===2)return 'قبل دقيقتين';
    if(minutes<60)return `قبل ${minutes} دقيقة`;
    const hours=Math.floor(minutes/60);
    if(hours===1)return 'قبل ساعة';
    if(hours===2)return 'قبل ساعتين';
    if(hours<24)return `قبل ${hours} ساعات`;
    const days=Math.floor(hours/24);
    if(days===1)return 'قبل يوم';
    if(days===2)return 'قبل يومين';
    return `قبل ${days} أيام`;
  }

  let lastPresenceSeenAt=null;

  function setMemberPresence(online,lastSeen=null){
    const member=document.querySelector('.desktop-member-card');
    const status=document.getElementById('desktopMemberStatus');
    const text=status?.querySelector('span');
    if(!member||!status||!text)return;
    const signedIn=document.body.classList.contains('home-signed-in');
    status.hidden=!signedIn;
    if(!signedIn)return;
    member.classList.toggle('is-offline',!online);
    text.textContent=online?'متصل الآن':formatLastSeen(lastSeen);
  }

  async function heartbeatMemberPresence(){
    if(!document.body.classList.contains('home-signed-in')||!supabase)return;
    try{
      const {data,error}=await supabase.rpc('heartbeat_player_presence');
      if(error)throw error;
      lastPresenceSeenAt=data||new Date().toISOString();
      try{localStorage.setItem('shatranj_member_last_seen_at',lastPresenceSeenAt);}catch(_){}
      setMemberPresence(true,lastPresenceSeenAt);
    }catch(error){
      console.warn('تعذر تحديث حالة اللاعب',error);
      let fallback=lastPresenceSeenAt;
      try{fallback=fallback||localStorage.getItem('shatranj_member_last_seen_at');}catch(_){}
      setMemberPresence(false,fallback);
    }
  }

  function syncLiveData(){
    const signedIn=document.body.classList.contains('home-signed-in');
    const member=document.querySelector('.desktop-member-card');
    member?.classList.toggle('is-guest',!signedIn);

    setMemberPresence(signedIn,lastPresenceSeenAt);

    const sourceAvatar=document.getElementById('headerMemberAvatar');
    const targetAvatar=document.getElementById('desktopMemberAvatar');
    const fallback=document.getElementById('desktopMemberFallback');
    const src=sourceAvatar?.getAttribute('src')||'';
    if(targetAvatar&&src&&(!sourceAvatar||!sourceAvatar.hidden)){
      // Reuse the same authenticated photo as the profile menu.
      if(targetAvatar.getAttribute('src')!==src)targetAvatar.src=src;
      targetAvatar.hidden=false;
      if(fallback)fallback.hidden=true;
    }else{
      if(targetAvatar)targetAvatar.hidden=true;
      if(fallback)fallback.hidden=false;
    }
  }

  function watchLiveData(){
    const observer=new MutationObserver(()=>queueMicrotask(syncLiveData));
    ['headerMemberAvatar'].forEach(id=>{
      const node=document.getElementById(id);
      if(node)observer.observe(node,{childList:true,characterData:true,subtree:true,attributes:true});
    });
    let lastSignedIn=document.body.classList.contains('home-signed-in');
    const classObserver=new MutationObserver(()=>{
      syncLiveData();
      const signedIn=document.body.classList.contains('home-signed-in');
      if(signedIn===lastSignedIn)return;
      lastSignedIn=signedIn;
      if(!signedIn){
        ++desktopAccessRequest;
        applyDesktopPermissions(false,false);
        leaveForbiddenDesktopView();
      }else{
        void refreshDesktopPermissions();
      }
    });
    classObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    syncLiveData();
    setTimeout(syncLiveData,400);
    setTimeout(syncLiveData,1200);
    setTimeout(syncLiveData,3000);
  }

  function bindDesktopActions(){
    document.addEventListener('click',event=>{
      if(!desktop.matches)return;
      const publicPlayerLink=event.target.closest('a[href*="player.html?id="]');
      if(publicPlayerLink){
        let target;
        try{target=new URL(publicPlayerLink.getAttribute('href'),location.href)}catch{return}
        const playerId=target.searchParams.get('id');
        if(target.origin===location.origin&&target.pathname.endsWith('/player.html')&&playerIdPattern.test(playerId||'')){
          event.preventDefault();
          event.stopImmediatePropagation();
          openPublicPlayerPanel(playerId);
          return;
        }
      }
      const memberProfile=event.target.closest('.desktop-member-profile');
      if(memberProfile){
        event.preventDefault();
        if(document.body.classList.contains('home-signed-in')){
          showDashboard('profile');
        }else{
          document.getElementById('desktopGuestLogin')?.click();
        }
        return;
      }
      const nav=event.target.closest('[data-desktop-nav]');
      if(nav&&['home','play','ranking','tournaments','watch','settings','invite','computer','puzzles','learn','admin'].includes(nav.dataset.desktopNav)){
        event.preventDefault();
        showDashboard(nav.dataset.desktopNav==='play'?'play-options':nav.dataset.desktopNav);
        return;
      }
      const injectedAdmin=event.target.closest('[data-v2-admin-link]');
      if(injectedAdmin && desktop.matches){
        event.preventDefault();
        if(!desktopAdminAccess)return;
        showDashboard('admin');
        return;
      }
      const logoutAction=event.target.closest('[data-desktop-action="logout"]');
      if(logoutAction){
        event.preventDefault();
        if(!desktopSignedIn)return;
        document.getElementById('navLogout')?.click();
        return;
      }
      const memberAction=event.target.closest('[data-desktop-member-action]');
      if(memberAction?.dataset.desktopMemberAction==='invite'){
        event.preventDefault();
        showDashboard('invite');
        return;
      }
      if(memberAction?.dataset.desktopMemberAction==='computer'){
        event.preventDefault();
        showDashboard('computer');
        return;
      }
      if(memberAction?.dataset.desktopMemberAction==='tournaments'){
        event.preventDefault();
        showDashboard('tournaments');
        return;
      }
      const heroTournaments=event.target.closest('.hero-tournaments-btn');
      if(heroTournaments){
        event.preventDefault();
        showDashboard('tournaments');
        return;
      }
      const heroComputer=event.target.closest('.hero-computer-btn');
      if(heroComputer){
        event.preventDefault();
        showDashboard('computer');
      }
    },true);
  }

  async function boot(){
    for(let i=0;i<40&&!document.querySelector('.v2-global-sidebar');i+=1)await sleep(50);
    if(!document.querySelector('.v2-global-sidebar'))return;
    document.body.classList.add('desktop-board-workspace');
    captureMoveTargets();
    buildBoard();
    syncMainBoardPreferences();
    watchMainBoardPreferences();
    buildSidebar();
    forceSidebarSurface();
    buildDashboard();
    mountPersonalStatistics(supabase);
    buildHomeSideRail();
    void refreshDesktopChampions();
    window.addEventListener('shatranj:tournament-spectator-stopped',()=>{
      // Spectator restores a saved DOM fragment asynchronously; repaint if it was
      // an old empty version of the homepage.
      ensureApprovedHomePieces();
      const frame=document.querySelector('.desktop-dashboard-view.embedded-view .desktop-dashboard-embed');
      if(frame?.contentWindow)frame.contentWindow.postMessage({type:'shatranj-tournament-spectate-stopped'},location.origin);
    });
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin || event.data?.type!=='shatranj-tournament-spectate')return;
      const frame=document.querySelector('.desktop-dashboard-view.embedded-view .desktop-dashboard-embed');
      if(!frame||frame.contentWindow!==event.source)return;
      const gameId=String(event.data.gameId||'');
      if(!/^[A-Za-z0-9_-]{1,100}$/.test(gameId))return;
      void spectatorModule().then(module=>{
        const activeFrame=document.querySelector('.desktop-dashboard-view.embedded-view .desktop-dashboard-embed');
        if(activeFrame===frame) return module.mountInlineTournamentSpectator(gameId);
      }).catch(error=>console.warn('تعذر عرض مباراة البطولة',error));
    });
    window.addEventListener('shatranj:public-watch-updated',event=>{
      updateWatchPlayerCards(event.detail);
    });
    window.addEventListener('shatranj:public-watch-stopped',event=>{
      const panel=document.querySelector('#desktopDashboardView.watch-view .desktop-dashboard-view-body');
      if(panel?.dataset.watchGameId===event.detail?.gameId){
        delete panel.dataset.watchGameId;
        panel.querySelectorAll('.desktop-watch-player-card').forEach(card=>{
          card.hidden=true;
          card.classList.remove('turn','result-winner','result-loser','result-draw');
        });
      }
    });
    // Public match listings live in the middle column; selection only paints
    // read-only positions onto the already mounted homepage chessboard.
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin||event.data?.type!=='shatranj:watch-main-board')return;
      const frame=document.querySelector('#desktopDashboardViewBody .desktop-dashboard-embed');
      if(!frame||event.source!==frame.contentWindow
        ||!frame.getAttribute('src')?.startsWith('watch.html?')
        ||document.getElementById('desktopDashboardView')?.hidden)return;
      const gameId=String(event.data.gameId||'').trim();
      const gameType=String(event.data.gameType||'');
      if(!/^[a-f0-9-]{36}$/i.test(gameId)
        ||!['human','human_v2','computer'].includes(gameType))return;
      void spectatorModule().then(async module=>{
        if(frame!==document.querySelector('#desktopDashboardViewBody .desktop-dashboard-embed'))return;
        const panel=document.querySelector('#desktopDashboardView.watch-view .desktop-dashboard-view-body');
        if(!panel||!panel.contains(frame))return;
        panel.dataset.watchGameId=gameId;
        for(const [key,value] of [['watchWhiteRating',event.data.whiteRating],['watchBlackRating',event.data.blackRating]]){
          if(value!==''&&value!==undefined&&Number.isFinite(Number(value)))
            panel.dataset[key]=String(Math.max(0,Math.round(Number(value))));
          else delete panel.dataset[key];
        }
        // Reset before asynchronous profile resolution: do not erase fresh photos
        // or names if an RPC responds while another match is being selected.
        for(const card of panel.querySelectorAll('.desktop-watch-player-card')){
          card.hidden=false;
          card.classList.remove('turn','result-winner','result-loser','result-draw');
          const color=card.dataset.watchCard;
          const name=card.querySelector('[data-watch-name]');
          const photo=card.querySelector('[data-watch-photo]');
          const fallback=card.querySelector('[data-watch-avatar]');
          if(name){name.textContent='جارٍ تحميل المباراة…';name.removeAttribute('href');}
          if(photo&&fallback){
            const robot=gameType==='computer'&&color==='b';
            const src=robot?'assets/computer-avatar.svg?v=20261018-profile-portraits-v1':'';
            photo.dataset.watchImageSource=src;
            photo.onload=robot?()=>{
              if(photo.dataset.watchImageSource===src){photo.hidden=false;fallback.hidden=true;}
            }:null;
            photo.onerror=()=>{photo.hidden=true;fallback.hidden=false;};
            photo.hidden=true;
            fallback.hidden=false;
            fallback.textContent='♟';
            if(src)photo.src=src;
            else photo.removeAttribute('src');
          }
        }
        void hydrateWatchCardProfiles(panel,gameId,gameType);
        const mounted=await module.mountInlineTournamentSpectator(gameId,{gameType,presentation:'watch'});
        if(!mounted)throw new Error('Spectator board unavailable');
      }).catch(error=>{
        console.warn('تعذر عرض المباراة على الرقعة الرئيسية',error);
        if(frame===document.querySelector('#desktopDashboardViewBody .desktop-dashboard-embed'))
          frame.contentWindow?.postMessage({type:'shatranj:watch-main-board-error'},location.origin);
      });
    });
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin||event.data?.type!=='shatranj-profile-avatar-updated')return;
      const frame=document.querySelector('.desktop-dashboard-view.profile-view .desktop-dashboard-embed');
      if(!frame||frame.contentWindow!==event.source)return;
      const playerId=String(event.data.playerId||'').trim();
      if(!playerId||!supabase)return;
      const path=`${playerId}/avatar.webp`;
      const src=supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      const url=src+'?v='+Date.now();
      for(const id of ['desktopMemberAvatar','headerMemberAvatar']){
        const image=document.getElementById(id);
        if(image){image.src=url;image.hidden=false;}
      }
      document.getElementById('desktopMemberFallback')?.setAttribute('hidden','');
      document.getElementById('headerMemberFallback')?.setAttribute('hidden','');
    });
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin||event.data?.type!=='shatranj:open-player-profile')return;
      const frame=[...document.querySelectorAll('#desktopDashboardViewBody iframe.desktop-dashboard-embed')]
        .find(node=>node.contentWindow===event.source);
      if(!frame||!frame.isConnected||document.getElementById('desktopDashboardView')?.hidden)return;
      const playerId=String(event.data.playerId||'');
      if(playerIdPattern.test(playerId))openPublicPlayerPanel(playerId);
    });
    bindDesktopActions();
    watchLiveData();
    if(supabase){
      supabase.auth.onAuthStateChange(event=>{
        if(event==='SIGNED_OUT'){
          ++desktopAccessRequest;
          applyDesktopPermissions(false,false);
          leaveForbiddenDesktopView();
        }else if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){
          setTimeout(()=>void refreshDesktopPermissions(),0);
        }
      });
    }
    if(typeof ResizeObserver!=='undefined'){
      const rankingPanel=document.getElementById('desktopDashboardView');
      const panelObserver=new ResizeObserver(scheduleRankingFit);
      if(rankingPanel)panelObserver.observe(rankingPanel);
    }
    const rankingBody=document.getElementById('tbody');
    if(rankingBody){
      const rowObserver=new MutationObserver(scheduleRankingFit);
      rowObserver.observe(rankingBody,{childList:true});
    }
    window.addEventListener('resize',scheduleRankingFit);
    document.fonts?.ready?.then(scheduleRankingFit);
    void heartbeatMemberPresence();
    setInterval(()=>{if(!document.hidden)void heartbeatMemberPresence();},30000);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)void heartbeatMemberPresence();
    });

    const initialHash=location.hash.replace(/^#/,'');
    // Public home, rankings and game screens must not wait for an optional
    // permission/network round-trip. Restricted deep links still resolve
    // access rights before selecting their initial view.
    if(initialHash==='admin'||initialHash==='settings'){
      await refreshDesktopPermissions();
    }else{
      void refreshDesktopPermissions();
    }
    if(initialHash==='play'){
      // Preserve #play for the online-play controller loaded immediately after the shell.
      showDashboard('home',{preserveRoute:true});
    }else{
      const dailyPuzzle=initialHash==='puzzles-daily';
      const initialView=dailyPuzzle?'puzzles':DASHBOARD_ROUTES.has(initialHash)?initialHash:'home';
      showDashboard(initialView,{
        preserveRoute:dailyPuzzle||!DASHBOARD_ROUTES.has(initialHash),
        initialPuzzleMode:dailyPuzzle?'daily':'rated'
      });
    }

    // Reveal the desktop only after the canonical board, sidebar, dashboard and
    // initial route have been constructed. The entry gate reads this marker.
    document.body.classList.add('desktop-workspace-initialized');

    window.addEventListener('hashchange',()=>{
      const next=location.hash.replace(/^#/,'');
      if(next==='play'){
        window.dispatchEvent(new CustomEvent('desktop:inline-play-open'));
        return;
      }
      if(next==='puzzles-daily'){
        showDashboard('puzzles',{preserveRoute:true,initialPuzzleMode:'daily'});
        return;
      }
      if(DASHBOARD_ROUTES.has(next))showDashboard(next,{preserveRoute:true});
      else if(!next)showDashboard('home',{preserveRoute:true});
    });
  }

  void boot();
}
