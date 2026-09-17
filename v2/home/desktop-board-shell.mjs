if(!document.querySelector('link[data-desktop-board-shell]')){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.dataset.desktopBoardShell='1';
  const url=new URL('./desktop-board-shell.css',import.meta.url);
  url.searchParams.set('v','20260917-fixed-board3');
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

  function buildBoard(){
    const preview=document.getElementById('homeBoardPreview');
    if(!preview)return;
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
    const item=document.createElement('a');
    item.className='v2-global-link desktop-home-nav-link';
    item.href=href;
    item.dataset.desktopNav=id;
    item.innerHTML=`<span class="desktop-home-nav-chevron">‹</span><span class="desktop-home-nav-label">${label}</span><span class="v2-global-icon">${icon}</span>`;
    return item;
  }

  function buildSidebar(){
    const sidebar=document.querySelector('.v2-global-sidebar');
    const nav=sidebar?.querySelector('.v2-global-nav');
    const brand=sidebar?.querySelector('.v2-global-brand');
    if(!sidebar||!nav)return;

    if(brand){
      const copy=brand.querySelector('.v2-global-brand-copy');
      if(copy)copy.innerHTML='شطرنج<br>العرب';
      brand.href='index.html';
    }

    sidebar.querySelector('.desktop-member-card')?.remove();
    const member=document.createElement('a');
    member.className='desktop-member-card';
    member.href='profile.html';
    member.innerHTML=`
      <span class="desktop-member-chevron">‹</span>
      <span class="desktop-member-copy">
        <strong id="desktopMemberName">العضو</strong>
        <span class="desktop-member-city"><span aria-hidden="true">⌖</span><b id="desktopMemberCity">—</b></span>
        <span class="desktop-member-rating"><span aria-hidden="true">▥</span><b id="desktopMemberRating">1500</b></span>
        <span class="desktop-member-status"><i></i><b id="desktopMemberStatus">متصل الآن</b></span>
      </span>
      <span class="desktop-member-avatar-wrap">
        <img id="desktopMemberAvatar" class="desktop-member-avatar" alt="" hidden>
        <span id="desktopMemberFallback" class="desktop-member-fallback">♟</span>
        <i class="desktop-member-online-dot"></i>
      </span>`;
    sidebar.insertBefore(member,nav);

    nav.replaceChildren(
      navItem({id:'home',label:'الرئيسية',icon:'⌂',href:'#home'}),
      navItem({id:'ranking',label:'الترتيب',icon:'▥',href:'#ranking'}),
      navItem({id:'invite',label:'دعوة لاعب',icon:'＋',href:'#invite'}),
      navItem({id:'play',label:'العب',icon:'⚔',href:'play-v2.html?auto=1'}),
      navItem({id:'computer',label:'الكمبيوتر',icon:'▣',href:'play-v10.html?computer=1'}),
      navItem({id:'puzzles',label:'الألغاز',icon:'◆',href:'puzzles.html'}),
      navItem({id:'learn',label:'تعلّم',icon:'▤',href:'learn.html'})
    );

    let footer=sidebar.querySelector('.desktop-sidebar-footer');
    if(!footer){
      footer=document.createElement('div');
      footer.className='desktop-sidebar-footer';
      footer.innerHTML='<span>♥</span><span>معًا .. نصنع مجتمعًا أفضل للشطرنج</span>';
      sidebar.appendChild(footer);
    }
  }

  function quickAction({id,label,sub,icon,highlight=false,href='#'}){
    const element=href==='#'?document.createElement('button'):document.createElement('a');
    if(element.tagName==='BUTTON')element.type='button';
    element.className=`desktop-quick-action${highlight?' primary':''}`;
    element.dataset.desktopAction=id;
    element.href=href;
    element.innerHTML=`<span class="desktop-quick-chevron">‹</span><span class="desktop-quick-copy"><strong>${label}</strong><small>${sub}</small></span><span class="desktop-quick-icon">${icon}</span>`;
    return element;
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

        <section class="desktop-live-stats" aria-label="إحصاءات المنصة">
          <div class="desktop-live-stat"><span class="desktop-stat-icon gold">♜</span><strong id="desktopMatchesCount">0</strong><small>المباريات الآن</small></div>
          <div class="desktop-live-stat"><span class="desktop-stat-icon green">●●●</span><strong id="desktopOnlineCount">0</strong><small>المتواجدون</small></div>
          <div class="desktop-live-stat"><span class="desktop-stat-icon cyan">●●●</span><strong id="desktopPlayersCount">0</strong><small>المشتركون</small></div>
        </section>

        <section class="desktop-quick-card">
          <div class="desktop-card-title"><span>⚡</span><strong>إجراءات سريعة</strong></div>
          <div class="desktop-quick-actions" id="desktopQuickActions"></div>
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

    const actions=column.querySelector('#desktopQuickActions');
    actions.append(
      quickAction({id:'tournaments',label:'البطولات',sub:'شارك في البطولات',icon:'♜'}),
      quickAction({id:'ranking',label:'الترتيب',sub:'عرض الترتيب',icon:'▥'}),
      quickAction({id:'invite',label:'دعوة لاعب',sub:'ادعُ أصدقاءك',icon:'＋'}),
      quickAction({id:'play',label:'ابدأ اللعب',sub:'مباراة جديدة',icon:'⚔',highlight:true,href:'play-v2.html?auto=1'})
    );
    column.querySelector('#desktopDashboardBack').addEventListener('click',()=>showDashboard('home'));
  }

  function setActiveNav(id){
    document.querySelectorAll('.desktop-home-nav-link').forEach(link=>{
      link.classList.toggle('active',link.dataset.desktopNav===id);
    });
  }

  function showViewTitle(title){
    const titleNode=document.getElementById('desktopDashboardViewTitle');
    if(titleNode)titleNode.textContent=title;
  }

  function tournamentView(body){
    const ticker=document.getElementById('tournamentResultsTickerTrack')?.innerText?.trim();
    const card=document.createElement('div');
    card.className='desktop-dashboard-message-card';
    const title=document.createElement('h3');
    title.textContent='البطولات';
    const text=document.createElement('p');
    text.textContent=ticker||'اطلع على البطولات المفتوحة والجارية وسجّل مباشرة.';
    const link=document.createElement('a');
    link.href='tournaments.html';
    link.className='desktop-dashboard-primary-link';
    link.textContent='فتح صفحة البطولات';
    card.append(title,text,link);
    body.appendChild(card);
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

  function showDashboard(id='home'){
    const home=document.getElementById('desktopDashboardHome');
    const view=document.getElementById('desktopDashboardView');
    const body=document.getElementById('desktopDashboardViewBody');
    if(!home||!view||!body)return;

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
    showDashboard('home');
  }

  function copyText(sourceId,targetId,fallback='0'){
    const source=document.getElementById(sourceId);
    const target=document.getElementById(targetId);
    if(target)target.textContent=source?.textContent?.trim()||fallback;
  }

  function syncLiveData(){
    copyText('headerPlayersCount','desktopPlayersCount','0');
    copyText('headerOnlineCount','desktopOnlineCount','0');
    copyText('headerMatchesCount','desktopMatchesCount','0');
    copyText('headerMemberName','desktopMemberName','العضو');
    copyText('headerMemberRating','desktopMemberRating','1500');
    copyText('accountCity','desktopMemberCity','—');

    const signedIn=document.body.classList.contains('home-signed-in');
    const status=document.getElementById('desktopMemberStatus');
    if(status)status.textContent=signedIn?'متصل الآن':'غير مسجل';
    document.querySelector('.desktop-member-card')?.classList.toggle('is-guest',!signedIn);

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
    ['headerPlayersCount','headerOnlineCount','headerMatchesCount','headerMemberName','headerMemberRating','accountCity','headerMemberAvatar'].forEach(id=>{
      const node=document.getElementById(id);
      if(node)observer.observe(node,{childList:true,characterData:true,subtree:true,attributes:true});
    });
    const classObserver=new MutationObserver(()=>syncLiveData());
    classObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    syncLiveData();
    setTimeout(syncLiveData,400);
    setTimeout(syncLiveData,1200);
  }

  function bindDesktopActions(){
    document.addEventListener('click',event=>{
      const nav=event.target.closest('[data-desktop-nav]');
      if(nav&&['home','ranking','invite'].includes(nav.dataset.desktopNav)){
        event.preventDefault();
        showDashboard(nav.dataset.desktopNav);
        return;
      }
      const action=event.target.closest('[data-desktop-action]');
      if(action&&['ranking','invite','tournaments'].includes(action.dataset.desktopAction)){
        event.preventDefault();
        showDashboard(action.dataset.desktopAction);
      }
    });
  }

  async function boot(){
    for(let i=0;i<40&&!document.querySelector('.v2-global-sidebar');i+=1)await sleep(50);
    if(!document.querySelector('.v2-global-sidebar'))return;
    document.body.classList.add('desktop-board-workspace');
    captureMoveTargets();
    buildBoard();
    buildSidebar();
    buildDashboard();
    bindDesktopActions();
    watchLiveData();
    showDashboard('home');
  }

  void boot();
}
