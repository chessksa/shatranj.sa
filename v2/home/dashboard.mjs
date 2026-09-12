import { getSessionPlayer, rpc, supabase } from '../platform/api.mjs';
import './public-home.mjs?v=20260912-home-polish1';

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
let renderToken=0;

function node(tag,className,text){
  const element=document.createElement(tag);
  if(className) element.className=className;
  if(text!=null) element.textContent=String(text);
  return element;
}

function linkCard({href,label,value,className=''}={}){
  const a=node('a',className);
  a.href=href||'#';
  a.append(node('small','',label||''),node('b','',value??'—'));
  return a;
}

function resultLabel(game){
  if(!game?.result) return '—';
  if(game.result==='1/2-1/2') return 'تعادل';
  const won=(game.my_color==='w'&&game.result==='1-0')||(game.my_color==='b'&&game.result==='0-1');
  return won?'فوز':'خسارة';
}

function timeControl(base,inc){
  const min=Math.max(1,Math.round(Number(base||0)/60));
  return `${min}${Number(inc||0)?` +${Number(inc)}`:''}`;
}

function dashboardHost(){
  let host=document.getElementById('v5-home-dashboard');
  if(host) return host;
  const copy=document.querySelector('#homeHero .home-hero-copy');
  if(!copy) return null;
  host=node('section','v5-home-dashboard');
  host.id='v5-home-dashboard';
  host.hidden=true;
  host.setAttribute('aria-label','لوحة العضو');
  if(window.matchMedia('(max-width:900px)').matches) copy.prepend(host);
  else copy.appendChild(host);
  return host;
}

function compactCard(label,title,meta,href){
  const a=node('a','v5-home-card');
  a.href=href;
  a.append(node('small','',label),node('strong','',title||'—'),node('span','',meta||''));
  return a;
}

function renderPayload(host,data){
  const player=data?.player||{};
  const active_game=data?.active_game||null;
  const upcoming_tournament=data?.upcoming_tournament||null;
  const daily_puzzle=data?.daily_puzzle||null;
  const recent_game=data?.recent_game||null;

  const head=node('div','v5-home-head');
  const identity=node('div');
  identity.append(
    node('strong','',player.name||'العضو'),
    node('span','',` · النقاط ${Number(player.rating??1500)} · ${Number(player.games_count||0)} مباراة`),
    node('span','v5-home-online',' · ● متصل الآن')
  );
  const playLink=node('a','btn gold',active_game?'متابعة المباراة':'العب الآن');
  playLink.href=active_game?`play-v2.html?game=${encodeURIComponent(active_game.id)}`:'play-v2.html?auto=1';
  head.append(identity,playLink);

  const mobileStrip=node('div','v5-home-mobile-strip');
  mobileStrip.append(
    linkCard({
      href:recent_game?'analysis.html':'stats.html',
      label:'آخر مباراة',
      value:recent_game?`${resultLabel(recent_game)} · ${recent_game.opponent_name||'الخصم'}`:'لا توجد'
    }),
    linkCard({
      href:'community.html',
      label:'الأصدقاء',
      value:`${Number(data?.online_friends||0)} / ${Number(data?.friends_count||0)}`
    }),
    linkCard({
      href:'notifications.html',
      label:'الإشعارات',
      value:Number(data?.unread_notifications||0)
    })
  );

  const quick=node('div','v5-home-quick');
  quick.append(
    linkCard({href:active_game?`play-v2.html?game=${encodeURIComponent(active_game.id)}`:'play-v2.html?auto=1',label:active_game?'المباراة الحالية':'اللعب',value:active_game?`${active_game.opponent_name||'الخصم'} · ${timeControl(active_game.base_seconds,active_game.increment_seconds)}`:'ابحث عن خصم'}),
    linkCard({href:'community.html',label:'التحديات الواردة',value:Number(data?.incoming_challenges||0)}),
    linkCard({href:'community.html',label:'الأصدقاء',value:`${Number(data?.online_friends||0)} متصل / ${Number(data?.friends_count||0)}`}),
    linkCard({href:'notifications.html',label:'الإشعارات غير المقروءة',value:Number(data?.unread_notifications||0)})
  );

  const cards=node('div','v5-home-cards');
  cards.append(
    compactCard(
      'البطولة',
      upcoming_tournament?.name||'استعرض البطولات',
      upcoming_tournament?`${upcoming_tournament.status==='running'?'جارية':'مفتوحة'} · ${upcoming_tournament.time_control||''}`:'',
      'tournaments.html'
    ),
    compactCard(
      'لغز اليوم',
      daily_puzzle?.title||'ابدأ التدريب',
      daily_puzzle?.rating?`مستوى ${daily_puzzle.rating}`:'',
      daily_puzzle?`puzzles.html?daily=1&puzzle=${encodeURIComponent(daily_puzzle.id)}`:'puzzles.html?daily=1'
    ),
    compactCard(
      'آخر مباراة',
      recent_game?.opponent_name?`ضد ${recent_game.opponent_name}`:'لا توجد مباراة حديثة',
      recent_game?`${resultLabel(recent_game)} · ${timeControl(recent_game.base_seconds,recent_game.increment_seconds)}`:'',
      recent_game?'analysis.html':'stats.html'
    )
  );

  host.replaceChildren(head,mobileStrip,quick,cards);
  host.hidden=false;
  document.body.classList.add('v5-home-dashboard-active');
}

function hideDashboard(){
  const host=document.getElementById('v5-home-dashboard');
  if(host) host.hidden=true;
  document.body.classList.remove('v5-home-dashboard-active');
}

const SAUDI_TICKER_REGIONS=new Set([
  'الرياض','مكة المكرمة','المدينة المنورة','القصيم','الشرقية','عسير','تبوك',
  'حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف'
]);

function tickerCountry(value){
  const region=String(value||'').trim();
  return SAUDI_TICKER_REGIONS.has(region)?'السعودية':region;
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
    const {data,error,count}=await supabase
      .from('public_players')
      .select('id,name,region,city,created_at,is_synthetic',{count:'exact'})
      .order('created_at',{ascending:false})
      .limit(20);
    if(error) throw error;
    renderWelcomeSubscribers(data||[],typeof count==='number'?count:(data||[]).length);
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

async function renderDashboard(){
  const token=++renderToken;
  const host=dashboardHost();
  if(!host) return;
  try{
    const {session,player}=await getSessionPlayer();
    if(token!==renderToken) return;
    if(!session||!player){hideDashboard();return;}
    const data=await rpc('v5_home_dashboard');
    if(token!==renderToken) return;
    renderPayload(host,Array.isArray(data)?data[0]:data);
  }catch(error){
    console.error('home dashboard',error);
    if(token!==renderToken) return;
    host.hidden=false;
    host.replaceChildren(node('div','v5-home-dashboard-error','تعذر تحميل لوحة العضو.'));
  }
}

async function boot(){
  for(let i=0;i<20&&!document.querySelector('#homeHero .home-hero-copy');i++) await sleep(100);
  await Promise.all([loadWelcomeSubscribers(),loadTournamentTicker()]);
  await renderDashboard();
  setInterval(()=>void loadWelcomeSubscribers(),60000);
  setInterval(()=>void loadTournamentTicker(),60000);
  supabase?.auth.onAuthStateChange(()=>{
    setTimeout(()=>void renderDashboard(),350);
  });
}

void boot();
