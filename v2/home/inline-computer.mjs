const desktop=window.matchMedia('(min-width:901px)');
const START_FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PIECE_ROOT='assets/pieces/';
const LEVELS={
  easy:{label:'سهل',skill:8,movetime:250,points:5},
  medium:{label:'متوسط',skill:14,movetime:600,points:10},
  hard:{label:'صعب',skill:20,movetime:1200,points:20},
};
const TIMES=[5,10,15];

let active=false;
let started=false;
let selectedLevel='medium';
let selectedMinutes=5;
let game=null;
let preview=null;
let board=null;
let host=null;
let clockTimer=null;
let whiteMs=300000;
let blackMs=300000;
let lastTick=0;
let selectedSquare=null;
let legalTargets=[];
let engine=null;
let engineReadyPromise=null;
let bestMoveResolve=null;

function ensureCss(){
  if(document.getElementById('inlineComputerCss')) return;
  const link=document.createElement('link');
  link.id='inlineComputerCss';
  link.rel='stylesheet';
  link.href=new URL('./inline-computer.css?v=20260918-compact-controls2',import.meta.url).href;
  document.head.appendChild(link);
  if(!document.getElementById('inlinePlayComputerBaseCss')){
    const base=document.createElement('link');
    base.id='inlinePlayComputerBaseCss';
    base.rel='stylesheet';
    base.href=new URL('./inline-play.css?v=20260918-inline-play1',import.meta.url).href;
    document.head.appendChild(base);
  }
}

function loadChess(){
  if(window.Chess) return Promise.resolve(window.Chess);
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-inline-computer-chess]');
    if(existing){
      existing.addEventListener('load',()=>resolve(window.Chess),{once:true});
      existing.addEventListener('error',()=>reject(new Error('تعذر تحميل محرك القواعد')),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.dataset.inlineComputerChess='1';
    script.src='https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js';
    script.onload=()=>resolve(window.Chess);
    script.onerror=()=>reject(new Error('تعذر تحميل محرك القواعد'));
    document.head.appendChild(script);
  });
}

function initEngine(){
  if(engineReadyPromise) return engineReadyPromise;
  engineReadyPromise=new Promise(resolve=>{
    try{
      engine=new Worker('vendor/stockfish/stockfish-18-lite-single.js');
    }catch{
      resolve(false);
      return;
    }
    let uciReady=false;
    let ready=false;
    const finish=()=>{
      if(uciReady&&ready) resolve(true);
    };
    const timeout=setTimeout(()=>resolve(false),8000);
    engine.onmessage=event=>{
      const lines=String(event.data??'').split(/\r?\n/);
      for(const raw of lines){
        const msg=raw.trim();
        if(msg==='uciok'){
          uciReady=true;
          engine.postMessage('isready');
          finish();
        }else if(msg==='readyok'){
          ready=true;
          clearTimeout(timeout);
          finish();
        }else if(msg.startsWith('bestmove ')&&bestMoveResolve){
          const move=msg.split(/\s+/)[1];
          const done=bestMoveResolve;
          bestMoveResolve=null;
          done(move);
        }
      }
    };
    engine.onerror=()=>resolve(false);
    engine.postMessage('uci');
  });
  return engineReadyPromise;
}

function normalizeComputerLinks(){
  document.querySelectorAll('[data-desktop-nav="computer"]').forEach(link=>link.setAttribute('href','#computer'));
  document.querySelectorAll('a[title="الكمبيوتر"],a[aria-label="الكمبيوتر"],.hero-computer-btn').forEach(link=>link.setAttribute('href','#computer'));
}

function setActiveNav(){
  document.querySelectorAll('.desktop-home-nav-link').forEach(link=>{
    link.classList.toggle('active',link.dataset.desktopNav==='computer');
  });
}

function pieceAsset(color,type){
  return `${PIECE_ROOT}${color}${type}.png`;
}

function parseFen(fen){
  const placement=String(fen||START_FEN).split(/\s+/)[0];
  const rows=placement.split('/');
  const position=new Map();
  rows.forEach((row,rowIndex)=>{
    let file=0;
    for(const token of row){
      if(/\d/.test(token)){ file+=Number(token); continue; }
      const color=token===token.toUpperCase()?'w':'b';
      position.set(`${String.fromCharCode(97+file)}${8-rowIndex}`,{color,type:token.toLowerCase()});
      file+=1;
    }
  });
  return position;
}

function orderedSquares(){
  return [8,7,6,5,4,3,2,1].flatMap(rank=>['a','b','c','d','e','f','g','h'].map(file=>`${file}${rank}`));
}

function ensureBoard(){
  preview=document.getElementById('homeBoardPreview');
  if(!preview) return false;
  preview.setAttribute('href','#computer');
  preview.classList.add('inline-play-active','inline-computer-active');
  let grid=preview.querySelector('#inlineComputerBoardGrid');
  if(!grid){
    preview.replaceChildren();
    grid=document.createElement('div');
    grid.id='inlineComputerBoardGrid';
    grid.className='desktop-board-grid inline-play-grid inline-computer-grid';
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
  target.classList.remove('inline-play-active','inline-computer-active');
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
  if(!board) return;
  const position=parseFen(game?.fen?.()||START_FEN);
  const fragment=document.createDocumentFragment();
  const legalSet=new Set(legalTargets.map(move=>move.to));
  orderedSquares().forEach(squareName=>{
    const file=squareName.charCodeAt(0)-97;
    const rank=Number(squareName[1]);
    const square=document.createElement('button');
    square.type='button';
    square.className=`desktop-board-square inline-play-square ${(file+rank)%2===1?'light':'dark'}`;
    square.dataset.square=squareName;
    if(squareName===selectedSquare) square.classList.add('selected');
    if(legalSet.has(squareName)) square.classList.add('target');
    const piece=position.get(squareName);
    if(piece){
      const img=document.createElement('img');
      img.className='inline-play-piece inline-computer-piece';
      img.src=pieceAsset(piece.color,piece.type);
      img.alt='';
      img.draggable=false;
      square.appendChild(img);
    }
    fragment.appendChild(square);
  });
  board.replaceChildren(fragment);
}

function formatMs(ms){
  const total=Math.max(0,Math.ceil(ms/1000));
  const min=Math.floor(total/60);
  const sec=total%60;
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function updateClockUi(){
  host?.querySelector('[data-computer-clock="black"]')?.replaceChildren(document.createTextNode(formatMs(blackMs)));
  host?.querySelector('[data-computer-clock="white"]')?.replaceChildren(document.createTextNode(formatMs(whiteMs)));
}

function stopClock(){
  if(clockTimer){ clearInterval(clockTimer); clockTimer=null; }
}

function startClock(){
  stopClock();
  lastTick=Date.now();
  clockTimer=setInterval(()=>{
    if(!started||!game) return;
    const now=Date.now();
    const delta=now-lastTick;
    lastTick=now;
    if(game.turn()==='w') whiteMs=Math.max(0,whiteMs-delta);
    else blackMs=Math.max(0,blackMs-delta);
    updateClockUi();
    if(whiteMs<=0) finish('انتهى وقتك — فاز الكمبيوتر');
    else if(blackMs<=0) finish('انتهى وقت الكمبيوتر — فزت');
  },250);
}

function setStatus(text,error=false){
  const node=host?.querySelector('#inlineComputerStatus');
  if(!node) return;
  node.textContent=text;
  node.classList.toggle('error',error);
}

function syncPlayer(){
  const name=document.getElementById('desktopMemberName')?.textContent?.trim()||'أنت';
  const rating=document.getElementById('desktopMemberRating')?.textContent?.trim()||'1500';
  const n=host?.querySelector('#inlineComputerPlayerName');
  const m=host?.querySelector('#inlineComputerPlayerMeta');
  if(n) n.textContent=name;
  if(m) m.textContent=`النقاط ${rating}`;
}

function buildPanel(body){
  body.innerHTML=`
    <div class="inline-computer-panel">
      <section class="inline-play-player-card inline-computer-opponent">
        <div class="inline-play-player-copy">
          <strong class="inline-play-player-name">الكمبيوتر</strong>
          <span id="inlineComputerOpponentMeta" class="inline-play-player-meta">مستوى متوسط — ±10 نقاط</span>
          <span id="inlineComputerStatus" class="inline-play-status">اختر المستوى والزمن ثم ابدأ</span>
        </div>
        <time class="inline-play-clock" data-computer-clock="black">05:00</time>
      </section>

      <section id="inlineComputerSetup" class="inline-computer-setup">
        <span class="inline-computer-label">المستوى</span>
        <div class="inline-computer-options" data-computer-levels>
          <button type="button" data-level="easy">سهل <small>±5</small></button>
          <button type="button" data-level="medium" class="active">متوسط <small>±10</small></button>
          <button type="button" data-level="hard">صعب <small>±20</small></button>
        </div>
        <span class="inline-computer-label">زمن المباراة</span>
        <div class="inline-computer-options" data-computer-times>
          <button type="button" data-minutes="5" class="active">5 دقائق</button>
          <button type="button" data-minutes="10">10 دقائق</button>
          <button type="button" data-minutes="15">15 دقيقة</button>
        </div>
        <button id="inlineComputerStart" class="inline-computer-start" type="button">ابدأ اللعب</button>
      </section>

      <section id="inlineComputerActions" class="inline-play-actions" hidden>
        <button id="inlineComputerNew" type="button">مباراة جديدة</button>
        <button id="inlineComputerResign" type="button">استسلام</button>
      </section>

      <section class="inline-play-player-card inline-computer-player">
        <div class="inline-play-player-copy">
          <strong id="inlineComputerPlayerName" class="inline-play-player-name">أنت</strong>
          <span id="inlineComputerPlayerMeta" class="inline-play-player-meta">النقاط 1500</span>
          <span class="inline-play-status">أنت تلعب بالأبيض</span>
        </div>
        <time class="inline-play-clock" data-computer-clock="white">05:00</time>
      </section>
    </div>`;

  host=body.querySelector('.inline-computer-panel');
  syncPlayer();
  bindPanel();
}

function bindPanel(){
  host.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>{
    if(started) return;
    selectedLevel=button.dataset.level;
    host.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',b===button));
    const level=LEVELS[selectedLevel];
    const meta=host.querySelector('#inlineComputerOpponentMeta');
    if(meta) meta.textContent=`مستوى ${level.label} — ±${level.points} نقاط`;
  }));
  host.querySelectorAll('[data-minutes]').forEach(button=>button.addEventListener('click',()=>{
    if(started) return;
    selectedMinutes=Number(button.dataset.minutes)||5;
    host.querySelectorAll('[data-minutes]').forEach(b=>b.classList.toggle('active',b===button));
    whiteMs=blackMs=selectedMinutes*60000;
    updateClockUi();
  }));
  host.querySelector('#inlineComputerStart')?.addEventListener('click',()=>void startGame());
  host.querySelector('#inlineComputerNew')?.addEventListener('click',resetToSetup);
  host.querySelector('#inlineComputerResign')?.addEventListener('click',()=>finish('استسلمت — فاز الكمبيوتر'));
}

async function startGame(){
  try{
    await loadChess();
  }catch(error){
    setStatus(error.message||'تعذر بدء المباراة',true);
    return;
  }
  window.dispatchEvent(new CustomEvent('desktop:inline-play-stop'));
  game=new window.Chess();
  started=true;
  selectedSquare=null;
  legalTargets=[];
  whiteMs=blackMs=selectedMinutes*60000;
  const setup=host.querySelector('#inlineComputerSetup');
  const actions=host.querySelector('#inlineComputerActions');
  if(setup) setup.hidden=true;
  if(actions) actions.hidden=false;
  setStatus(`دورك — مستوى ${LEVELS[selectedLevel].label}`);
  renderBoard();
  updateClockUi();
  startClock();
  void initEngine();
}

function resetToSetup(){
  started=false;
  stopClock();
  game=null;
  selectedSquare=null;
  legalTargets=[];
  whiteMs=blackMs=selectedMinutes*60000;
  host.querySelector('#inlineComputerSetup').hidden=false;
  host.querySelector('#inlineComputerActions').hidden=true;
  setStatus('اختر المستوى والزمن ثم ابدأ');
  renderBoard();
  updateClockUi();
}

function finish(message){
  if(!started) return;
  started=false;
  stopClock();
  selectedSquare=null;
  legalTargets=[];
  setStatus(message);
  renderBoard();
}

function checkGameEnd(){
  if(!game) return false;
  if(game.in_checkmate()){
    finish(game.turn()==='b'?'كش مات — فزت':'كش مات — فاز الكمبيوتر');
    return true;
  }
  if(game.in_draw()){
    finish('انتهت المباراة بالتعادل');
    return true;
  }
  return false;
}

function chooseFallbackMove(){
  const moves=game.moves({verbose:true});
  if(!moves.length) return null;
  const captures=moves.filter(move=>move.captured);
  if(selectedLevel==='hard'&&captures.length) return captures[Math.floor(Math.random()*captures.length)];
  if(selectedLevel==='medium'&&captures.length&&Math.random()<0.7) return captures[Math.floor(Math.random()*captures.length)];
  return moves[Math.floor(Math.random()*moves.length)];
}

async function askEngineMove(){
  const ready=await initEngine();
  if(!ready||!engine) return null;
  const level=LEVELS[selectedLevel];
  engine.postMessage(`setoption name Skill Level value ${level.skill}`);
  engine.postMessage(`position fen ${game.fen()}`);
  return new Promise(resolve=>{
    const timer=setTimeout(()=>{
      if(bestMoveResolve){ bestMoveResolve=null; resolve(null); }
    },Math.max(2500,level.movetime+1800));
    bestMoveResolve=move=>{
      clearTimeout(timer);
      resolve(move&&move!=='(none)'?move:null);
    };
    engine.postMessage(`go movetime ${level.movetime}`);
  });
}

async function computerTurn(){
  if(!started||!game||game.turn()!=='b') return;
  setStatus('الكمبيوتر يفكر…');
  let moveText=null;
  try{ moveText=await askEngineMove(); }catch{}
  if(!started||!game||game.turn()!=='b') return;
  let move=null;
  if(moveText&&moveText.length>=4){
    move=game.move({from:moveText.slice(0,2),to:moveText.slice(2,4),promotion:moveText[4]||'q'});
  }
  if(!move){
    const fallback=chooseFallbackMove();
    if(fallback) game.move({from:fallback.from,to:fallback.to,promotion:fallback.promotion||'q'});
  }
  selectedSquare=null;
  legalTargets=[];
  renderBoard();
  if(checkGameEnd()) return;
  lastTick=Date.now();
  setStatus('دورك');
}

function handleBoardClick(event){
  event.preventDefault();
  if(!active||!started||!game||game.turn()!=='w') return;
  const square=event.target.closest('[data-square]')?.dataset.square;
  if(!square) return;
  if(!selectedSquare){
    const piece=game.get(square);
    if(!piece||piece.color!=='w') return;
    selectedSquare=square;
    legalTargets=game.moves({square,verbose:true});
    renderBoard();
    return;
  }
  const candidate=legalTargets.find(move=>move.to===square);
  if(candidate){
    game.move({from:selectedSquare,to:square,promotion:candidate.promotion||'q'});
    selectedSquare=null;
    legalTargets=[];
    renderBoard();
    if(checkGameEnd()) return;
    lastTick=Date.now();
    void computerTurn();
    return;
  }
  const piece=game.get(square);
  if(piece?.color==='w'){
    selectedSquare=square;
    legalTargets=game.moves({square,verbose:true});
  }else{
    selectedSquare=null;
    legalTargets=[];
  }
  renderBoard();
}

export function mountInlineComputer(body){
  if(!desktop.matches||!body) return;
  ensureCss();
  window.dispatchEvent(new CustomEvent('desktop:inline-play-stop'));
  active=true;
  normalizeComputerLinks();
  setActiveNav();
  ensureBoard();
  buildPanel(body);
  renderBoard();
  updateClockUi();
  const url=new URL(location.href);
  url.hash='#computer';
  history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
}

export function stopInlineComputer({restoreBoard=true}={}){
  if(!active) return;
  active=false;
  started=false;
  stopClock();
  selectedSquare=null;
  legalTargets=[];
  if(engine){
    try{engine.terminate();}catch{}
    engine=null;
    engineReadyPromise=null;
    bestMoveResolve=null;
  }
  if(restoreBoard) restoreStaticBoard();
}

window.addEventListener('desktop:inline-computer-stop',()=>stopInlineComputer());

if(desktop.matches){
  ensureCss();
  normalizeComputerLinks();
  const observer=new MutationObserver(()=>normalizeComputerLinks());
  observer.observe(document.documentElement,{childList:true,subtree:true});
}
