/* Live tournament spectator on the persistent home board, desktop and mobile. */
import { supabase } from '../platform/api.mjs';
import { decorateBoardCoordinate,openMoveNotebook,updateMoveNotebook,closeMoveNotebook } from './move-notebook.mjs?v=20261012-notebook-aligned-v13';
import { playBoardMoveSound } from '../board/move-sound.mjs?v=20261013-movesound-v1';
import { moveFromRecord, moveFromPositions, setLastMoveClass } from '../play/last-move.mjs?v=20261018-last-move-v1';

const EMPTY='8/8/8/8/8/8/8/8';
const FILES=['a','b','c','d','e','f','g','h'];
const live={id:'',type:'human',presentation:'tournament',host:null,saved:null,poll:null,clock:null,generation:0,state:null,fetching:false,fen:'',lastMove:null,errorShown:false};
let cssInstalled=false;

function installStyle(){
  if(cssInstalled)return;
  cssInstalled=true;
  const css=document.createElement('style');
  css.id='inlineTournamentSpectatorStyles';
  css.textContent=[
    '.inline-tournament-spectator{cursor:default!important;}',
    '.inline-tournament-spectator.inline-public-watch .inline-spectator-hud{display:none!important;}',
    '.inline-tournament-spectator.inline-public-watch .desktop-board-square::before,.inline-tournament-spectator.inline-public-watch .desktop-board-square::after{content:none!important;display:none!important;background-image:none!important;}',
    '.inline-tournament-spectator .last-move-from{box-shadow:inset 0 0 0 2px rgba(217,233,247,.92),inset 0 0 0 999px rgba(180,200,224,.11)!important;}',
    '.inline-tournament-spectator .last-move-to{box-shadow:inset 0 0 0 4px rgba(225,238,250,.98),inset 0 0 0 999px rgba(180,200,224,.23)!important;}',
    '.inline-tournament-spectator .desktop-board-grid{direction:ltr!important;display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;grid-template-rows:repeat(8,minmax(0,1fr))!important;}',
    '.inline-tournament-spectator .desktop-board-square,.inline-tournament-spectator .mfw-square{display:grid!important;place-items:center!important;min-width:0!important;min-height:0!important;overflow:hidden!important;}',
    '.inline-tournament-spectator .inline-spectator-piece{display:block;width:92%;height:92%;max-width:100%;max-height:100%;object-fit:contain;pointer-events:none;user-select:none;}',
    '.inline-tournament-spectator .inline-spectator-piece:not([src*="/wp.png"]):not([src*="/bp.png"]){width:87.4%;height:87.4%;}',
    '.inline-tournament-spectator .inline-spectator-piece:is([src*="/wp.png"],[src*="/bp.png"]){width:82.8%;height:82.8%;}',
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
  // Share the exact same clock source with the two read-only player cards.
  if(live.presentation==='watch'){
    const panel=document.querySelector('#desktopDashboardView.watch-view .desktop-dashboard-view-body');
    if(panel?.dataset.watchGameId===live.id){
      const w=panel.querySelector('[data-watch-clock="w"]');
      const b=panel.querySelector('[data-watch-clock="b"]');
      if(w){w.textContent=c.w;w.classList.toggle('final-minute',c.dangerW);}
      if(b){b.textContent=c.b;b.classList.toggle('final-minute',c.dangerB);}
    }
  }
}
function setStatus(message){
  const el=live.host?.querySelector('[data-spectator-state]');
  if(el)el.textContent=message;
}
function renderFen(fen,move=null){
  const parsed=squarePieces(fen);if(!parsed)return false;
  const grid=live.host?.querySelector('[data-inline-spectator-grid]');
  if(!grid)return false;
  // Never repaint 64 squares just because a spectator clock was refreshed.
  if(live.fen===fen&&grid.children.length===64){
    setLastMoveClass(grid,move);
    return true;
  }
  const mobile=live.host.id==='mfwBoard';
  const fragment=document.createDocumentFragment();
  // The canonical colors and PNGs are preserved; highlight only the actual
  // start and end squares of the latest recorded chess move.
  for(let rank=8;rank>=1;rank--){
    for(let col=0;col<8;col++){
      const name=FILES[col]+rank;
      // The idle homepage uses a LIGHT a8 square. Keep the same 64-square colors.
      const light=(col+rank)%2===0;
      const el=document.createElement('span');
      el.className=mobile?'mfw-square '+(light?'light':'dark'):'desktop-board-square '+(light?'light':'dark');
      el.dataset.square=name;
      const p=parsed.get(name);
      if(p){
        const img=document.createElement('img');
        // Original homepage piece artwork/sizing, not a second spectator set.
        img.className=mobile?'inline-spectator-piece mfw-piece':'desktop-board-preview-piece';
        img.src='assets/pieces/'+p.color+p.kind+'.png';
        img.alt='';img.draggable=false;
        el.appendChild(img);
      }
      if(!mobile)decorateBoardCoordinate(el,(8-rank)*8+col,name);
      fragment.appendChild(el);
    }
  }
  grid.replaceChildren(fragment);
  setLastMoveClass(grid,move);
  live.fen=fen;
  return true;
}
function paintState(row){
  if(!live.host)return;
  const moves=Array.isArray(row.moves)?row.moves:[];
  const previousFen=live.state?.fen||'';
  const previousMoves=Array.isArray(live.state?.moves)?live.state.moves.length:null;
  const recorded=moveFromRecord(moves[moves.length-1]);
  const changed=row.fen!==live.fen;
  const latest=recorded || (changed?moveFromPositions(live.state?.fen,row.fen):live.lastMove);
  if(!renderFen(row.fen,latest))throw new Error('invalid fen');
  live.lastMove=latest;
  live.state=row;
  // Only confirmed new moves are audible: never replay history on first view.
  if(previousFen&&previousFen!==row.fen&&previousMoves!==null&&moves.length>previousMoves)
    playBoardMoveSound(previousFen,row.fen);
  if(live.presentation==='watch'&&window.matchMedia('(min-width:901px)').matches
    &&(previousMoves!==moves.length||row.status==='finished'))
    updateMoveNotebook('spectator',moves,{finished:row.status==='finished'});
  const bn=live.host.querySelector('[data-spectator-name="b"]');
  const wn=live.host.querySelector('[data-spectator-name="w"]');
  if(bn)bn.textContent=row.black_name||'الأسود';
  if(wn)wn.textContent=row.white_name||'الأبيض';
  const status=row.status==='finished'?'انتهت المباراة':row.status==='cancelled'?'أُلغيت المباراة':row.status==='matched'?'بانتظار النقلة الأولى':row.status==='active'?'مشاهدة مباشرة':'متابعة المباراة';
  setStatus(status);
  if(live.presentation==='watch'){
    const detail={
      gameId:live.id,whiteName:row.white_name||'الأبيض',blackName:row.black_name||'الأسود',
      whiteRating:row.white_rating??row.player_rating??null,
      blackRating:row.black_rating??null,
      status,turn:String(row.fen||'').split(/\s+/)[1]||'',
      moveCount:Array.isArray(row.moves)?row.moves.length:Math.max(0,Number(row.ply)||0),
      result:row.result||null,fen:row.fen
    };
    window.dispatchEvent(new CustomEvent('shatranj:public-watch-updated',{detail}));
  }
  showClocks();
}
async function fetchState(generation){
  if(!supabase||live.fetching||!live.id||generation!==live.generation)return;
  live.fetching=true;
  const id=live.id;
  try{
    const type=live.type;
    const rpcName=type==='human_v2'?'get_public_v2_spectator_game_state'
      :type==='computer'?'get_public_computer_game':'get_spectator_live_game_state';
    const {data,error}=await supabase.rpc(rpcName,{p_game_id:id});
    if(error)throw error;
    if(generation!==live.generation||id!==live.id||type!==live.type)return;
    const result=Array.isArray(data)?data[0]:data;
    if(!result?.fen)throw new Error('No spectator state');
    const row=type==='computer'
      ? {...result,white_name:result.player_name||'اللاعب',black_name:'الكمبيوتر',
         white_time_ms:result.player_time_ms,black_time_ms:result.computer_time_ms}
      :result;
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
export function stopInlineTournamentSpectator({notify=true}={}){
  const previousGameId=live.id;
  const wasPublicWatch=live.presentation==='watch';
  ++live.generation;
  if(live.poll){clearInterval(live.poll);live.poll=null;}
  if(live.clock){clearInterval(live.clock);live.clock=null;}
  const host=live.host;
  if(host&&live.saved){
    host.replaceChildren(live.saved);
    host.classList.remove('inline-tournament-spectator','inline-public-watch');
    host.removeAttribute('data-tournament-spectating');
  }
  live.id='';live.type='human';live.presentation='tournament';live.host=null;live.saved=null;live.state=null;live.fen='';live.lastMove=null;live.fetching=false;live.errorShown=false;
  if(previousGameId&&wasPublicWatch){
    closeMoveNotebook('spectator');
    window.dispatchEvent(new CustomEvent('shatranj:public-watch-stopped',{detail:{gameId:previousGameId}}));
  }
  if(notify&&previousGameId&&!wasPublicWatch)window.dispatchEvent(new Event('shatranj:tournament-spectator-stopped'));
}
export async function mountInlineTournamentSpectator(gameId,{gameType='human',presentation='tournament'}={}){
  const id=String(gameId||'').trim();
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return false;
  const type=['human','human_v2','computer'].includes(gameType)?gameType:'human';
  const host=window.matchMedia('(min-width:901px)').matches
    ?document.getElementById('homeBoardPreview')
    :document.getElementById('mfwBoard');
  if(!host||!supabase)return false;
  installStyle();
  const displayMode=presentation==='watch'?'watch':'tournament';
  if(live.host===host&&live.id===id&&live.type===type&&live.presentation===displayMode){void fetchState(live.generation);return true;}
  stopInlineTournamentSpectator({notify:false});
  const saved=document.createDocumentFragment();
  while(host.firstChild)saved.appendChild(host.firstChild);
  live.host=host;live.saved=saved;live.id=id;live.type=type;live.presentation=displayMode;
  if(displayMode==='watch'&&window.matchMedia('(min-width:901px)').matches)openMoveNotebook('spectator');
  host.classList.add('inline-tournament-spectator');
  host.classList.toggle('inline-public-watch',displayMode==='watch');
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
