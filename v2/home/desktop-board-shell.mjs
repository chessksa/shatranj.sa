import { mountInlineComputer, stopInlineComputer } from './inline-computer.mjs?v=20260918-start-inline-fix1';
if(!document.querySelector('link[data-desktop-board-shell]')){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.dataset.desktopBoardShell='1';
  const url=new URL('./desktop-board-shell.css',import.meta.url);
  url.searchParams.set('v','20260918-computer-head2');
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
    item.innerHTML=`<span class="desktop-home-nav-label">${label}</span><span class="v2-global-icon">${icon}</span>`;
    return item;
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
      <a class="desktop-member-profile" href="profile.html" aria-label="الملف الشخصي">
        <span class="desktop-member-avatar-wrap">
          <img id="desktopMemberAvatar" class="desktop-member-avatar" alt="" hidden>
          <span id="desktopMemberFallback" class="desktop-member-fallback">♟</span>
          <i class="desktop-member-online-dot"></i>
        </span>
        <strong id="desktopMemberName" class="desktop-member-name">العضو</strong>
      </a>
      <div class="desktop-member-points"><span>النقاط</span><b id="desktopMemberRating">1500</b></div>
      <div class="desktop-member-country" id="desktopMemberCountryWrap" title="الدولة">
        <span id="desktopMemberCountryFlag" class="desktop-member-country-flag">🌐</span>
      </div>
      <nav class="desktop-member-play-icons" aria-label="أيقونات اللعب">
        <a href="play-v2.html?auto=1" title="العب الآن" aria-label="العب الآن">⚔</a>
        <button type="button" data-desktop-member-action="computer" title="الكمبيوتر" aria-label="الكمبيوتر">▣</button>
        <button type="button" data-desktop-member-action="invite" title="دعوة لاعب" aria-label="دعوة لاعب">＋</button>
        <a href="tournaments.html" title="البطولات" aria-label="البطولات">♜</a>
      </nav>`;
    sidebar.insertBefore(member,nav);

    nav.replaceChildren(
      navItem({id:'home',label:'الرئيسية',icon:'⌂',href:'#home'}),
      navItem({id:'ranking',label:'الترتيب',icon:'▥',href:'#ranking'}),
      navItem({id:'invite',label:'دعوة لاعب',icon:'＋',href:'#invite'}),
      navItem({id:'play',label:'العب',icon:'⚔',href:'play-v2.html?auto=1'}),
      navItem({id:'computer',label:'الكمبيوتر',icon:'▣',href:'#computer'}),
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

  function computerView(body){
    mountInlineComputer(body);
  }

  function showDashboard(id='home'){
    if(id!=='computer') stopInlineComputer();
    const home=document.getElementById('desktopDashboardHome');
    const view=document.getElementById('desktopDashboardView');
    const body=document.getElementById('desktopDashboardViewBody');
    if(!home||!view||!body)return;

    view.classList.toggle('computer-view',id==='computer');
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
    if(id==='computer'){
      showViewTitle('اللعب مع الكمبيوتر');
      computerView(body);
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
    copyText('headerMemberName','desktopMemberName','العضو');
    copyText('headerMemberRating','desktopMemberRating','1500');

    const signedIn=document.body.classList.contains('home-signed-in');
    const member=document.querySelector('.desktop-member-card');
    member?.classList.toggle('is-guest',!signedIn);

    const countryRaw=document.getElementById('accountRegion')?.textContent?.trim()||'';
    const country=signedIn&&countryRaw&&countryRaw!=='—'?countryRaw:'';
    const flag=document.getElementById('desktopMemberCountryFlag');
    const countryWrap=document.getElementById('desktopMemberCountryWrap');
    if(flag)flag.textContent=countryFlag(country);
    if(countryWrap)countryWrap.title=country||'الدولة';

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
  }

  function bindDesktopActions(){
    document.addEventListener('click',event=>{
      const nav=event.target.closest('[data-desktop-nav]');
      if(nav&&['home','ranking','invite','computer'].includes(nav.dataset.desktopNav)){
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
      const heroComputer=event.target.closest('.hero-computer-btn');
      if(heroComputer){
        event.preventDefault();
        showDashboard('computer');
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

    const initialView=location.hash==='#computer'?'computer':'home';
    showDashboard(initialView);

    window.addEventListener('hashchange',()=>{
      if(location.hash==='#computer'){
        showDashboard('computer');
      }else if(location.hash===''||location.hash==='#home'){
        showDashboard('home');
      }
    });
  }

  void boot();
}
