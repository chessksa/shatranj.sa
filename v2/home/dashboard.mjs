import { rpc, supabase } from '../platform/api.mjs';

if(!document.querySelector('link[data-desktop-guest-auth]')){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.dataset.desktopGuestAuth='1';
  const url=new URL('./desktop-guest-auth.css',import.meta.url);
  url.searchParams.set('v','20260929-desktop-auth-theme1');
  css.href=url.href;
  document.head.appendChild(css);
}

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

function node(tag,className,text){
  const element=document.createElement(tag);
  if(className) element.className=className;
  if(text!=null) element.textContent=String(text);
  return element;
}

const SAUDI_TICKER_REGIONS=new Set([
  'الرياض','مكة المكرمة','المدينة المنورة','القصيم','الشرقية','عسير','تبوك',
  'حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف'
]);

function tickerCountry(value){
  const region=String(value||'').trim();
  return SAUDI_TICKER_REGIONS.has(region)?'السعودية':region;
}

function closeHomeAuth(){
  if(document.body.classList.contains('desktop-auth-open')){
    document.body.classList.remove('desktop-auth-open');
  }
}

function ensureDesktopAuthClose(target){
  if(!target) return null;
  let close=target.querySelector('.desktop-auth-close');
  if(close) return close;
  const card=target.querySelector('.form-card');
  if(!card) return null;
  close=node('button','desktop-auth-close','×');
  close.type='button';
  close.setAttribute('aria-label','إغلاق');
  close.addEventListener('click',closeHomeAuth);
  card.prepend(close);
  return close;
}

function openHomeAuthTab(tab){
  const target=document.getElementById('register');
  if(!target) return;
  ensureDesktopAuthClose(target);
  document.body.classList.add('desktop-auth-open');
  if(tab==='signup') document.getElementById('signupTab')?.click();
  else document.getElementById('loginTab')?.click();
  requestAnimationFrame(()=>{
    const focusTarget=tab==='signup'
      ? document.getElementById('signupName')
      : document.getElementById('loginEmail');
    focusTarget?.focus();
  });
}

function mountDesktopGuestAuth(host){
  const sidebar=document.querySelector('.v2-global-sidebar');
  const nav=sidebar?.querySelector('.v2-global-nav');
  if(!host||!sidebar||!nav) return false;
  if(host.parentNode!==sidebar||host.nextSibling!==nav) sidebar.insertBefore(host,nav);
  return true;
}

function ensureDesktopGuestAuth(){
  if(!window.matchMedia('(min-width:901px)').matches) return null;
  let host=document.getElementById('desktopGuestAuth');
  if(host){
    mountDesktopGuestAuth(host);
    return host;
  }

  host=node('div','desktop-guest-auth');
  host.id='desktopGuestAuth';
  host.setAttribute('aria-label','الدخول والتسجيل');

  const login=node('button','desktop-guest-auth-btn','تسجيل الدخول');
  login.id='desktopGuestLogin';
  login.type='button';

  const signup=node('button','desktop-guest-auth-btn desktop-guest-auth-signup','تسجيل');
  signup.id='desktopGuestSignup';
  signup.type='button';

  login.addEventListener('click',()=>openHomeAuthTab('login'));
  signup.addEventListener('click',()=>openHomeAuthTab('signup'));

  host.append(login,signup);
  document.body.appendChild(host);
  mountDesktopGuestAuth(host);
  return host;
}

function syncHomeAuthActions(){
  const dashboard=document.getElementById('dashboardNav');
  const account=document.getElementById('navAccount');
  const signedIn=document.body.classList.contains('home-signed-in');
  const desktopGuestAuth=ensureDesktopGuestAuth();
  const desktopGuestMounted=desktopGuestAuth?mountDesktopGuestAuth(desktopGuestAuth):false;

  if(signedIn) closeHomeAuth();
  if(desktopGuestAuth) desktopGuestAuth.hidden=signedIn||!desktopGuestMounted;

  if(dashboard){
    dashboard.hidden=false;
    dashboard.href=signedIn?'profile.html':'#register';
    dashboard.innerHTML=signedIn
      ? '<span class="header-tile-icon" aria-hidden="true">⚙</span><span>لوحة التحكم</span>'
      : '<span class="header-tile-icon" aria-hidden="true">＋</span><span>تسجيل</span>';
  }

  if(account&&!signedIn){
    account.hidden=false;
    account.href='#register';
    account.textContent='تسجيل الدخول';
  }
}

function setDesktopAuthMsg(text,type=''){
  const msg=document.getElementById('authMsg');
  if(!msg)return;
  msg.textContent=text;
  msg.className=`msg ${type}`.trim();
}

function installDesktopDirectLogin(){
  if(!window.matchMedia('(min-width:901px)').matches)return;

  document.addEventListener('submit',async event=>{
    if(event.target?.id!=='loginForm')return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const username=document.getElementById('loginUsername')?.value.trim().toLowerCase()||'';
    const password=document.getElementById('loginPassword')?.value||'';
    const button=document.getElementById('loginBtn');

    if(!/^[a-z0-9_]{3,20}$/.test(username)){
      setDesktopAuthMsg('أدخل اسم مستخدم صحيحًا.','err');
      return;
    }
    if(password.length<8){
      setDesktopAuthMsg('أدخل كلمة المرور.','err');
      return;
    }

    const cfg=window.SHATRANJ_CONFIG?.supabase||{};
    if(!cfg.url||!cfg.anonKey||!supabase){
      setDesktopAuthMsg('خدمة تسجيل الدخول غير متاحة الآن.','err');
      return;
    }

    if(button){
      button.disabled=true;
      button.textContent='جاري الدخول...';
    }
    setDesktopAuthMsg('');

    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);

    try{
      const response=await fetch(`${cfg.url}/functions/v1/username-login`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          apikey:cfg.anonKey,
          Authorization:`Bearer ${cfg.anonKey}`
        },
        body:JSON.stringify({username,password}),
        signal:controller.signal
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data?.access_token||!data?.refresh_token){
        throw new Error('invalid_login');
      }

      const {data:sessionData,error}=await supabase.auth.setSession({
        access_token:data.access_token,
        refresh_token:data.refresh_token
      });
      if(error||!sessionData?.session)throw error||new Error('invalid_session');

      location.reload();
    }catch(error){
      console.error('desktop login failed',error);
      setDesktopAuthMsg(
        error?.name==='AbortError'
          ? 'تأخر تسجيل الدخول. أعد المحاولة.'
          : 'اسم المستخدم أو كلمة المرور غير صحيحة.',
        'err'
      );
    }finally{
      clearTimeout(timeout);
      if(button){
        button.disabled=false;
        button.textContent='تسجيل الدخول';
      }
    }
  },true);
}

function installHomeAuthActions(){
  syncHomeAuthActions();
  installDesktopDirectLogin();

  const dashboard=document.getElementById('dashboardNav');
  const account=document.getElementById('navAccount');

  dashboard?.addEventListener('click',event=>{
    if(document.body.classList.contains('home-signed-in')) return;
    event.preventDefault();
    openHomeAuthTab('signup');
  });

  account?.addEventListener('click',event=>{
    if(document.body.classList.contains('home-signed-in')) return;
    event.preventDefault();
    openHomeAuthTab('login');
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&document.body.classList.contains('desktop-auth-open')) closeHomeAuth();
  });

  new MutationObserver(syncHomeAuthActions).observe(document.body,{
    attributes:true,
    attributeFilter:['class'],
    childList:true
  });
}

async function loadOptionalHomeModules(){
  const results=await Promise.allSettled([
    import('./public-home.mjs?v=20260912-home-polish1'),
    import('./desktop-board-shell.mjs?v=20261007-sidebar-force4'),
    import('./desktop-board-shell-tune.mjs?v=20261007-sidebar-bg3')
  ]);
  results.forEach((result,index)=>{
    if(result.status==='rejected') console.warn('تعذر تحميل وحدة واجهة اختيارية',index,result.reason);
  });
}

function renderWelcomeSubscribers(rows,totalCount=null){
  const players=Array.isArray(rows)?rows:[];
  const headerPlayers=document.getElementById('headerPlayersCount');
  if(headerPlayers){
    const count=Number.isFinite(Number(totalCount))?Number(totalCount):players.length;
    headerPlayers.textContent=String(count);
  }

  const track=document.getElementById('welcomeTickerTrack');
  if(!track) return;

  const members=[...players]
    .filter(player=>player&&player.created_at)
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    .slice(0,10);

  if(!members.length){
    track.className='welcome-ticker-track welcome-ticker-single';
    track.replaceChildren(node('span','welcome-ticker-loading','مرحبًا بأول أعضاء شطرنج العرب'));
    return;
  }

  const makeGroup=()=>{
    const group=node('span','welcome-ticker-group');
    members.forEach(player=>{
      const country=tickerCountry(player.region)||'شطرنج العرب';
      const place=player.city?`${country} · ${player.city}`:country;
      group.append(
        node('span','welcome-ticker-item',`${player.name||'عضو جديد'} — ${place}`),
        node('span','welcome-ticker-separator','')
      );
    });
    return group;
  };

  const group=makeGroup();
  track.className='welcome-ticker-track';
  track.replaceChildren(group,group.cloneNode(true));
}

function scheduleWelcomeSubscribers(rows,totalCount=null){
  queueMicrotask(()=>renderWelcomeSubscribers(rows,totalCount));
}

window.addEventListener('home-players-loaded',event=>{
  scheduleWelcomeSubscribers(event.detail);
});

if(Array.isArray(window.__HOME_PLAYERS__)){
  scheduleWelcomeSubscribers(window.__HOME_PLAYERS__);
}

async function loadWelcomeSubscribers(){
  try{
    const snapshot=await rpc('get_public_home_snapshot');
    const data=Array.isArray(snapshot)?snapshot[0]||{}:snapshot||{};
    renderWelcomeSubscribers(data.latest_members||[],data.registered_count);
  }catch(error){
    console.warn('تعذر تحميل آخر المسجلين',error);
  }
}

function ensureTournamentTicker(){
  let ticker=document.getElementById('tournamentResultsTicker');
  if(ticker) return ticker;

  const welcome=document.getElementById('welcomeTicker');
  if(!welcome) return null;

  ticker=node('div','welcome-ticker');
  ticker.id='tournamentResultsTicker';
  ticker.setAttribute('role','region');
  ticker.setAttribute('aria-label','البطولات');

  const label=node('span','welcome-ticker-label','البطولات');
  const viewport=node('div','welcome-ticker-viewport');
  const track=node('div','welcome-ticker-track welcome-ticker-single');
  track.id='tournamentResultsTickerTrack';
  track.append(node('span','welcome-ticker-loading','جاري تحميل البطولات'));
  viewport.append(track);
  ticker.append(label,viewport);
  welcome.insertAdjacentElement('afterend',ticker);
  return ticker;
}

function tournamentStatus(status){
  if(status==='running') return 'جارية الآن';
  if(status==='open') return 'التسجيل مفتوح';
  if(status==='finished') return 'انتهت';
  return 'بطولة';
}

function renderTournamentTicker(rows){
  ensureTournamentTicker();
  const track=document.getElementById('tournamentResultsTickerTrack');
  if(!track) return;

  const tournaments=Array.isArray(rows)?rows:[];
  if(!tournaments.length){
    track.className='welcome-ticker-track welcome-ticker-single';
    track.replaceChildren(node('span','welcome-ticker-loading','لا توجد بطولات معلنة حاليًا'));
    return;
  }

  const makeGroup=()=>{
    const group=node('span','welcome-ticker-group');
    tournaments.forEach(tournament=>{
      const status=tournamentStatus(tournament.status);
      const time=tournament.time_control?` · ${tournament.time_control}`:'';
      group.append(
        node('span','welcome-ticker-item',`${tournament.name||'بطولة'} — ${status}${time}`),
        node('span','welcome-ticker-separator','')
      );
    });
    return group;
  };

  const group=makeGroup();
  track.className='welcome-ticker-track';
  track.replaceChildren(group,group.cloneNode(true));
}

async function loadTournamentTicker(){
  ensureTournamentTicker();
  try{
    const {data,error}=await supabase
      .from('tournaments')
      .select('id,name,status,time_control,starts_at,finished_at,created_at')
      .in('status',['running','open','finished'])
      .order('created_at',{ascending:false})
      .limit(10);
    if(error) throw error;
    renderTournamentTicker(data||[]);
  }catch(error){
    console.warn('تعذر تحميل شريط البطولات',error);
    renderTournamentTicker([]);
  }
}

async function boot(){
  installHomeAuthActions();
  void loadOptionalHomeModules();
  for(let i=0;i<20&&!document.querySelector('#homeHero .home-hero-copy');i++) await sleep(100);
  document.getElementById('v5-home-dashboard')?.remove();
  document.body.classList.remove('v5-home-dashboard-active');
  syncHomeAuthActions();
  await Promise.all([loadWelcomeSubscribers(),loadTournamentTicker()]);
  setInterval(()=>void loadWelcomeSubscribers(),60000);
  setInterval(()=>void loadTournamentTicker(),60000);
}

void boot();