import { rpc } from '../platform/api.mjs';

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
let latestSnapshot=null;
let renderingTicker=false;

function countryForRegion(value){
  return String(value||'').trim()||'دولة غير محددة';
}

function buildTickerGroup(members){
  const group=document.createElement('div');
  group.className='welcome-ticker-group';
  members.forEach((member,index)=>{
    const item=document.createElement('span');
    item.className='welcome-ticker-item';
    const name=String(member?.name||'لاعب جديد').trim()||'لاعب جديد';
    const country=countryForRegion(member?.region);
    const city=String(member?.city||'').trim();
    item.textContent=city?`${name} — ${country}، ${city}`:`${name} — ${country}`;
    group.appendChild(item);
    if(index<members.length-1){
      const separator=document.createElement('span');
      separator.className='welcome-ticker-separator';
      separator.setAttribute('aria-hidden','true');
      group.appendChild(separator);
    }
  });
  return group;
}

function renderTicker(members){
  const track=document.querySelector('#welcomeTickerTrack');
  if(!track) return;
  renderingTicker=true;
  try{
    const rows=(Array.isArray(members)?members:[]).slice(0,10);
    if(!rows.length){
      track.className='welcome-ticker-track welcome-ticker-single';
      const empty=document.createElement('span');
      empty.className='welcome-ticker-loading';
      empty.textContent='لا توجد تسجيلات حديثة';
      track.replaceChildren(empty);
      return;
    }
    track.className='welcome-ticker-track';
    track.replaceChildren(buildTickerGroup(rows),buildTickerGroup(rows));
  }finally{
    queueMicrotask(()=>{renderingTicker=false;});
  }
}

function renderSnapshot(snapshot){
  latestSnapshot=snapshot||{};
  const players=document.querySelector('#headerPlayersCount');
  const matches=document.querySelector('#headerMatchesCount');
  if(players) players.textContent=String(Number(latestSnapshot.registered_count||0));
  if(matches) matches.textContent=String(Number(latestSnapshot.active_matches||0));
  renderTicker(latestSnapshot.latest_members||[]);
}

function protectLiveValues(){
  const players=document.querySelector('#headerPlayersCount');
  const matches=document.querySelector('#headerMatchesCount');
  const track=document.querySelector('#welcomeTickerTrack');

  const resetNumbers=()=>{
    if(!latestSnapshot) return;
    const registered=String(Number(latestSnapshot.registered_count||0));
    const active=String(Number(latestSnapshot.active_matches||0));
    if(players&&players.textContent!==registered) players.textContent=registered;
    if(matches&&matches.textContent!==active) matches.textContent=active;
  };

  if(players) new MutationObserver(resetNumbers).observe(players,{childList:true,characterData:true,subtree:true});
  if(matches) new MutationObserver(resetNumbers).observe(matches,{childList:true,characterData:true,subtree:true});
  if(track){
    new MutationObserver(()=>{
      if(!latestSnapshot||renderingTicker) return;
      renderTicker(latestSnapshot.latest_members||[]);
    }).observe(track,{childList:true,subtree:true});
  }
}

export async function loadPublicHomeSnapshot(){
  try{
    const data=await rpc('get_public_home_snapshot');
    renderSnapshot(Array.isArray(data)?data[0]||{}:data||{});
  }catch(error){
    console.warn('تعذر تحميل إحصاءات الرئيسية',error);
  }
}

async function boot(){
  if(!document.querySelector('#homeHero')) return;
  for(let i=0;i<20&&!document.querySelector('#welcomeTickerTrack');i++) await sleep(50);
  protectLiveValues();
  await loadPublicHomeSnapshot();
  setInterval(loadPublicHomeSnapshot,30000);
}

void boot();
