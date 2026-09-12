import { getSessionPlayer, rpc, supabase } from '../platform/api.mjs';

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
  copy.appendChild(host);
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
  identity.append(node('strong','',player.name||'العضو'),node('span','',` · النقاط ${Number(player.rating??1500)} · ${Number(player.games_count||0)} مباراة`));
  const playLink=node('a','btn gold',active_game?'متابعة المباراة':'العب الآن');
  playLink.href=active_game?`play-v2.html?game=${encodeURIComponent(active_game.id)}`:'play-v2.html?auto=1';
  head.append(identity,playLink);

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

  host.replaceChildren(head,quick,cards);
  host.hidden=false;
  document.body.classList.add('v5-home-dashboard-active');
}

function hideDashboard(){
  const host=document.getElementById('v5-home-dashboard');
  if(host) host.hidden=true;
  document.body.classList.remove('v5-home-dashboard-active');
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
  await renderDashboard();
  supabase?.auth.onAuthStateChange(()=>{
    setTimeout(()=>void renderDashboard(),350);
  });
}

void boot();
