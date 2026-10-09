import { supabase } from '../platform/api.mjs';
const desktopAssetVersion=encodeURIComponent(document.querySelector('meta[name="shatranj-asset-version"]')?.content||'20261009-fresh-ui-refresh-v1');
const [computerModule,puzzlesModule,learnModule]=await Promise.all([
  import(`./inline-computer.mjs?v=${desktopAssetVersion}`),
  import(`./inline-puzzles.mjs?v=${desktopAssetVersion}`),
  import(`./inline-learn.mjs?v=${desktopAssetVersion}`)
]);
const {mountInlineComputer,stopInlineComputer}=computerModule;
const {mountInlinePuzzles,stopInlinePuzzles}=puzzlesModule;
const {mountInlineLearn,stopInlineLearn}=learnModule;
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
  document.head.appendChild(css);
}

const desktop=window.matchMedia('(min-width:901px)');
if(desktop.matches && document.querySelector('#homeHero')){
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let rankingAnchor=null;
  let rankingNode=null;
  let inviteAnchor=null;
  let inviteNode=null;

  const COUNTRY_FLAGS={
    'السعودية':'🇸🇦','الأردن':'🇯🇴','مصر':'🇪🇬','الكويت':'🇰🇼','البحرين':'🇧🇭','قطر':'🇶🇦',
    'الإمارات':'🇦🇪','الإمارات العربية المتحدة':'🇦🇪','عمان':'🇴🇲','سلطنة عمان':'🇴🇲','العراق':'🇮🇶',
    'سوريا':'🇸🇾','لبنان':'🇱🇧','فلسطين':'🇵🇸','اليمن':'🇾🇪','المغرب':'🇲🇦','الجزائر':'🇩🇿',
    'تونس':'🇹🇳','ليبيا':'🇱🇾','السودان':'🇸🇩','موريتانيا':'🇲🇷','الصومال':'🇸🇴','جيبوتي':'🇩🇯','جزر القمر':'🇰🇲'
  };

  function countryFlag(country){
    return COUNTRY_FLAGS[String(country||'').trim()]||'🌐';
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
    preview.replaceChildren();
    const grid=document.createElement('span');
    grid.className='desktop-board-grid';
    for(let i=0;i<64;i+=1){
      const row=Math.floor(i/8),col=i%8;
      const square=document.createElement('span');
      square.className=`desktop-board-square ${(row+col)%2?'dark':'light'}`;
      grid.appendChild(square);
    }
    const hint=document.createElement('span');
    hint.className='desktop-board-hint';
    hint.innerHTML='<span class="desktop-board-hint-icon">☝</span><span>اضغط على الرقعة للعب</span>';
    preview.append(grid,hint);
    const stage=document.createElement('div');
    stage.className='desktop-board-stage';
    preview.parentNode.insertBefore(stage,preview);
    stage.appendChild(preview);
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

  const SIDEBAR_ICONS={
    home:'<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/>',
    play:'<path d="M8 5c2-2 5-2 7 0l-2 3 3 4-2 4H7L6 12l4-4z"/><path d="M7 16h10l2 4H5z"/><path d="M10 9h.01"/>',
    tournaments:'<path d="M8 3h8v3h4v3a5 5 0 0 1-5 5h-.3A5 5 0 0 1 13 17v2h4v2H7v-2h4v-2a5 5 0 0 1-1.7-3H9a5 5 0 0 1-5-5V6h4V3Z"/>',
    ranking:'<path d="M5 20v-6h4v6M10 20V9h4v11M15 20V4h4v16"/>',
    watch:'<path d="M2 12c2.6-4 6-6 10-6s7.4 2 10 6c-2.6 4-6 6-10 6S4.6 16 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    computer:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    puzzles:'<path d="M8 3h4v4a2 2 0 1 0 4 0V3h5v6h-4a2 2 0 1 0 0 4h4v8h-7v-4a2 2 0 1 0-4 0v4H3v-8h4a2 2 0 1 0 0-4H3V3h5Z"/>',
    learn:'<path d="m2 9 10-5 10 5-10 5L2 9Zm4 3v5c3.5 3 8.5 3 12 0v-5M22 9v7"/>',
    invite:'<path d="M16 20v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6m-3-3h6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m10 2-.5 2.1-2 1.1-2.1-.6-2 3.5 1.6 1.5v2.5L3.4 14l2 3.5 2.1-.6 2-1.1L10 20h4l.5-2 2-1.1 2.1.6 2-3.5-1.6-1.5V10l1.6-1.5-2-3.5-2.1.6-2-1.1L14 2z"/>',
    admin:'<path d="m12 2 8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/>',
    logout:'<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H9"/>',
    more:'<path d="m6 9 6 6 6-6"/>'
  };
  function sidebarIcon(key){
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(SIDEBAR_ICONS[key]||SIDEBAR_ICONS.play)+'</svg>';
  }
  function navItem({id,label,icon,href='#'}){
    const local=String(href||'').startsWith('#');
    const item=document.createElement(local?'button':'a');
    item.className='v2-global-link desktop-home-nav-link';
    if(local)item.type='button';
    else item.href=href;
    item.dataset.desktopNav=id;
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

    const brand=document.createElement('div');
    brand.className='desktop-sidebar-brand';
    brand.innerHTML='<span class="desktop-sidebar-brand-mark" aria-hidden="true">♞</span><strong>شطرنج العرب</strong>';
    sidebar.insertBefore(brand,nav);

    const member=document.createElement('section');
    member.className='desktop-member-card';
    member.innerHTML=[
      '<a class="desktop-member-profile" href="profile.html" aria-label="عرض الملف الشخصي داخل الواجهة">',
      '<span class="desktop-member-avatar-wrap">',
      '<img id="desktopMemberAvatar" class="desktop-member-avatar" alt="" hidden>',
      '<span id="desktopMemberFallback" class="desktop-member-fallback">♞</span>',
      '<i class="desktop-member-online-dot" aria-hidden="true"></i></span>',
      '<span class="desktop-member-identity">',
      '<strong id="desktopMemberName" class="desktop-member-name">العضو</strong>',
      '<small id="desktopMemberUsername" class="desktop-member-username" dir="ltr" hidden></small>',
      '<small id="desktopMemberLocation" class="desktop-member-location">—</small>',
      '<span class="desktop-member-score" aria-label="نقاط اللاعب"><b id="desktopMemberRating">1500</b><span>نقطة</span></span>',
      '</span></a>',
      '<span class="desktop-member-status" id="desktopMemberStatus" hidden><i aria-hidden="true"></i><span>متصل الآن</span></span>'
    ].join('');
    sidebar.insertBefore(member,nav);

    const primary=[
      navItem({id:'home',label:'الرئيسية',icon:'home',href:'#home'}),
      navItem({id:'play',label:'العب الآن',icon:'play',href:'play-v2.html?auto=1'}),
      navItem({id:'tournaments',label:'البطولات',icon:'tournaments',href:'#tournaments'}),
      navItem({id:'ranking',label:'الترتيب',icon:'ranking',href:'#ranking'}),
      navItem({id:'watch',label:'شاهد',icon:'watch',href:'#watch'})
    ];
    const more=document.createElement('button');
    more.type='button';
    more.className='desktop-sidebar-more-toggle';
    more.setAttribute('aria-expanded','false');
    more.setAttribute('aria-controls','desktopSidebarMorePanel');
    more.innerHTML='<span>المزيد من اللعب</span><span class="desktop-sidebar-more-chevron">'+sidebarIcon('more')+'</span>';
    const morePanel=document.createElement('div');
    morePanel.id='desktopSidebarMorePanel';
    morePanel.className='desktop-sidebar-more-panel';
    morePanel.hidden=true;
    morePanel.append(
      navItem({id:'computer',label:'اللعب مع الكمبيوتر',icon:'computer',href:'#computer'}),
      navItem({id:'puzzles',label:'الألغاز',icon:'puzzles',href:'#puzzles'}),
      navItem({id:'learn',label:'التعلم',icon:'learn',href:'#learn'}),
      navItem({id:'invite',label:'الأصدقاء والتحديات',icon:'invite',href:'#invite'})
    );
    nav.replaceChildren(...primary,more,morePanel);

    const bottom=document.createElement('div');
    bottom.className='desktop-sidebar-bottom';
    const settings=navItem({id:'settings',label:'الإعدادات',icon:'settings',href:'#settings'});
    const admin=navItem({id:'admin',label:'لوحة الإدارة',icon:'admin',href:'admin.html'});
    const logout=document.createElement('button');
    logout.type='button';
    logout.className='desktop-sidebar-logout';
    logout.dataset.desktopAction='logout';
    logout.innerHTML='<span class="desktop-home-nav-icon">'+sidebarIcon('logout')+'</span><span>تسجيل الخروج</span>';
    bottom.append(settings,admin,logout);
    sidebar.append(bottom);
    forceSidebarSurface();
  }

  function buildDashboard(){
    document.getElementById('desktopDashboardColumn')?.remove();
    const column=document.createElement('aside');
    column.id='desktopDashboardColumn';
    column.className='desktop-dashboard-column';
    column.innerHTML=`
      <div id="desktopDashboardHome" class="desktop-dashboard-home">
        <section class="desktop-welcome-card">
          <div class="desktop-welcome-copy">
            <small>مرحبًا بك في</small>
            <h2>شطرنج العرب</h2>
            <p>حيث يلتقي عشاق الشطرنج</p>
            <span class="desktop-welcome-rule"></span>
            <blockquote>« كل مباراة فرصة لتصبح أفضل »</blockquote>
          </div>
          <div class="desktop-welcome-art" aria-hidden="true"><span>♞</span><i>♟</i><b>♜</b></div>
        </section>

        <section class="desktop-tip-card">
          <span class="desktop-tip-icon">◉</span>
          <div><strong>معلومة اليوم</strong><p>التفكير المسبق هو سر الفوز في الشطرنج.</p></div>
        </section>
      </div>
      <section id="desktopDashboardView" class="desktop-dashboard-view" hidden>
        <header class="desktop-dashboard-view-head"><strong id="desktopDashboardViewTitle">الترتيب</strong><button id="desktopDashboardBack" type="button">الرئيسية</button></header>
        <div id="desktopDashboardViewBody" class="desktop-dashboard-view-body"></div>
      </section>`;
    document.body.appendChild(column);
    column.querySelector('#desktopDashboardBack').addEventListener('click',()=>showDashboard('home'));
  }

  function setActiveNav(id){
    document.querySelectorAll('.desktop-home-nav-link').forEach(link=>{
      const active=link.dataset.desktopNav===id;
      link.classList.toggle('active',active);
      if(active)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    if(['computer','puzzles','learn','invite'].includes(id)){
      const more=document.querySelector('.desktop-sidebar-more-toggle');
      const panel=document.getElementById('desktopSidebarMorePanel');
      if(more&&panel){panel.hidden=false;more.setAttribute('aria-expanded','true');}
    }
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

  function computerView(body){
    mountInlineComputer(body);
  }

  function embeddedPageView(body,page,title){
    const frame=document.createElement('iframe');
    frame.className='desktop-dashboard-embed';
    frame.title=title;
    frame.loading='eager';
    frame.src=`${page}?embed=panel&v=${desktopAssetVersion}`;
    body.appendChild(frame);
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

  function showDashboard(id='home'){
    if(['home','ranking','tournaments','watch','settings','invite','computer','puzzles','learn','profile'].includes(id)){
      history.replaceState(null,'','#'+id);
    }
    if(id!=='computer') stopInlineComputer();
    if(id!=='puzzles') stopInlinePuzzles();
    if(id!=='learn') stopInlineLearn();
    if(id!=='tournaments') stopSpectatingTournament();
    const home=document.getElementById('desktopDashboardHome');
    const view=document.getElementById('desktopDashboardView');
    const body=document.getElementById('desktopDashboardViewBody');
    if(!home||!view||!body)return;

    view.classList.toggle('computer-view',id==='computer');
    view.classList.toggle('ranking-view',id==='ranking');
    view.classList.toggle('embedded-view',id==='tournaments');
    view.classList.toggle('puzzle-view',id==='puzzles');
    view.classList.toggle('learn-view',id==='learn');
    view.classList.toggle('profile-view',id==='profile');
    view.classList.toggle('embedded-view',id==='tournaments'||id==='watch'||id==='settings');
    restoreMovedContent();
    body.replaceChildren();

    if(id==='home'){
      home.hidden=false;
      view.hidden=true;
      setActiveNav('home');
      return;
    }

    home.hidden=true;
    view.hidden=false;
    setActiveNav(id);

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
      embeddedPageView(body,'watch.html','شاهد المباريات');
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
      mountInlinePuzzles(body);
      return;
    }
    if(id==='learn'){
      showViewTitle('تعلّم');
      mountInlineLearn(body);
      return;
    }
    showDashboard('home');
  }

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

  let memberUsernameUserId='';
  let memberUsernamePending=false;
  async function syncMemberUsername(){
    const el=document.getElementById('desktopMemberUsername');
    if(!el)return;
    if(!document.body.classList.contains('home-signed-in')){
      el.textContent='';
      el.hidden=true;
      memberUsernameUserId='';
      return;
    }
    if(!supabase||memberUsernamePending)return;
    memberUsernamePending=true;
    let fallbackUsername='';
    try{
      const {data:{session},error:sessionError}=await supabase.auth.getSession();
      if(sessionError||!session?.user?.id)return;
      const userId=session.user.id;
      if(memberUsernameUserId===userId)return;
      fallbackUsername=String(session.user.user_metadata?.username||'').trim().replace(/^@/,'');
      let username=fallbackUsername;
      const {data:profileRows,error:profileError}=await supabase.rpc('get_my_player_profile');
      if(profileError)throw profileError;
      const profile=Array.isArray(profileRows)?profileRows[0]:profileRows;
      if(profile?.id){
        const {data:publicRows,error:publicError}=await supabase.rpc('get_public_player_profile',{p_player_id:profile.id});
        if(publicError)throw publicError;
        const publicProfile=Array.isArray(publicRows)?publicRows[0]:publicRows;
        username=String(publicProfile?.username||username).trim().replace(/^@/,'');
      }
      if(!document.body.classList.contains('home-signed-in'))return;
      el.textContent=username?'@'+username:'';
      el.hidden=!username;
      memberUsernameUserId=userId;
    }catch(error){
      if(fallbackUsername&&document.body.classList.contains('home-signed-in')){
        el.textContent='@'+fallbackUsername;
        el.hidden=false;
      }
      console.warn('تعذر تحميل اسم المستخدم لبطاقة اللاعب',error);
    }finally{
      memberUsernamePending=false;
    }
  }

  function syncLiveData(){
    copyText('headerMemberName','desktopMemberName','العضو');
    void syncMemberUsername();
    copyText('headerMemberRating','desktopMemberRating','1500');

    const signedIn=document.body.classList.contains('home-signed-in');
    const member=document.querySelector('.desktop-member-card');
    member?.classList.toggle('is-guest',!signedIn);

    const countryRaw=document.getElementById('accountRegion')?.textContent?.trim()||'';
    const cityRaw=document.getElementById('accountCity')?.textContent?.trim()||'';
    const country=signedIn&&countryRaw&&countryRaw!=='—'?countryRaw:'';
    const city=signedIn&&cityRaw&&cityRaw!=='—'?cityRaw:'';
    const location=document.getElementById('desktopMemberLocation');
    if(location){
      location.textContent=[city,country].filter(Boolean).join('، ')||'—';
      location.hidden=!signedIn;
    }
    setMemberPresence(signedIn,lastPresenceSeenAt);

    const sourceAvatar=document.getElementById('headerMemberAvatar');
    const targetAvatar=document.getElementById('desktopMemberAvatar');
    const fallback=document.getElementById('desktopMemberFallback');
    const src=sourceAvatar?.getAttribute('src')||'';
    if(targetAvatar&&src){
      targetAvatar.src=src;
      targetAvatar.hidden=false;
      if(fallback)fallback.hidden=true;
    }else{
      if(targetAvatar)targetAvatar.hidden=true;
      if(fallback)fallback.hidden=false;
    }
  }

  function watchLiveData(){
    const observer=new MutationObserver(()=>queueMicrotask(syncLiveData));
    ['headerMemberName','headerMemberRating','accountRegion','headerMemberAvatar'].forEach(id=>{
      const node=document.getElementById(id);
      if(node)observer.observe(node,{childList:true,characterData:true,subtree:true,attributes:true});
    });
    const classObserver=new MutationObserver(()=>syncLiveData());
    classObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    syncLiveData();
    setTimeout(syncLiveData,400);
    setTimeout(syncLiveData,1200);
    setTimeout(syncLiveData,3000);
  }

  function bindDesktopActions(){
    document.addEventListener('click',event=>{
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
      if(nav&&['home','ranking','tournaments','watch','settings','invite','computer','puzzles','learn'].includes(nav.dataset.desktopNav)){
        event.preventDefault();
        showDashboard(nav.dataset.desktopNav);
        return;
      }
      const moreToggle=event.target.closest('.desktop-sidebar-more-toggle');
      if(moreToggle){
        event.preventDefault();
        const panel=document.getElementById('desktopSidebarMorePanel');
        if(panel){
          const next=panel.hidden;
          panel.hidden=!next;
          moreToggle.setAttribute('aria-expanded',String(next));
        }
        return;
      }
      const logoutAction=event.target.closest('[data-desktop-action="logout"]');
      if(logoutAction){
        event.preventDefault();
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
    buildSidebar();
    forceSidebarSurface();
    buildDashboard();
    window.addEventListener('shatranj:tournament-spectator-stopped',()=>{
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
    bindDesktopActions();
    watchLiveData();
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
    const initialView=['home','ranking','tournaments','watch','settings','invite','computer','puzzles','learn','profile'].includes(initialHash)?initialHash:'home';
    showDashboard(initialView);

    window.addEventListener('hashchange',()=>{
      const next=location.hash.replace(/^#/,'');
      showDashboard(['home','ranking','tournaments','watch','settings','invite','computer','puzzles','learn','profile'].includes(next)?next:'home');
    });
  }

  void boot();
}
