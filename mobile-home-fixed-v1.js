(()=>{
  const mq=window.matchMedia('(max-width:900px)');
  if(!mq.matches)return;

  const PIECES={
    a8:'br',b8:'bn',c8:'bb',d8:'bq',e8:'bk',f8:'bb',g8:'bn',h8:'br',
    a7:'bp',b7:'bp',c7:'bp',d7:'bp',e7:'bp',f7:'bp',g7:'bp',h7:'bp',
    a2:'wp',b2:'wp',c2:'wp',d2:'wp',e2:'wp',f2:'wp',g2:'wp',h2:'wp',
    a1:'wr',b1:'wn',c1:'wb',d1:'wq',e1:'wk',f1:'wb',g1:'wn',h1:'wr'
  };
  const tabs=[
    ['home','⌂','الرئيسية'],['play','⚔','العب'],['computer','▣','كمبيوتر'],
    ['ranking','▥','الترتيب'],['invite','＋','دعوة'],['more','☰','المزيد']
  ];
  let active='home';

  function txt(id,fallback='0'){return document.getElementById(id)?.textContent?.trim()||fallback}
  function signedIn(){return document.body.classList.contains('home-signed-in')}

  function boardHtml(){
    let out='';
    for(let rank=8;rank>=1;rank--){
      for(const file of ['a','b','c','d','e','f','g','h']){
        const name=file+rank;
        const dark=((file.charCodeAt(0)-97)+rank)%2===0;
        const piece=PIECES[name];
        out+='<span class="mfw-square '+(dark?'dark':'light')+'">'+(piece?'<img class="mfw-piece" src="assets/pieces/'+piece+'.png" alt="" draggable="false">':'')+'</span>';
      }
    }
    return out;
  }

  function ensureRoot(){
    if(document.getElementById('mobileFixedWorkspace'))return;
    document.documentElement.classList.add('mobile-fixed-workspace-active');
    const root=document.createElement('main');
    root.id='mobileFixedWorkspace';
    root.innerHTML=
      '<header class="mfw-header">'+
        '<div class="mfw-header-top"><div class="mfw-member"><span class="mfw-avatar">♟</span><span class="mfw-member-copy"><strong id="mfwName">شطرنج العرب</strong><small id="mfwState">المنصة العربية للشطرنج</small></span></div><div class="mfw-points"><small>النقاط</small><b id="mfwPoints">1500</b></div></div>'+
        '<nav class="mfw-tabs">'+tabs.map(([id,icon,label])=>'<button type="button" class="mfw-tab" data-mfw="'+id+'"><i>'+icon+'</i><span>'+label+'</span></button>').join('')+'</nav>'+
      '</header>'+
      '<section class="mfw-board" id="mfwBoard" aria-label="رقعة الشطرنج"><div class="mfw-board-grid">'+boardHtml()+'</div><span class="mfw-board-label" id="mfwBoardLabel">الرئيسية</span></section>'+
      '<section class="mfw-panel"><header class="mfw-panel-head" id="mfwPanelTitle">الرئيسية</header><div class="mfw-panel-body" id="mfwPanelBody"></div></section>';
    document.body.appendChild(root);
    root.querySelectorAll('[data-mfw]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.mfw)));
    root.querySelector('#mfwBoard').addEventListener('click',()=>show('play'));
    syncHeader();
    show('home');
  }

  function setActive(id,title){
    active=id;
    document.querySelectorAll('[data-mfw]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mfw===id));
    const t=document.getElementById('mfwPanelTitle');if(t)t.textContent=title;
    const b=document.getElementById('mfwBoardLabel');if(b)b.textContent=title;
  }

  function home(body){
    const name=signedIn()?txt('headerMemberName','العضو'):'زائر';
    body.innerHTML='<div class="mfw-stats"><div class="mfw-stat"><small>المشتركون</small><b>'+txt('headerPlayersCount')+'</b></div><div class="mfw-stat"><small>المتواجدون</small><b>'+txt('headerOnlineCount')+'</b></div><div class="mfw-stat"><small>المباريات الآن</small><b>'+txt('headerMatchesCount')+'</b></div></div><div class="mfw-welcome"><strong>مرحبًا، '+name+'</strong><small>الرقعة ثابتة، والمحتوى حولها يتغير حسب اختيارك.</small></div>';
  }

  function action(body,title,text,href,label){
    body.innerHTML='<div class="mfw-action"><h3>'+title+'</h3><p>'+text+'</p><a class="mfw-primary" href="'+href+'">'+label+'</a></div>';
  }

  function ranking(body){
    const rows=[...document.querySelectorAll('#tbody tr')].slice(0,10);
    if(!rows.length){body.innerHTML='<div class="mfw-action"><p>جاري تحميل ترتيب اللاعبين…</p></div>';return}
    const wrap=document.createElement('div');wrap.className='mfw-ranking';
    rows.forEach((row,index)=>{
      const cells=[...row.querySelectorAll('td')];
      const item=document.createElement('div');item.className='mfw-rank-row';
      const number=(cells[0]?.textContent||String(index+1)).trim();
      const player=(cells[1]?.textContent||'لاعب').trim();
      const points=(cells[cells.length-1]?.textContent||'').trim();
      item.innerHTML='<b>'+number+'</b><strong>'+player+'</strong><small>'+points+' نقطة</small>';
      wrap.appendChild(item);
    });
    body.appendChild(wrap);
  }

  function invite(body){
    if(!signedIn()){
      action(body,'دعوة لاعب','سجّل الدخول أولًا لإرسال دعوة مباشرة.','#register','تسجيل الدخول');
      body.querySelector('a')?.addEventListener('click',e=>{e.preventDefault();document.getElementById('navAccount')?.click()});
      return;
    }
    body.innerHTML='<div class="mfw-action"><h3>دعوة لاعب</h3><p>ابحث عن لاعب من داخل الموقع وأرسل له دعوة مباشرة.</p><button class="mfw-primary" id="mfwInviteButton" type="button">فتح البحث عن لاعب</button></div>';
    body.querySelector('#mfwInviteButton')?.addEventListener('click',()=>document.getElementById('homeInviteToggle')?.click());
  }

  function more(body){
    const items=[['♜','البطولات','tournaments.html'],['◉','شاهد','watch.html'],['◆','الألغاز','puzzles.html'],['▤','تعلّم','learn.html'],['⌁','التحليل','analysis.html'],['▥','الإحصائيات','stats.html'],['♙','الأندية','clubs.html'],['⚙','الإعدادات','settings-v2.html'],['●','حسابي','profile.html']];
    body.innerHTML='<div class="mfw-more">'+items.map(([i,l,h])=>'<a href="'+h+'"><i>'+i+'</i><span>'+l+'</span></a>').join('')+'</div>';
  }

  function show(id){
    const body=document.getElementById('mfwPanelBody');if(!body)return;
    body.replaceChildren();
    const titles={home:'الرئيسية',play:'العب الآن',computer:'اللعب مع الكمبيوتر',ranking:'الترتيب',invite:'دعوة لاعب',more:'المزيد'};
    setActive(id,titles[id]||'شطرنج العرب');
    if(id==='home')home(body);
    else if(id==='play')action(body,'مباراة جديدة','ابدأ البحث عن خصم من نفس واجهة شطرنج العرب.','play-v2.html?auto=1','ابدأ اللعب');
    else if(id==='computer')action(body,'اللعب مع الكمبيوتر','اختر المستوى والزمن ثم ابدأ.','play-entry-v16.html?computer=1&v=20260918-sidewidth-freeze1','اختيار المستوى');
    else if(id==='ranking')ranking(body);
    else if(id==='invite')invite(body);
    else more(body);
  }

  function syncHeader(){
    const n=document.getElementById('mfwName'),p=document.getElementById('mfwPoints'),s=document.getElementById('mfwState');
    if(n)n.textContent=signedIn()?txt('headerMemberName','العضو'):'شطرنج العرب';
    if(p)p.textContent=signedIn()?txt('headerMemberRating','1500'):'—';
    if(s)s.textContent=signedIn()?'متصل الآن':'المنصة العربية للشطرنج';
    if(active==='home')show('home');
  }

  function boot(){
    ensureRoot();

    const refreshHome=()=>{
      syncHeader();
      if(active==='ranking')show('ranking');
    };

    ['headerMemberName','headerMemberRating','headerPlayersCount','headerOnlineCount','headerMatchesCount'].forEach(id=>{
      const node=document.getElementById(id);
      if(!node)return;
      new MutationObserver(refreshHome).observe(node,{subtree:true,childList:true,characterData:true});
    });

    new MutationObserver(refreshHome).observe(document.body,{attributes:true,attributeFilter:['class']});

    const tbody=document.getElementById('tbody');
    if(tbody){
      new MutationObserver(()=>{if(active==='ranking')show('ranking')}).observe(tbody,{subtree:true,childList:true,characterData:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();