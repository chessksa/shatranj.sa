if(!document.querySelector('link[data-desktop-board-shell]')){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.dataset.desktopBoardShell='1';
  const url=new URL('./desktop-board-shell.css',import.meta.url);
  url.searchParams.set('v','20260917-fixed-board2');
  css.href=url.href;
  document.head.appendChild(css);
}

const desktop=window.matchMedia('(min-width:901px)');
if(desktop.matches && document.querySelector('#homeHero')){
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function buildBoard(){
    const preview=document.getElementById('homeBoardPreview');
    if(!preview)return;
    preview.classList.add('desktop-board-preview');
    preview.setAttribute('aria-label','فتح اللعب');
    preview.replaceChildren();
    const grid=document.createElement('span');grid.className='desktop-board-grid';
    Array.from({length:64},(_,i)=>{
      const row=Math.floor(i/8),col=i%8;
      const sq=document.createElement('span');
      sq.className=`desktop-board-square ${(row+col)%2?'dark':'light'}`;
      grid.appendChild(sq);
    });
    const hint=document.createElement('span');hint.className='desktop-board-hint';hint.textContent='اضغط على الرقعة للعب';
    preview.append(grid,hint);
    const stage=document.createElement('div');stage.className='desktop-board-stage';
    preview.parentNode.insertBefore(stage,preview);stage.appendChild(preview);
  }

  function buildSidebarAccount(){
    const sidebar=document.querySelector('.v2-global-sidebar');
    const nav=sidebar?.querySelector('.v2-global-nav');
    const user=document.querySelector('.home-header .nav-user');
    if(!sidebar||!nav||!user)return;
    const box=document.createElement('div');box.className='desktop-sidebar-account';
    box.appendChild(user);sidebar.insertBefore(box,nav);
  }

  function panelButton(id,label,icon){
    const a=document.createElement('a');a.href=`#workspace-${id}`;a.className='v2-global-link';a.dataset.workspacePanel=id;
    a.innerHTML=`<span class="v2-global-icon">${icon}</span><span>${label}</span>`;
    return a;
  }

  function makePanel(){
    const panel=document.createElement('aside');panel.className='desktop-workspace-panel';panel.id='desktopWorkspacePanel';panel.hidden=false;
    panel.innerHTML='<div class="desktop-workspace-panel-head"><strong id="desktopWorkspaceTitle">الرئيسية</strong><button class="desktop-workspace-panel-close" type="button" aria-label="إغلاق">×</button></div><div class="desktop-workspace-panel-body" id="desktopWorkspaceBody"></div>';
    document.body.appendChild(panel);
    panel.querySelector('.desktop-workspace-panel-close').addEventListener('click',()=>panel.classList.remove('open'));
    return panel;
  }

  function card(title,text){const d=document.createElement('div');d.className='desktop-panel-card';d.innerHTML=`<h3>${title}</h3><p>${text}</p>`;return d}
  function actions(...items){const d=document.createElement('div');d.className='desktop-panel-actions';items.forEach(item=>d.append(item));return d}
  function link(label,href,primary=false){const a=document.createElement('a');a.href=href;a.textContent=label;if(primary)a.classList.add('primary');return a}

  function openPanel(id){
    const panel=document.getElementById('desktopWorkspacePanel'),body=document.getElementById('desktopWorkspaceBody'),title=document.getElementById('desktopWorkspaceTitle');
    if(!panel||!body||!title)return;
    body.replaceChildren();
    if(id==='ranking'){
      title.textContent='الترتيب';
      const ranking=document.getElementById('ranking');if(ranking)body.appendChild(ranking);else body.appendChild(card('الترتيب','تعذر تحميل جدول الترتيب الآن.'));
    }else if(id==='invite'){
      title.textContent='دعوة لاعب';
      const invite=document.querySelector('.home-invite-wrap');
      if(invite){body.appendChild(invite);document.getElementById('homeInviteToggle')?.click();}
      else body.append(card('دعوة لاعب','ابحث عن لاعب من داخل الموقع وأرسل له دعوة مباشرة دون أن تتغير مساحة الرقعة.'));
    }else if(id==='tournaments'){
      title.textContent='البطولات';
      const text=document.getElementById('tournamentResultsTickerTrack')?.innerText?.trim()||'اطلع على البطولات المفتوحة والجارية.';
      body.append(card('آخر البطولات',text),actions(link('فتح صفحة البطولات','tournaments.html',true)));
    }else{
      title.textContent='الرئيسية';
      const players=document.getElementById('headerPlayersCount')?.textContent||'0';
      const online=document.getElementById('headerOnlineCount')?.textContent||'0';
      const games=document.getElementById('headerMatchesCount')?.textContent||'0';
      body.append(card('شطرنج العرب',`المشتركون: ${players} · المتواجدون: ${online} · المباريات الآن: ${games}`),actions(link('العب الآن','play-v2.html?auto=1',true),link('ضد الكمبيوتر','play-v10.html?computer=1')));
    }
    panel.classList.add('open');
  }

  async function boot(){
    for(let i=0;i<30&&!document.querySelector('.v2-global-sidebar');i++)await sleep(50);
    document.body.classList.add('desktop-board-workspace');
    buildBoard();buildSidebarAccount();makePanel();
    const nav=document.querySelector('.v2-global-nav');
    if(nav){
      const home=nav.querySelector('a[href="index.html"]');
      const ranking=panelButton('ranking','الترتيب','▥');
      const invite=panelButton('invite','دعوة لاعب','＋');
      if(home){home.after(ranking,invite);home.dataset.workspacePanel='home'}else nav.prepend(invite,ranking);
      const tournaments=[...nav.querySelectorAll('a')].find(a=>/tournaments\.html/.test(a.getAttribute('href')||''));if(tournaments)tournaments.dataset.workspacePanel='tournaments';
      nav.addEventListener('click',event=>{const a=event.target.closest('[data-workspace-panel]');if(!a)return;event.preventDefault();openPanel(a.dataset.workspacePanel)});
    }
  }
  void boot();
}
