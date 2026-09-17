import { rpc, supabase } from '../platform/api.mjs';
import './public-home.mjs?v=20260912-home-polish1';
import './desktop-board-shell.mjs?v=20260918-fixed-board4';
import './desktop-board-shell-tune.mjs?v=20260918-tip-icon1';

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

function node(tag,className,text){
  const element=document.createElement(tag);
  if(className) element.className=className;
  if(text!=null) element.textContent=String(text);
  return element;
}

function installDailyTipPolish(){
  if(!document.getElementById('desktopDailyTipPolish')){
    const style=document.createElement('style');
    style.id='desktopDailyTipPolish';
    style.textContent=`
@media(min-width:901px){
  body.desktop-board-workspace .desktop-tip-card{
    display:flex!important;
    align-items:center!important;
    gap:14px!important;
    padding:10px 14px!important;
  }
  body.desktop-board-workspace .desktop-tip-icon{
    width:40px!important;
    height:40px!important;
    flex:0 0 40px!important;
    display:grid!important;
    place-items:center!important;
    border:1px solid rgba(239,196,95,.72)!important;
    border-radius:12px!important;
    background:linear-gradient(145deg,rgba(239,196,95,.16),rgba(224,181,103,.06))!important;
    color:#efc45f!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;
    font-size:0!important;
    line-height:0!important;
  }
  body.desktop-board-workspace .desktop-tip-icon svg{
    width:24px!important;
    height:24px!important;
    display:block!important;
    overflow:visible!important;
  }
  body.desktop-board-workspace .desktop-tip-card>div{
    min-width:0!important;
    display:flex!important;
    flex-direction:column!important;
    justify-content:center!important;
    gap:4px!important;
  }
}`;
    document.head.appendChild(style);
  }

  const apply=()=>{
    const icon=document.querySelector('.desktop-tip-icon');
    if(!icon) return false;
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M8.2 14.5A6 6 0 1 1 15.8 14.5c-.8.65-1.25 1.45-1.35 2.5h-4.9c-.1-1.05-.55-1.85-1.35-2.5Z"/><path d="M12 2V1"/><path d="M4.9 4.9 4.2 4.2"/><path d="m19.8 4.2-.7.7"/></svg>`;
    return true;
  };

  if(apply()) return;
  const observer=new MutationObserver(()=>{
    if(apply()) observer.disconnect();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
}

installDailyTipPolish();

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
  for(let i=0;i<20&&!document.querySelector('#homeHero .home-hero-copy');i++) await sleep(100);
  document.getElementById('v5-home-dashboard')?.remove();
  document.body.classList.remove('v5-home-dashboard-active');
  installDailyTipPolish();
  await Promise.all([loadWelcomeSubscribers(),loadTournamentTicker()]);
  setInterval(()=>void loadWelcomeSubscribers(),60000);
  setInterval(()=>void loadTournamentTicker(),60000);
}

void boot();