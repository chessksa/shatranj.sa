const mobile=window.matchMedia('(max-width:900px)');

if(mobile.matches&&document.querySelector('#homeHero')){
  const legacyMobileSelectors=[
    'link[data-v2-mobile-ui]',
    'link[data-v2-mobile-home]',
    'link[data-v2-mobile-home-polish]',
    'link[data-v2-mobile-home-cleanup]'
  ];

  function removeLegacyMobileLayers(){
    legacyMobileSelectors.forEach(selector=>document.querySelectorAll(selector).forEach(node=>node.remove()));
  }

  removeLegacyMobileLayers();
  const headObserver=new MutationObserver(()=>removeLegacyMobileLayers());
  headObserver.observe(document.head,{childList:true});

  if(!document.querySelector('link[data-mobile-board-shell]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.dataset.mobileBoardShell='1';
    const url=new URL('./mobile-board-shell.css',import.meta.url);
    url.searchParams.set('v','20260920-board-workspace1');
    link.href=url.href;
    document.head.appendChild(link);
  }

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const tabs=[
    {id:'home',label:'الرئيسية',icon:'⌂'},
    {id:'play',label:'العب',icon:'⚔'},
    {id:'computer',label:'كمبيوتر',icon:'▣'},
    {id:'ranking',label:'الترتيب',icon:'▥'},
    {id:'invite',label:'دعوة',icon:'＋'},
    {id:'more',label:'المزيد',icon:'☰'}
  ];

  let rankingNode=null;
  let rankingAnchor=null;
  let inviteNode=null;
  let inviteAnchor=null;
  let registerNode=null;
  let registerAnchor=null;
  let activeView='home';
  let modeLabel=null;
  let panel=null;

  function pieceFor(square){
    const file=square.charCodeAt(0)-97;
    const rank=Number(square[1]);
    const order=['r','n','b','q','k','b','n','r'];
    if(rank===8)return 'b'+order[file];
    if(rank===7)return 'bp';
    if(rank===2)return 'wp';
    if(rank===1)return 'w'+order[file];
    return '';
  }

  function orderedSquares(){
    const out=[];
    for(let rank=8;rank>=1;rank-=1){
      for(const file of ['a','b','c','d','e','f','g','h']) out.push(file+rank);
    }
    return out;
  }

  function buildBoard(){
    const preview=document.getElementById('homeBoardPreview');
    if(!preview)return false;
    preview.classList.add('mobile-fixed-board');
    preview.classList.remove('protected-play');
    preview.removeAttribute('href');
    preview.setAttribute('role','button');
    preview.setAttribute('tabindex','0');
    preview.setAttribute('aria-label','اختر اللعب من واجهة الرقعة');
    preview.replaceChildren();

    const grid=document.createElement('div');
    grid.className='mobile-board-grid';
    orderedSquares().forEach(squareName=>{
      const file=squareName.charCodeAt(0)-97;
      const rank=Number(squareName[1]);
      const square=document.createElement('span');
      square.className=`mobile-board-square ${(file+rank)%2===1?'light':'dark'}`;
      const piece=pieceFor(squareName);
      if(piece){
        const img=document.createElement('img');
        img.className='mobile-board-piece';
        img.src=`assets/pieces/${piece}.png`;
        img.alt='';
        img.draggable=false;
        square.appendChild(img);
      }
      grid.appendChild(square);
    });

    modeLabel=document.createElement('span');
    modeLabel.className='mobile-board-mode';
    modeLabel.textContent='الرئيسية';
    preview.append(grid,modeLabel);

    preview.addEventListener('click',event=>{
      event.preventDefault();
      showView('play');
    });
    preview.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        showView('play');
      }
    });
    return true;
  }

  function buildWorkspace(){
    const grid=document.querySelector('#homeHero .home-hero-grid');
    if(!grid)return false;

    document.getElementById('mobileWorkspaceTabs')?.remove();
    document.getElementById('mobileWorkspacePanel')?.remove();

    const rail=document.createElement('nav');
    rail.id='mobileWorkspaceTabs';
    rail.className='mobile-workspace-tabs';
    rail.setAttribute('aria-label','أقسام واجهة الجوال');

    tabs.forEach(item=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='mobile-workspace-tab';
      button.dataset.mobileWorkspace=item.id;
      button.innerHTML=`<span aria-hidden="true">${item.icon}</span><span>${item.label}</span>`;
      button.addEventListener('click',()=>showView(item.id));
      rail.appendChild(button);
    });

    panel=document.createElement('section');
    panel.id='mobileWorkspacePanel';
    panel.className='mobile-workspace-panel';
    panel.innerHTML='<div class="mobile-workspace-view"><header class="mobile-workspace-view-head"><strong id="mobileWorkspaceTitle">الرئيسية</strong></header><div id="mobileWorkspaceBody" class="mobile-workspace-view-body"></div></div>';

    grid.append(rail,panel);
    return true;
  }

  function captureOriginalNodes(){
    rankingNode=document.getElementById('ranking');
    if(rankingNode?.parentNode&&!rankingAnchor){
      rankingAnchor=document.createComment('mobile-ranking-anchor');
      rankingNode.parentNode.insertBefore(rankingAnchor,rankingNode);
    }
    registerNode=document.getElementById('register');
    if(registerNode?.parentNode&&!registerAnchor){
      registerAnchor=document.createComment('mobile-register-anchor');
      registerNode.parentNode.insertBefore(registerAnchor,registerNode);
    }
  }

  function captureInvite(){
    const current=document.querySelector('.home-invite-wrap');
    if(!current)return null;
    inviteNode=current;
    if(inviteNode.parentNode&&!inviteAnchor){
      inviteAnchor=document.createComment('mobile-invite-anchor');
      inviteNode.parentNode.insertBefore(inviteAnchor,inviteNode);
    }
    return inviteNode;
  }

  function restoreMoved(){
    if(rankingNode&&rankingAnchor?.parentNode&&rankingNode.parentNode!==rankingAnchor.parentNode){
      rankingAnchor.parentNode.insertBefore(rankingNode,rankingAnchor.nextSibling);
    }
    if(inviteNode&&inviteAnchor?.parentNode&&inviteNode.parentNode!==inviteAnchor.parentNode){
      inviteAnchor.parentNode.insertBefore(inviteNode,inviteAnchor.nextSibling);
    }
    if(registerNode&&registerAnchor?.parentNode&&registerNode.parentNode!==registerAnchor.parentNode){
      registerAnchor.parentNode.insertBefore(registerNode,registerAnchor.nextSibling);
    }
  }

  function titleFor(id){
    return ({
      home:'الرئيسية',
      play:'العب الآن',
      computer:'اللعب مع الكمبيوتر',
      ranking:'ترتيب اللاعبين',
      invite:'دعوة لاعب',
      more:'المزيد',
      auth:'الحساب'
    })[id]||'شطرنج العرب';
  }

  function setActive(id){
    document.querySelectorAll('[data-mobile-workspace]').forEach(button=>{
      button.classList.toggle('active',button.dataset.mobileWorkspace===id);
    });
    if(modeLabel)modeLabel.textContent=titleFor(id);
    const title=document.getElementById('mobileWorkspaceTitle');
    if(title)title.textContent=titleFor(id);
  }

  function sourceText(id,fallback='0'){
    return document.getElementById(id)?.textContent?.trim()||fallback;
  }

  function renderHome(body){
    const signedIn=document.body.classList.contains('home-signed-in');
    const name=sourceText('headerMemberName',signedIn?'العضو':'زائر');
    body.innerHTML=`
      <div class="mobile-home-summary">
        <div class="mobile-home-stats">
          <div class="mobile-home-stat"><small>المشتركون</small><strong data-mobile-stat="players">${sourceText('headerPlayersCount')}</strong></div>
          <div class="mobile-home-stat"><small>المتواجدون</small><strong data-mobile-stat="online">${sourceText('headerOnlineCount')}</strong></div>
          <div class="mobile-home-stat"><small>المباريات الآن</small><strong data-mobile-stat="matches">${sourceText('headerMatchesCount')}</strong></div>
        </div>
        <div class="mobile-home-message"><strong>${signedIn?'مرحبًا، '+name:'مرحبًا بك في شطرنج العرب'}</strong><span>الرقعة تبقى ثابتة، واختر من الأيقونات ما تريد.</span></div>
      </div>`;
  }

  function renderPlay(body){
    const signedIn=document.body.classList.contains('home-signed-in');
    if(!signedIn){
      body.innerHTML='<div class="mobile-workspace-action-card"><h3>سجّل الدخول أولًا</h3><p>بعد تسجيل الدخول يمكنك البحث عن خصم واللعب مباشرة.</p><button type="button" class="mobile-workspace-primary" data-mobile-auth="login">تسجيل الدخول</button></div>';
      return;
    }
    body.innerHTML='<div class="mobile-workspace-action-card"><h3>مباراة جديدة</h3><p>ستبقى هذه الرقعة هي مركز الواجهة، وعند بدء المباراة تنتقل إلى وضع اللعب الكامل.</p><a class="mobile-workspace-primary" href="play-v2.html?auto=1">ابدأ البحث عن خصم</a></div>';
  }

  function renderComputer(body){
    const signedIn=document.body.classList.contains('home-signed-in');
    if(!signedIn){
      body.innerHTML='<div class="mobile-workspace-action-card"><h3>اللعب مع الكمبيوتر</h3><p>سجّل الدخول ثم اختر مستوى الكمبيوتر وابدأ المباراة.</p><button type="button" class="mobile-workspace-primary" data-mobile-auth="login">تسجيل الدخول</button></div>';
      return;
    }
    body.innerHTML='<div class="mobile-workspace-action-card"><h3>اللعب مع الكمبيوتر</h3><p>اختر الكمبيوتر من هنا، ثم يبدأ وضع اللعب مع بقاء نفس هوية الرقعة.</p><a class="mobile-workspace-primary" href="play-entry-v16.html?computer=1&v=20260918-sidewidth-freeze1">اختر المستوى وابدأ</a></div>';
  }

  function renderMore(body){
    const items=[
      ['البطولات','♜','tournaments.html'],
      ['شاهد','◉','watch.html'],
      ['الألغاز','◆','puzzles.html'],
      ['تعلّم','▤','learn.html'],
      ['التحليل','⌁','analysis.html'],
      ['الإحصائيات','▥','stats.html'],
      ['الأندية','♙','clubs.html'],
      ['الإعدادات','⚙','settings-v2.html'],
      ['حسابي','●','profile.html']
    ];
    const grid=document.createElement('div');
    grid.className='mobile-more-grid';
    items.forEach(([label,icon,href])=>{
      const link=document.createElement('a');
      link.className='mobile-more-link';
      link.href=href;
      link.innerHTML=`<span aria-hidden="true">${icon}</span><span>${label}</span>`;
      grid.appendChild(link);
    });
    body.appendChild(grid);
  }

  function renderRanking(body){
    rankingNode=document.getElementById('ranking')||rankingNode;
    if(rankingNode)body.appendChild(rankingNode);
    else body.innerHTML='<div class="mobile-workspace-action-card"><p>تعذر تحميل جدول الترتيب الآن.</p></div>';
  }

  async function renderInvite(body){
    if(!document.body.classList.contains('home-signed-in')){
      body.innerHTML='<div class="mobile-workspace-action-card"><h3>دعوة لاعب</h3><p>سجّل الدخول لإرسال دعوة مباشرة إلى لاعب آخر.</p><button type="button" class="mobile-workspace-primary" data-mobile-auth="login">تسجيل الدخول</button></div>';
      return;
    }
    for(let i=0;i<20&&!captureInvite();i+=1)await sleep(100);
    if(inviteNode){
      body.appendChild(inviteNode);
      requestAnimationFrame(()=>document.getElementById('homeInviteToggle')?.click());
    }else{
      body.innerHTML='<div class="mobile-workspace-action-card"><p>تعذر فتح الدعوات الآن.</p></div>';
    }
  }

  function renderAuth(body,tab='login'){
    registerNode=document.getElementById('register')||registerNode;
    if(!registerNode){
      body.innerHTML='<div class="mobile-workspace-action-card"><p>تعذر فتح التسجيل الآن.</p></div>';
      return;
    }
    body.appendChild(registerNode);
    requestAnimationFrame(()=>{
      if(tab==='signup') document.getElementById('signupTab')?.click();
      else document.getElementById('loginTab')?.click();
    });
  }

  async function showView(id='home',options={}){
    activeView=id;
    restoreMoved();
    const body=document.getElementById('mobileWorkspaceBody');
    if(!body)return;
    body.replaceChildren();
    setActive(id);

    if(id==='home')renderHome(body);
    else if(id==='play')renderPlay(body);
    else if(id==='computer')renderComputer(body);
    else if(id==='ranking')renderRanking(body);
    else if(id==='invite')await renderInvite(body);
    else if(id==='more')renderMore(body);
    else if(id==='auth')renderAuth(body,options.tab||'login');
    else renderHome(body);
  }

  function bindAuthHeader(){
    document.addEventListener('click',event=>{
      const login=event.target.closest('#navAccount');
      if(login&&!document.body.classList.contains('home-signed-in')){
        event.preventDefault();
        void showView('auth',{tab:'login'});
        return;
      }
      const signup=event.target.closest('#dashboardNav');
      if(signup&&!document.body.classList.contains('home-signed-in')){
        event.preventDefault();
        void showView('auth',{tab:'signup'});
        return;
      }
      const authAction=event.target.closest('[data-mobile-auth]');
      if(authAction){
        event.preventDefault();
        void showView('auth',{tab:authAction.dataset.mobileAuth||'login'});
      }
    },true);
  }

  function watchLiveData(){
    const refresh=()=>{
      if(activeView==='home'){
        document.querySelector('[data-mobile-stat="players"]')?.replaceChildren(document.createTextNode(sourceText('headerPlayersCount')));
        document.querySelector('[data-mobile-stat="online"]')?.replaceChildren(document.createTextNode(sourceText('headerOnlineCount')));
        document.querySelector('[data-mobile-stat="matches"]')?.replaceChildren(document.createTextNode(sourceText('headerMatchesCount')));
      }
    };
    const observer=new MutationObserver(refresh);
    ['headerPlayersCount','headerOnlineCount','headerMatchesCount'].forEach(id=>{
      const node=document.getElementById(id);
      if(node)observer.observe(node,{childList:true,characterData:true,subtree:true});
    });
    const classObserver=new MutationObserver(()=>{
      const signedIn=document.body.classList.contains('home-signed-in');
      if(signedIn&&activeView==='auth'){
        void showView('home');
        return;
      }
      if(activeView==='home'||activeView==='play'||activeView==='computer'||activeView==='invite') void showView(activeView);
    });
    classObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  }

  async function boot(){
    for(let i=0;i<40&&!document.querySelector('#homeBoardPreview');i+=1)await sleep(50);
    if(!document.querySelector('#homeBoardPreview'))return;
    document.body.classList.add('mobile-board-workspace');
    removeLegacyMobileLayers();
    const workspaceCss=document.querySelector('link[data-mobile-board-shell]');
    if(workspaceCss) document.head.appendChild(workspaceCss);
    setTimeout(()=>{
      removeLegacyMobileLayers();
      const css=document.querySelector('link[data-mobile-board-shell]');
      if(css) document.head.appendChild(css);
    },0);
    setTimeout(()=>{
      removeLegacyMobileLayers();
      const css=document.querySelector('link[data-mobile-board-shell]');
      if(css) document.head.appendChild(css);
    },250);
    captureOriginalNodes();
    buildBoard();
    buildWorkspace();
    bindAuthHeader();
    watchLiveData();
    await showView('home');
  }

  void boot();
}
