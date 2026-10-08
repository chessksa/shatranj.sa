/* Live tournament spectator on the persistent home board, desktop and mobile. */
import { supabase } from '../platform/api.mjs';

const EMPTY='8/8/8/8/8/8/8/8';
const FILES=['a','b','c','d','e','f','g','h'];
const live={id:'',host:null,saved:null,poll:null,clock:null,generation:0,state:null,fetching:false,fen:'',errorShown:false};
let cssInstalled=false;

function installStyle(){
  if(cssInstalled)return;
  cssInstalled=true;
  const css=document.createElement('style');
  css.id='inlineTournamentSpectatorStyles';
  css.textContent=[
    '.inline-tournament-spectator{cursor:default!important;}',
    '.inline-tournament-spectator .desktop-board-grid{direction:ltr!important;display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;grid-template-rows:repeat(8,minmax(0,1fr))!important;}',
    '.inline-tournament-spectator .desktop-board-square,.inline-tournament-spectator .mfw-square{display:grid!important;place-items:center!important;min-width:0!important;min-height:0!important;overflow:hidden!important;}',
    '.inline-tournament-spectator .inline-spectator-piece{display:block;width:92%;height:92%;max-width:100%;max-height:100%;object-fit:contain;pointer-events:none;user-select:none;}',
    '.inline-tournament-spectator .inline-spectator-last{box-shadow:inset 0 0 0 3px rgba(218,170,74,.58)!important;}',
    '.inline-tournament-spectator .inline-spectator-hud{position:absolute;z-index:9;left:9px;right:9px;display:flex;align-items:center;gap:6px;justify-content:space-between;min-width:0;pointer-events:none;direction:rtl;}',
    '.inline-tournament-spectator .inline-spectator-hud.top{top:9px}.inline-tournament-spectator .inline-spectator-hud.bottom{bottom:9px;}',
    '.inline-tournament-spectator .inline-spectator-person{min-width:0;max-width:77%;display:flex;align-items:center;gap:7px;padding:6px 9px;background:rgba(2,38,41,.94);border:1px solid rgba(216,182,101,.25);border-radius:7px;color:#f4eddc;font:800 12px Arial,sans-serif;}',
    '.inline-tournament-spectator .inline-spectator-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}',
    '.inline-tournament-spectator .inline-spectator-clock{font-size:12px;color:#efcf7c;direction:ltr;white-space:nowrap;font-variant-numeric:tabular-nums;}',
    '.inline-tournament-spectator .inline-spectator-clock.danger{color:#ff7777;}',
    '.inline-tournament-spectator .inline-spectator-close{pointer-events:auto;border:1px solid rgba(216,182,101,.65);border-radius:7px;background:#07363a;color:#efcf7c;min-height:32px;min-width:32px;padding:3px 8px;font:900 15px Arial,sans-serif;cursor:pointer;}',
    '.inline-tournament-spectator .inline-spectator-state{pointer-events:none;padding:5px 9px;border:1px solid rgba(216,182,101,.3);border-radius:7px;background:rgba(2,38,41,.94);color:#f4eddc;font:800 11px Arial,sans-serif;white-space:nowrap;}',
    '@media(max-width:900px){.inline-tournament-spectator .inline-spectator-hud{left:5px;right:5px}.inline-tournament-spectator .inline-spectator-hud.top{top:5px}.inline-tournament-spectator .inline-spectator-hud.bottom{bottom:5px}.inline-tournament-spectator .inline-spectator-person{padding:4px 5px;gap:4px;font-size:10px}.inline-tournament-spectator .inline-spectator-clock{font-size:10px}.inline-tournament-spectator .inline-spectator-state{font-size:9px;padding:4px 6px}.inline-tournament-spectator .inline-spectator-close{min-width:27px;min-height:27px;padding:2px 6px;font-size:12px}}'
  ].join('\n');
  document.head.appendChild(css);
}
function squarePieces(fen){
  const rows=String(fen||EMPTY).trim().split(/\s+/)[0].split('/');
  if(rows.length!==8)return null;
  const map=new Map();
  for(let r=0;r<8;r++){
    let file=0;
    for(const c of rows[r]){
      if(/[1-8]/.test(c)){file+=Number(c);continue;}
      if(!/[prnbqkPRNBQK]/.test(c)||file>7)return null;
      map.set(FILES[file]+String(8-r),{color:c===c.toUpperCase()?'w':'b',kind:c.toLowerCase()});
      file++;
    }
    if(file!==8)return null;
  }
  return map;
}
function formatClock(ms){
  const sec=Math.max(0,Math.ceil(Number(ms||0)/1000));
  return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}
function clockValues(){
  const row=live.state;
  if(!row)return {w:'--:--',b:'--:--',dangerW:false,dangerB:false};
  let w=Math.max(0,Number(row.white_time_ms||0)),b=Math.max(0,Number(row.black_time_ms||0));
  if(row.status==='active'&&row.turn_started_at){
    const start=Date.parse(row.turn_started_at);
    if(Number.isFinite(start)){
      const elapsed=Math.max(0,Date.now()-start);
      if(String(live.fen).split(/\s+/)[1]==='w')w=Math.max(0,w-elapsed);
      else b=Math.max(0,b-elapsed);
    }
  }
  return {w:formatClock(w),b:formatClock(b),dangerW:w<=60000,dangerB:b<=60000};
}
function showClocks(){
  const c=clockValues();
  const black=live.host?.querySelector('[data-spectator-clock="b"]');
  const white=live.host?.querySelector('[data-spectator-clock="w"]');
  if(black){black.textContent=c.b;black.classList.toggle('danger',c.dangerB);}
  if(white){white.textContent=c.w;white.classList.toggle('danger',c.dangerW);}
}
function setStatus(message){
  const el=live.host?.querySelector('[data-spectator-state]');
  if(el)el.textContent=message;
}
function renderFen(fen){
  const parsed=squarePieces(fen);if(!parsed)return false;
  const grid=live.host?.querySelector('[data-inline-spectator-grid]');
  if(!grid)return false;
  const mobile=live.host.id==='mfwBoard';
  const fragment=document.createDocumentFragment();
  let prev=squarePieces(live.fen);
  const changes=new Set();
  if(prev&&live.fen&&live.fen!==fen){
    for(const square of Array.from(new Set([...prev.keys(),...parsed.keys()]))){
      const a=prev.get(square),b=parsed.get(square);
      if(a?.kind!==b?.kind||a?.color!==b?.color)changes.add(square);
    }
  }
  for(let rank=8;rank>=1;rank--){
    for(let col=0;col<8;col++){
      const name=FILES[col]+rank;
      const dark=(col+rank)%2===0;
      const el=document.createElement('span');
      el.className=mobile?'mfw-square '+(dark?'dark':'light'):'desktop-board-square '+(dark?'dark':'light');
      if(changes.size===2&&changes.has(name))el.classList.add('inline-spectator-last');
      el.dataset.square=name;
      const p=parsed.get(name);
      if(p){
        const img=document.createElement('img');
        img.className='inline-spectator-piece'+(mobile?' mfw-piece':'');
        img.src='assets/pieces/'+p.color+p.kind+'.png';
        img.alt='';img.draggable=false;
        el.appendChild(img);
      }
      fragment.appendChild(el);
    }
  }
  grid.replaceChildren(fragment);
  live.fen=fen;
  return true;
}
function paintState(row){
  if(!live.host)return;
  if(!renderFen(row.fen))throw new Error('invalid fen');
  live.state=row;
  const bn=live.host.querySelector('[data-spectator-name="b"]');
  const wn=live.host.querySelector('[data-spectator-name="w"]');
  if(bn)bn.textContent=row.black_name||'الأسود';
  if(wn)wn.textContent=row.white_name||'الأبيض';
  setStatus(row.status==='finished'?'انتهت المباراة':row.status==='cancelled'?'أُلغيت المباراة':row.status==='active'?'مشاهدة مباشرة':'متابعة البطولة');
  showClocks();
}
async function fetchState(generation){
  if(!supabase||live.fetching||!live.id||generation!==live.generation)return;
  live.fetching=true;
  const id=live.id;
  try{
    const {data,error}=await supabase.rpc('get_spectator_live_game_state',{p_game_id:id});
    if(error)throw error;
    if(generation!==live.generation||id!==live.id)return;
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.fen)throw new Error('No spectator state');
    paintState(row);
    live.errorShown=false;
    if(['finished','cancelled'].includes(row.status)&&live.poll){clearInterval(live.poll);live.poll=null;}
  }catch(error){
    if(generation!==live.generation)return;
    if(!live.errorShown){console.warn('Tournament spectator refresh failed',error);live.errorShown=true;}
    setStatus('تعذر التحديث — إعادة المحاولة');
  }finally{
    if(generation===live.generation)live.fetching=false;
  }
}
function createHud(color,loc){
  const hud=document.createElement('div');
  hud.className='inline-spectator-hud '+loc;
  const person=document.createElement('div');
  person.className='inline-spectator-person';
  const name=document.createElement('span');
  name.className='inline-spectator-name';
  name.dataset.spectatorName=color;
  name.textContent=color==='b'?'الأسود':'الأبيض';
  const clock=document.createElement('time');
  clock.className='inline-spectator-clock';
  clock.dataset.spectatorClock=color;
  clock.textContent='--:--';
  person.append(name,clock);
  if(loc==='top'){
    const close=document.createElement('button');close.type='button';
    close.className='inline-spectator-close';
    close.textContent='×';close.title='إغلاق المشاهدة';
    close.setAttribute('aria-label','إغلاق المشاهدة');
    close.addEventListener('click',event=>{event.stopPropagation();stopInlineTournamentSpectator();});
    hud.append(person,close);
  }else{
    const state=document.createElement('span');
    state.className='inline-spectator-state';
    state.dataset.spectatorState='';
    state.textContent='جاري الاتصال…';
    hud.append(person,state);
  }
  return hud;
}
export function stopInlineTournamentSpectator(){
  ++live.generation;
  if(live.poll){clearInterval(live.poll);live.poll=null;}
  if(live.clock){clearInterval(live.clock);live.clock=null;}
  const host=live.host;
  if(host&&live.saved){
    host.replaceChildren(live.saved);
    host.classList.remove('inline-tournament-spectator');
    host.removeAttribute('data-tournament-spectating');
  }
  live.id='';live.host=null;live.saved=null;live.state=null;live.fen='';live.fetching=false;live.errorShown=false;
}
export async function mountInlineTournamentSpectator(gameId){
  const id=String(gameId||'').trim();
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return false;
  const host=window.matchMedia('(min-width:901px)').matches
    ?document.getElementById('homeBoardPreview')
    :document.getElementById('mfwBoard');
  if(!host||!supabase)return false;
  installStyle();
  if(live.host===host&&live.id===id){void fetchState(live.generation);return true;}
  stopInlineTournamentSpectator();
  const saved=document.createDocumentFragment();
  while(host.firstChild)saved.appendChild(host.firstChild);
  live.host=host;live.saved=saved;live.id=id;
  host.classList.add('inline-tournament-spectator');
  host.setAttribute('data-tournament-spectating',id);
  const grid=document.createElement('div');
  grid.className=host.id==='mfwBoard'?'mfw-board-grid':'desktop-board-grid';
  grid.dataset.inlineSpectatorGrid='';
  host.append(grid,createHud('b','top'),createHud('w','bottom'));
  renderFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
  const generation=live.generation;
  await fetchState(generation);
  if(generation===live.generation&&live.host===host){
    live.poll=setInterval(()=>{if(!document.hidden)void fetchState(generation);},1200);
    live.clock=setInterval(showClocks,300);
  }
  return true;
}
