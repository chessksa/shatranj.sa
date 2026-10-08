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

  function navItem({id,label,icon,href='#'}){
    const local=String(href||'').startsWith('#');
    const item=document.createElement(local?'button':'a');
    item.className='v2-global-link desktop-home-nav-link';
    if(local){
      item.type='button';
    }else{
      item.href=href;
    }
    item.dataset.desktopNav=id;
    item.innerHTML=`<span class="desktop-home-nav-label">${label}</span><span class="v2-global-icon">${icon}</span>`;
    return item;
  }

  function forceSidebarSurface(){
    const sidebar=document.querySelector('.v2-global-sidebar');
    const nav=sidebar?.querySelector('.v2-global-nav');
    if(!sidebar||!nav)return;

    sidebar.style.setProperty(
      'background',
      'linear-gradient(rgba(2,50,54,.62),rgba(1,29,33,.80)), url("assets/civilization-chess-bg.webp?v=20261007-bg14") 38% center / cover no-repeat',
      'important'
    );
    sidebar.style.setProperty('border-left','1px solid rgba(224,181,103,.34)','important');
    sidebar.style.setProperty('box-shadow','-10px 0 30px rgba(0,0,0,.18)','important');

    nav.style.setProperty('display','grid','important');
    nav.style.setProperty('grid-template-rows','repeat(8,minmax(0,1fr))','important');
    nav.style.setProperty('gap','2px','important');
    nav.style.setProperty('row-gap','2px','important');

    nav.querySelectorAll('.desktop-home-nav-link').forEach(item=>{
      item.style.setProperty('margin','0','important');
      item.style.setProperty('min-height','0','important');
      if(item.classList.contains('active')){
        item.style.setProperty('background','linear-gradient(145deg,rgba(7,65,69,.98),rgba(3,49,53,.98))','important');
        item.style.setProperty('border','1px solid rgba(239,202,114,.88)','important');
        item.style.setProperty('color','#efcf7c','important');
        item.style.setProperty('box-shadow','0 0 0 1px rgba(239,202,114,.08),0 6px 16px rgba(0,0,0,.12)','important');
      }else{
        item.style.setProperty('background','linear-gradient(145deg,rgba(4,54,58,.62),rgba(2,38,42,.66))','important');
        item.style.setProperty('border','1px solid rgba(102,172,173,.28)','important');
        item.style.setProperty('color','#f4efe6','important');
        item.style.setProperty('box-shadow','none','important');
      }
    });
  }

  function buildSidebar(){
    const sidebar=document.querySelector('.v2-global-sidebar');
    const nav=sidebar?.querySelector('.v2-global-nav');
    if(!sidebar||!nav)return;

    sidebar.querySelector('.v2-global-brand')?.remove();
    sidebar.querySelector('.desktop-member-card')?.remove();

    const member=document.createElement('section');
    member.className='desktop-member-card';
    member.innerHTML=`
      <a class="desktop-member-profile" href="profile.html" aria-label="عرض الملف الشخصي داخل الواجهة">
        <span class="desktop-member-avatar-wrap">
          <img id="desktopMemberAvatar" class="desktop-member-avatar" alt="" hidden>
          <span id="desktopMemberFallback" class="desktop-member-fallback">♟</span>
          <i class="desktop-member-online-dot" aria-hidden="true"></i>
        </span>
        <span class="desktop-member-identity">
          <strong id="desktopMemberName" class="desktop-member-name">العضو</strong>
          <small id="desktopMemberUsername" class="desktop-member-username" dir="ltr" hidden></small>
        </span>
      </a>
      <div class="desktop-member-score" aria-label="نقاط اللاعب">
        <b id="desktopMemberRating">1500</b>
        <span>نقطة</span>
      </div>
      <div class="desktop-member-location" id="desktopMemberLocation">—</div>
      <div class="desktop-member-status" id="desktopMemberStatus" hidden>
        <i aria-hidden="true"></i><span>متصل الآن</span>
      </div>
      <nav class="desktop-member-play-icons" aria-label="أيقونات اللعب">
        <a href="play-v2.html?auto=1" title="العب الآن" aria-label="العب الآن">⚔</a>
        <button type="button" data-desktop-member-action="computer" title="الكمبيوتر" aria-label="الكمبيوتر">▣</button>
        <button type="button" data-desktop-member-action="invite" title="دعوة لاعب" aria-label="دعوة لاعب">＋</button>
        <button type="button" data-desktop-member-action="tournaments" title="البطولات" aria-label="البطولات">♜</button>
      </nav>`;
    sidebar.insertBefore(member,nav);

    nav.replaceChildren(
      navItem({id:'home',label:'الرئيسية',icon:'⌂',href:'#home'}),
      navItem({id:'ranking',label:'الترتيب',icon:'▥',href:'#ranking'}),
      navItem({id:'tournaments',label:'البطولات',icon:'♜',href:'#tournaments'}),
      navItem({id:'invite',label:'دعوة لاعب',icon:'＋',href:'#invite'}),
      navItem({id:'play',label:'العب',icon:'⚔',href:'play-v2.html?auto=1'}),
      navItem({id:'computer',label:'الكمبيوتر',icon:'▣',href:'#computer'}),
      navItem({id:'puzzles',label:'الألغاز',icon:'◆',href:'#puzzles'}),
      navItem({id:'learn',label:'تعلّم',icon:'▤',href:'#learn'})
    );

    let footer=sidebar.querySelector('.desktop-sidebar-footer');
    if(!footer){
      footer=document.createElement('div');
      footer.className='desktop-sidebar-footer';
      footer.innerHTML='<span>♥</span><span>معًا .. نصنع مجتمعًا أفضل للشطرنج</span>';
      sidebar.appendChild(footer);
    }
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

  function showDashboard(id='home'){
    if(['home','ranking','tournaments','invite','computer','puzzles','learn','profile'].includes(id)){
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
      if(rankingNode)body.appendChild(rankingNode);
      else tournamentView(body);
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
      if(nav&&['home','ranking','tournaments','invite','computer','puzzles','learn'].includes(nav.dataset.desktopNav)){
        event.preventDefault();
        showDashboard(nav.dataset.desktopNav);
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
    void heartbeatMemberPresence();
    setInterval(()=>{if(!document.hidden)void heartbeatMemberPresence();},30000);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)void heartbeatMemberPresence();
    });

    const initialHash=location.hash.replace(/^#/,'');
    const initialView=['home','ranking','tournaments','invite','computer','puzzles','learn','profile'].includes(initialHash)?initialHash:'home';
    showDashboard(initialView);

    window.addEventListener('hashchange',()=>{
      const next=location.hash.replace(/^#/,'');
      showDashboard(['home','ranking','tournaments','invite','computer','puzzles','learn','profile'].includes(next)?next:'home');
    });
  }

  void boot();
}
