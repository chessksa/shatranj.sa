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

  // Reuse the existing Supabase-powered login/signup forms and event handlers.
  // Move (never clone) the live form into a mobile dialog, then restore it on close.
  const authReturn={parent:null,next:null};
  function openAuth(tab='login'){
    if(signedIn())return;
    const form=document.getElementById('guestAuth');
    const host=document.getElementById('mfwAuthHost');
    const overlay=document.getElementById('mfwAuthOverlay');
    if(!form || !host || !overlay)return;
    if(form.parentElement!==host){
      authReturn.parent=form.parentElement;
      authReturn.next=form.nextSibling;
      host.appendChild(form);
    }
    form.hidden=false;
    document.getElementById('mfwAuthTitle').textContent=tab==='signup'?'إنشاء حساب':'تسجيل الدخول';
    document.getElementById(tab==='signup'?'signupTab':'loginTab')?.click();
    // Preserve the site's real Supabase authentication workflow, but explicitly select one form.
    document.getElementById('signupForm').hidden=tab!=='signup';
    document.getElementById('loginForm').hidden=tab!=='login';
    document.getElementById('recoveryForm').hidden=true;
    overlay.hidden=false;
    document.body.classList.add('mfw-auth-open');
    document.getElementById('mfwAuthClose')?.focus();
  }
  function closeAuth(returnFocus=true){
    const overlay=document.getElementById('mfwAuthOverlay');
    if(!overlay || overlay.hidden)return;
    overlay.hidden=true;
    document.body.classList.remove('mfw-auth-open');
    const form=document.getElementById('guestAuth');
    if(form && authReturn.parent && form.parentElement!==authReturn.parent){
      if(authReturn.next?.parentNode===authReturn.parent){
        authReturn.parent.insertBefore(form,authReturn.next);
      }else authReturn.parent.appendChild(form);
    }
    if(returnFocus && !signedIn())document.getElementById('mfwLoginButton')?.focus();
  }
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && !document.getElementById('mfwAuthOverlay')?.hidden)closeAuth();
  });
  document.addEventListener('click',event=>{
    if(event.target?.id==='loginTab'||event.target?.id==='signupTab'){
      const title=document.getElementById('mfwAuthTitle');
      if(title && !document.getElementById('mfwAuthOverlay')?.hidden)
        title.textContent=event.target.id==='loginTab'?'تسجيل الدخول':'إنشاء حساب';
    }
  });

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
        '<div class="mfw-member"><span class="mfw-avatar">♟</span><span class="mfw-member-copy"><strong id="mfwName">شطرنج العرب</strong><small id="mfwState">المنصة العربية للشطرنج</small></span></div>'+
        '<button type="button" class="mfw-login-btn" id="mfwLoginButton" aria-haspopup="dialog">تسجيل الدخول</button>'+
        '<div class="mfw-points"><small>النقاط</small><b id="mfwPoints">1500</b></div>'+
      '</header>'+
      '<section class="mfw-board" id="mfwBoard" aria-label="رقعة الشطرنج"><div class="mfw-board-grid">'+boardHtml()+'</div></section>'+
      '<nav class="mfw-tabs">'+tabs.map(([id,icon,label])=>'<button type="button" class="mfw-tab" data-mfw="'+id+'"><i>'+icon+'</i><span>'+label+'</span></button>').join('')+'</nav>'+
      '<section class="mfw-panel"><div class="mfw-panel-body" id="mfwPanelBody"></div></section>';
    document.body.appendChild(root);
    // The dialog must live outside the board's four-row grid to prevent mobile layout overflow.
    let overlay=document.getElementById('mfwAuthOverlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='mfwAuthOverlay';
      overlay.className='mfw-auth-overlay';
      overlay.hidden=true;
      overlay.innerHTML=
        '<section class="mfw-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="mfwAuthTitle">'+
          '<div class="mfw-auth-head"><h2 id="mfwAuthTitle">تسجيل الدخول</h2><button type="button" id="mfwAuthClose" aria-label="إغلاق نافذة الدخول">×</button></div>'+
          '<div class="mfw-auth-host" id="mfwAuthHost"></div>'+
        '</section>';
      document.body.appendChild(overlay);
    }
    root.querySelectorAll('[data-mfw]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.mfw)));
    root.querySelector('#mfwBoard').addEventListener('click',()=>show('play'));
    root.querySelector('#mfwLoginButton').addEventListener('click',()=>openAuth('login'));
    overlay.querySelector('#mfwAuthClose').addEventListener('click',()=>closeAuth());
    overlay.addEventListener('click',event=>{
      if(event.target===event.currentTarget) closeAuth();
    });
    syncHeader();
    show('home');
  }

  function setActive(id,title){
    active=id;
    document.querySelectorAll('[data-mfw]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mfw===id));
  }

  function home(body){
    body.innerHTML='<div class="mfw-stats"><div class="mfw-stat"><small>المشتركون</small><b>'+txt('headerPlayersCount')+'</b></div><div class="mfw-stat"><small>المتواجدون</small><b>'+txt('headerOnlineCount')+'</b></div><div class="mfw-stat"><small>المباريات الآن</small><b>'+txt('headerMatchesCount')+'</b></div></div>';
  }

  function action(body,title,text,href,label){
    body.innerHTML='<div class="mfw-action"><h3>'+title+'</h3><p>'+text+'</p><a class="mfw-primary" href="'+href+'">'+label+'</a></div>';
  }

  // Four compact, fully visible play choices for the mobile home panel.
  function play(body){
    body.innerHTML='<div class="mfw-play-grid" aria-label="خيارات اللعب">'+
      '<a class="mfw-play-tile mfw-play-tile-primary" href="play-v2.html?auto=1" aria-label="بدء لعب مباشر ضد خصم">'+
        '<i aria-hidden="true">⚔</i><span>لعب مباشر</span><small>ابحث عن خصم</small></a>'+
      '<button class="mfw-play-tile" id="mfwInviteTile" type="button" aria-label="دعوة لاعب">'+
        '<i aria-hidden="true">＋</i><span>دعوة لاعب</span><small>أرسل دعوة</small></button>'+
      '<a class="mfw-play-tile" href="play-entry-v16.html?computer=1" aria-label="اللعب مع الكمبيوتر">'+
        '<i aria-hidden="true">▣</i><span>الكمبيوتر</span><small>اختر المستوى</small></a>'+
      '<a class="mfw-play-tile" href="watch.html" aria-label="مشاهدة المباريات الجارية">'+
        '<i aria-hidden="true">◉</i><span>شاهد</span><small>المباريات الآن</small></a>'+
    '</div>';
    body.querySelector('#mfwInviteTile')?.addEventListener('click',()=>{
      if(!signedIn()){show('invite');return;}
      const toggle=document.getElementById('homeInviteToggle');
      if(toggle)toggle.click();
      else show('invite');
    });
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
      body.querySelector('a')?.addEventListener('click',event=>{event.preventDefault();openAuth('login')});
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
    else if(id==='play')play(body);
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
    const loginButton=document.getElementById('mfwLoginButton');
    const points=document.querySelector('#mobileFixedWorkspace .mfw-points');
    if(loginButton)loginButton.hidden=signedIn();
    if(points)points.hidden=!signedIn();
    if(signedIn() && !document.getElementById('mfwAuthOverlay')?.hidden)closeAuth(false);
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