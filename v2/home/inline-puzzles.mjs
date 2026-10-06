import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';
import { supabase, getSessionPlayer, rpc } from '../platform/api.mjs';

const desktop=window.matchMedia('(min-width:901px)');
const PIECE_ROOT='assets/pieces/';
const FILES=['a','b','c','d','e','f','g','h'];

let active=false;
let host=null;
let preview=null;
let board=null;
let mode='rated';
let puzzle=null;
let chess=null;
let startFen='';
let selected=null;
let userColor='w';
let mistakes=0;
let hearts=5;
let solved=false;
let player=null;
let rush={active:false,endsAt:0,score:0,misses:0,timer:null};

function ensureCss(){
  if(!document.getElementById('inlinePuzzleCss')){
    const link=document.createElement('link');
    link.id='inlinePuzzleCss';
    link.rel='stylesheet';
    link.href=new URL('./inline-puzzles.css?v=20261006-puzzle-board1',import.meta.url).href;
    document.head.appendChild(link);
  }
  if(!document.getElementById('inlinePuzzleBoardBaseCss')){
    const base=document.createElement('link');
    base.id='inlinePuzzleBoardBaseCss';
    base.rel='stylesheet';
    base.href=new URL('./inline-play.css?v=20260918-inline-play1',import.meta.url).href;
    document.head.appendChild(base);
  }
}

function parseFenPieces(fen){
  const [placement]=String(fen||'').split(/\s+/);
  const out=new Map();
  placement.split('/').forEach((row,ri)=>{
    let file=0;
    for(const token of row){
      if(/\d/.test(token)){ file+=Number(token); continue; }
      const color=token===token.toUpperCase()?'w':'b';
      out.set(`${String.fromCharCode(97+file)}${8-ri}`,{color,type:token.toLowerCase()});
      file+=1;
    }
  });
  return out;
}

function squareOrder(){
  const files=userColor==='w'?FILES:[...FILES].reverse();
  const ranks=userColor==='w'?[8,7,6,5,4,3,2,1]:[1,2,3,4,5,6,7,8];
  return ranks.flatMap(rank=>files.map(file=>`${file}${rank}`));
}

function pieceAsset(color,type){
  return `${PIECE_ROOT}${color}${type}.png`;
}

function ensureBoard(){
  preview=document.getElementById('homeBoardPreview');
  if(!preview) return false;
  preview.removeAttribute('href');
  preview.classList.add('inline-play-active','inline-puzzle-active');
  preview.classList.remove('inline-computer-active');
  let grid=preview.querySelector('#inlinePuzzleBoardGrid');
  if(!grid){
    preview.replaceChildren();
    grid=document.createElement('div');
    grid.id='inlinePuzzleBoardGrid';
    grid.className='desktop-board-grid inline-play-grid inline-puzzle-grid';
    grid.setAttribute('role','grid');
    grid.setAttribute('aria-label','رقعة الألغاز');
    preview.appendChild(grid);
  }
  board=grid;
  if(!board.dataset.bound){
    board.addEventListener('click',handleBoardClick);
    board.dataset.bound='1';
  }
  return true;
}

function restoreStaticBoard(){
  const target=document.getElementById('homeBoardPreview');
  if(!target) return;
  target.classList.remove('inline-play-active','inline-puzzle-active','inline-computer-active');
  target.setAttribute('href','#play');
  target.replaceChildren();
  const grid=document.createElement('span');
  grid.className='desktop-board-grid';
  for(let i=0;i<64;i+=1){
    const row=Math.floor(i/8),col=i%8;
    const square=document.createElement('span');
    square.className=`desktop-board-square ${(row+col)%2?'dark':'light'}`;
    grid.appendChild(square);
  }
  const hint=document.createElement('span');
  hint.className='desktop-board-hint';
  hint.innerHTML='<span class="desktop-board-hint-icon">☝</span><span>اضغط على الرقعة للعب</span>';
  target.append(grid,hint);
}

function renderBoard(){
  if(!board||!chess) return;
  const pieces=parseFenPieces(chess.fen());
  const legal=new Set(
    selected
      ? chess.moves({square:selected,verbose:true}).map(move=>move.to)
      : []
  );
  const frag=document.createDocumentFragment();
  for(const name of squareOrder()){
    const file=name.charCodeAt(0)-97;
    const rank=Number(name[1]);
    const square=document.createElement('button');
    square.type='button';
    square.className=`desktop-board-square inline-play-square inline-puzzle-square ${(file+rank)%2===1?'light':'dark'}`;
    square.dataset.square=name;
    if(selected===name) square.classList.add('selected');
    if(legal.has(name)) square.classList.add('puzzle-target');
    const piece=pieces.get(name);
    if(piece){
      const img=document.createElement('img');
      img.className='inline-play-piece inline-puzzle-piece';
      img.src=pieceAsset(piece.color,piece.type);
      img.alt='';
      img.draggable=false;
      square.appendChild(img);
    }
    frag.appendChild(square);
  }
  board.replaceChildren(frag);
}

function setStatus(text,state=''){
  const el=host?.querySelector('#inlinePuzzleStatus');
  if(!el) return;
  el.textContent=text;
  el.classList.toggle('ok',state==='ok');
  el.classList.toggle('error',state==='error');
}

function updateStats(){
  const rating=host?.querySelector('#inlinePuzzleRating');
  const heartsEl=host?.querySelector('#inlinePuzzleHearts');
  const rushEl=host?.querySelector('#inlinePuzzleRush');
  if(rating&&rating.dataset.value) rating.textContent=rating.dataset.value;
  if(heartsEl) heartsEl.textContent=mode==='daily'?String(hearts):'—';
  if(rushEl&&!rush.active) rushEl.textContent=mode==='rush'?'180ث':'—';
}

function first(value){ return Array.isArray(value)?value[0]||null:value||null; }

async function getStats(){
  const rating=host?.querySelector('#inlinePuzzleRating');
  try{
    const state=await getSessionPlayer();
    player=state.player;
    if(!player){
      if(rating){ rating.dataset.value='زائر'; rating.textContent='زائر'; }
      return;
    }
    const {data}=await supabase
      .from('v2_player_stats')
      .select('puzzle_rating,daily_puzzle_streak')
      .eq('player_id',player.id)
      .maybeSingle();
    const value=String(data?.puzzle_rating??1200);
    if(rating){ rating.dataset.value=value; rating.textContent=value; }
  }catch{
    if(rating){ rating.dataset.value='—'; rating.textContent='—'; }
  }
}

async function fetchPuzzle(){
  return first(await rpc('v3_start_puzzle_session',{
    p_mode:mode,
    p_theme:mode==='custom'?(host?.querySelector('#inlinePuzzleTheme')?.value||null):null
  }));
}

function applyUci(moveUci){
  if(!moveUci||!chess) return null;
  return chess.move({
    from:String(moveUci).slice(0,2),
    to:String(moveUci).slice(2,4),
    promotion:String(moveUci)[4]||'q'
  });
}

function uci(move){ return `${move.from}${move.to}${move.promotion||''}`; }

async function loadPuzzle(){
  if(!active||!host||!board) return;
  selected=null;
  mistakes=0;
  solved=false;
  board.classList.add('busy');
  setStatus('جارٍ تحميل اللغز…');
  try{
    puzzle=await fetchPuzzle();
    if(!puzzle){
      setStatus('لا توجد ألغاز متاحة لهذا الوضع حاليًا.','error');
      return;
    }
    startFen=puzzle.fen;
    chess=new Chess(startFen);
    userColor=chess.turn();
    const title=host.querySelector('#inlinePuzzleTitle');
    const prompt=host.querySelector('#inlinePuzzlePrompt');
    if(title) title.textContent=`${puzzle.title||'لغز'} · ${puzzle.rating??''}`;
    if(prompt) prompt.textContent=userColor==='w'?'دور الأبيض: ابحث عن أفضل نقلة':'دور الأسود: ابحث عن أفضل نقلة';
    setStatus('استخدم الرقعة الرئيسية لتنفيذ النقلة.');
    renderBoard();
  }catch(error){
    console.error(error);
    setStatus('تعذر تحميل اللغز حاليًا.','error');
  }finally{
    board?.classList.remove('busy');
  }
}

async function finishPuzzle(success,row={}){
  if(solved) return;
  solved=true;
  const rating=host?.querySelector('#inlinePuzzleRating');
  if(row?.ratingAfter!=null&&rating){
    rating.dataset.value=String(row.ratingAfter);
    rating.textContent=String(row.ratingAfter);
  }
  if(rush.active){
    if(success) rush.score+=1; else rush.misses+=1;
    const rushEl=host?.querySelector('#inlinePuzzleRush');
    if(rushEl) rushEl.textContent=`${rush.score} / ${rush.misses}`;
    if(rush.misses>=3){
      stopRush('انتهى Rush بعد 3 أخطاء.');
      return;
    }
    setTimeout(()=>void loadPuzzle(),450);
    return;
  }
  if(success){
    setStatus(`صحيح!${row?.delta?` ${row.delta>0?'+':''}${row.delta} نقطة ألغاز`:''}`,'ok');
  }else{
    setStatus('ليست النقلة المطلوبة. اختر لغزًا جديدًا.','error');
  }
}

async function validateMove(moveUci){
  return await rpc('v3_submit_puzzle_session_move',{
    p_session_id:puzzle.session_id,
    p_session_secret:puzzle.session_secret,
    p_move_uci:moveUci
  });
}

async function recoverSession(){
  if(!puzzle) return loadPuzzle();
  try{
    const ok=await rpc('v3_restart_puzzle_session',{
      p_session_id:puzzle.session_id,
      p_session_secret:puzzle.session_secret
    });
    if(!ok) return loadPuzzle();
    chess=new Chess(startFen);
    selected=null;
    mistakes=0;
    solved=false;
    if(mode==='daily') hearts=5;
    updateStats();
    renderBoard();
    setStatus('أعيدت مزامنة اللغز. حاول من البداية.');
  }catch{
    return loadPuzzle();
  }
}

async function tryMove(from,to){
  if(solved||!puzzle||!chess||chess.turn()!==userColor) return;
  let candidate;
  try{
    candidate=chess.move({from,to,promotion:'q'});
  }catch{
    return;
  }
  if(!candidate) return;
  board.classList.add('busy');
  try{
    const result=await validateMove(uci(candidate));
    mistakes=Number(result?.mistakes||0);
    if(!result?.correct){
      chess.undo();
      selected=null;
      renderBoard();
      if(mode==='daily'){
        hearts=Math.max(0,5-mistakes);
        updateStats();
        if(result.completed) await finishPuzzle(false,result);
        else setStatus(`ليست الأفضل. بقي ${hearts} قلوب.`,'error');
      }else{
        await finishPuzzle(false,result);
      }
      return;
    }
    selected=null;
    renderBoard();
    if(result.replyMove){
      await new Promise(resolve=>setTimeout(resolve,260));
      const reply=applyUci(String(result.replyMove));
      if(!reply) throw new Error('invalid_server_reply');
      renderBoard();
    }
    if(result.completed){
      await finishPuzzle(Boolean(result.success),result);
      return;
    }
    setStatus('صحيح، تابع وابحث عن أفضل نقلة.','ok');
  }catch(error){
    console.error(error);
    await recoverSession();
  }finally{
    board.classList.remove('busy');
  }
}

async function handleBoardClick(event){
  event.preventDefault();
  event.stopPropagation();
  if(!active||!chess||solved) return;
  const square=event.target.closest('.inline-puzzle-square');
  if(!square) return;
  const name=square.dataset.square;
  const piece=chess.get(name);
  if(!selected){
    if(piece?.color===userColor&&chess.turn()===userColor){
      selected=name;
      renderBoard();
    }
    return;
  }
  if(name===selected){
    selected=null;
    renderBoard();
    return;
  }
  if(piece?.color===userColor){
    selected=name;
    renderBoard();
    return;
  }
  const from=selected;
  selected=null;
  await tryMove(from,name);
}

function stopRush(message){
  rush.active=false;
  if(rush.timer) clearInterval(rush.timer);
  rush.timer=null;
  setStatus(`${message} النتيجة ${rush.score}.`,'ok');
}

function startRush(){
  if(rush.timer) clearInterval(rush.timer);
  rush={active:true,endsAt:Date.now()+180000,score:0,misses:0,timer:null};
  const tick=()=>{
    const left=Math.max(0,rush.endsAt-Date.now());
    const rushEl=host?.querySelector('#inlinePuzzleRush');
    if(rushEl) rushEl.textContent=`${Math.ceil(left/1000)}ث · ${rush.score}`;
    if(left<=0) stopRush('انتهى الوقت.');
  };
  rush.timer=setInterval(tick,250);
  tick();
  void loadPuzzle();
}

function setMode(next){
  mode=next;
  host?.querySelectorAll('[data-inline-puzzle-mode]').forEach(button=>{
    button.classList.toggle('active',button.dataset.inlinePuzzleMode===mode);
  });
  const custom=host?.querySelector('#inlinePuzzleCustom');
  if(custom) custom.hidden=mode!=='custom';
  hearts=5;
  if(rush.timer) clearInterval(rush.timer);
  rush.active=false;
  rush.timer=null;
  updateStats();
  if(mode==='rush') startRush();
  else void loadPuzzle();
}

function buildPanel(body){
  body.innerHTML=`
    <div class="inline-puzzle-panel">
      <header class="inline-puzzle-head">
        <div>
          <small>وضع التدريب</small>
          <h2>الألغاز</h2>
        </div>
        <span class="inline-puzzle-board-note">اللعب على الرقعة الرئيسية</span>
      </header>

      <section class="inline-puzzle-stats">
        <div><small>تقييم الألغاز</small><strong id="inlinePuzzleRating">—</strong></div>
        <div><small>القلوب</small><strong id="inlinePuzzleHearts">—</strong></div>
        <div><small>النتيجة/الوقت</small><strong id="inlinePuzzleRush">—</strong></div>
      </section>

      <section class="inline-puzzle-card">
        <span id="inlinePuzzleTitle" class="inline-puzzle-badge">جارٍ التحميل</span>
        <h3 id="inlinePuzzlePrompt">ابحث عن أفضل نقلة</h3>
        <div id="inlinePuzzleStatus" class="inline-puzzle-status">جارٍ تجهيز اللغز…</div>

        <label id="inlinePuzzleCustom" class="inline-puzzle-custom" hidden>
          <span>موضوع التدريب</span>
          <select id="inlinePuzzleTheme">
            <option value="">كل المواضيع</option>
            <option value="mate">مات</option>
            <option value="attack">هجوم</option>
            <option value="queen">الوزير</option>
          </select>
        </label>

        <div class="inline-puzzle-actions">
          <button id="inlinePuzzleNext" class="primary" type="button">لغز جديد</button>
          <button id="inlinePuzzleReset" type="button">إعادة الوضع</button>
        </div>
      </section>

      <section class="inline-puzzle-modes" aria-label="نوع اللغز">
        <button class="active" type="button" data-inline-puzzle-mode="rated">مصنّف</button>
        <button type="button" data-inline-puzzle-mode="daily">اليومي</button>
        <button type="button" data-inline-puzzle-mode="custom">مخصص</button>
        <button type="button" data-inline-puzzle-mode="rush">Rush 3 دقائق</button>
      </section>
    </div>`;
  host=body.querySelector('.inline-puzzle-panel');

  host.querySelectorAll('[data-inline-puzzle-mode]').forEach(button=>{
    button.addEventListener('click',()=>setMode(button.dataset.inlinePuzzleMode));
  });
  host.querySelector('#inlinePuzzleNext')?.addEventListener('click',()=>{
    if(mode==='rush') startRush();
    else void loadPuzzle();
  });
  host.querySelector('#inlinePuzzleReset')?.addEventListener('click',async()=>{
    if(!puzzle) return;
    if(solved){ await loadPuzzle(); return; }
    try{
      const ok=await rpc('v3_restart_puzzle_session',{
        p_session_id:puzzle.session_id,
        p_session_secret:puzzle.session_secret
      });
      if(!ok){ await loadPuzzle(); return; }
      chess=new Chess(startFen);
      selected=null;
      mistakes=0;
      if(mode==='daily') hearts=5;
      updateStats();
      renderBoard();
      setStatus('أعيد الوضع. ابحث عن أفضل نقلة.');
    }catch(error){
      console.error(error);
      setStatus('تعذر إعادة اللغز.','error');
    }
  });
  host.querySelector('#inlinePuzzleTheme')?.addEventListener('change',()=>{
    if(mode==='custom') void loadPuzzle();
  });
}

export function mountInlinePuzzles(body){
  if(!desktop.matches||!body) return;
  ensureCss();
  window.dispatchEvent(new CustomEvent('desktop:inline-play-stop'));
  window.dispatchEvent(new CustomEvent('desktop:inline-computer-stop'));
  active=true;
  buildPanel(body);
  if(!ensureBoard()){
    setStatus('تعذر تجهيز الرقعة الرئيسية.','error');
    return;
  }
  updateStats();
  void getStats();
  void loadPuzzle();

  const url=new URL(location.href);
  url.hash='#puzzles';
  history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
}

export function stopInlinePuzzles({restoreBoard=true}={}){
  if(!active) return;
  active=false;
  selected=null;
  solved=false;
  chess=null;
  puzzle=null;
  if(rush.timer) clearInterval(rush.timer);
  rush={active:false,endsAt:0,score:0,misses:0,timer:null};
  if(preview) preview.classList.remove('inline-puzzle-active');
  if(restoreBoard) restoreStaticBoard();
  board=null;
  preview=null;
  host=null;
}

window.addEventListener('desktop:inline-puzzles-stop',()=>stopInlinePuzzles());
