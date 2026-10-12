/* One shared match notebook for desktop online and computer play.
   Accurate live SAN for online games; computer UCI is converted when chess.js is available.
   Stockfish analysis is intentionally post-game, bounded and explicitly approximate. */
const HOST_ID='desktopMoveNotebook';
const START_FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let owner='', token=0, records=[], ended=false, activeReview=null, chessModulePromise=null;

function chessModule(){
  return chessModulePromise ||= import('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm').catch(error=>{
    chessModulePromise=null;
    throw error;
  });
}
function ensureHost(){
  const stage=document.querySelector('.desktop-board-stage');
  if(!stage)return null;
  let root=document.getElementById(HOST_ID);
  if(root&&root.parentElement!==stage)root.remove();
  root=document.getElementById(HOST_ID);
  if(!root){
    root=document.createElement('aside');
    root.id=HOST_ID;
    root.className='desktop-move-notebook';
    root.setAttribute('aria-label','سجل نقلات الشطرنج وتحليل المباراة');
    root.innerHTML=`
      <header class="move-notebook-header">
        <span class="move-notebook-emblem" aria-hidden="true">♙</span>
        <div><strong id="moveNotebookTitle">سجل النقلات</strong><small id="moveNotebookSub">تتبع المباراة نقلة بنقلة</small></div>
      </header>
      <div class="move-notebook-columns" aria-hidden="true"><span>الدور</span><span>الأبيض</span><span>الأسود</span></div>
      <div id="moveNotebookRows" class="move-notebook-rows" role="log" aria-label="النقلات" aria-live="off"></div>
      <section id="moveNotebookReview" class="move-notebook-review" aria-live="polite">
        <span id="moveNotebookReviewStatus">يظهر التحليل بعد انتهاء المباراة.</span>
      </section>`;
    stage.insertBefore(root,stage.firstChild);
  }
  return root;
}
function text(id,value){const n=document.getElementById(id);if(n)n.textContent=String(value??'');}
function showRecords(){
  const node=document.getElementById('moveNotebookRows');
  if(!node)return;
  const follow=node.scrollTop+node.clientHeight>=node.scrollHeight-45;
  const frag=document.createDocumentFragment();
  if(!records.length){
    const empty=document.createElement('p');
    empty.className='move-notebook-empty';
    empty.textContent='ستظهر النقلات هنا عند بداية المباراة.';
    frag.appendChild(empty);
  }
  for(let i=0;i<records.length;i+=2){
    const row=document.createElement('div');
    row.className='move-notebook-row';
    const number=document.createElement('span');
    number.className='move-notebook-index';
    number.textContent=String(Math.floor(i/2)+1);
    row.appendChild(number);
    for(const move of [records[i],records[i+1]]){
      const cell=document.createElement('span');
      cell.className='move-notebook-move';
      if(move){cell.textContent=move.san||move.display||move.uci||'—';cell.title=move.uci||move.san||'';}
      else cell.textContent='—';
      row.appendChild(cell);
    }
    frag.appendChild(row);
  }
  node.replaceChildren(frag);
  if(follow||ended)node.scrollTop=node.scrollHeight;
}
function scoreLabel(loss){
  if(loss<=20)return 'الأفضل';
  if(loss<=50)return 'ممتاز';
  if(loss<=100)return 'جيد';
  if(loss<=180)return 'عدم دقة';
  if(loss<=350)return 'خطأ';
  return 'خطأ فادح';
}
function reviewHtml(summary){
  const n=document.getElementById('moveNotebookReview');
  if(!n)return;
  n.replaceChildren();
  const headline=document.createElement('strong');
  headline.className='move-notebook-review-title';
  headline.textContent='تحليل المباراة · Stockfish';
  n.append(headline);
  const stats=document.createElement('div');
  stats.className='move-notebook-accuracy';
  for(const [label,value] of [['دقة الأبيض',summary.white],['دقة الأسود',summary.black]]){
    const item=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');
    small.textContent=label;strong.textContent=value==null?'—':value+'%';
    item.append(small,strong);stats.append(item);
  }
  n.append(stats);
  const note=document.createElement('p');
  note.className='move-notebook-note';
  note.textContent=`تحليل تقريبي بعمق 9 · ${summary.count} نقلة نصفية${summary.partial?' من بداية المباراة':''} · ${summary.errors} أخطاء و${summary.blunders} أخطاء فادحة.`;
  n.append(note);
  if(summary.highlights.length){
    const title=document.createElement('small');
    title.className='move-notebook-key-title';
    title.textContent='أبرز اللحظات';
    n.append(title);
    for(const item of summary.highlights.slice(0,4)){
      const line=document.createElement('div');
      line.className='move-notebook-key';
      line.textContent=`${Math.ceil(item.ply/2)}${item.ply%2?'':'…'} ${item.san} — ${scoreLabel(item.loss)} · الأفضل ${item.best}`;
      n.append(line);
    }
  }
}
function uciFor(move){
  const direct=String(move.uci||'').toLowerCase();
  if(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(direct))return direct;
  const value=`${move.from_square||move.from||''}${move.to_square||move.to||''}${move.promotion||''}`.toLowerCase();
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(value)?value:'';
}
async function enrichComputerMoves(expected){
  try{
    const {Chess}=await chessModule();
    if(expected!==token||owner!=='computer')return;
    const chess=new Chess();
    const originalLength=records.length;
    const next=records.map(record=>{
      const uci=uciFor(record);
      if(!uci)return record;
      try{
        const options={from:uci.slice(0,2),to:uci.slice(2,4)};
        if(uci[4])options.promotion=uci[4];
        const move=chess.move(options);
        return {...record,san:move?.san||record.display,fen_after:chess.fen()};
      }catch{return record;}
    });
    if(expected===token&&owner==='computer'&&records.length===originalLength){records=next;showRecords();}
  }catch{/* Keep readable coordinate notation when the chess library is offline. */}
}
async function runReview(expected,sourceMoves){
  const review=document.getElementById('moveNotebookReview');
  if(!review)return;
  // Small capped analysis so a long game never locks up the browser.
  const moves=sourceMoves.slice(0,60);
  if(!moves.length){text('moveNotebookReviewStatus','انتهت المباراة دون نقلات قابلة للتحليل.');return;}
  let engine;
  try{
    const valid=moves.every(m=>m.fen_after&&m.uci);
    if(!valid){
      text('moveNotebookReviewStatus','يُعرض سجل النقلات؛ تعذّر تكوين أوضاع صالحة للتحليل.');
      return;
    }
    const {StockfishAnalyzer,scoreToCp}=await import('../analysis/engine.mjs');
    if(expected!==token)return;
    engine=new StockfishAnalyzer();
    activeReview=engine;
    const fens=[START_FEN,...moves.map(m=>m.fen_after)];
    const evals=[];
    for(let i=0;i<fens.length;i++){
      if(expected!==token||!ended)return;
      text('moveNotebookReviewStatus',`تحليل المباراة… ${i+1} / ${fens.length}`);
      evals.push(await engine.analyzeFen(fens[i],9));
    }
    if(expected!==token||!ended)return;
    const lossByColor=[[],[]],highlights=[];
    let errors=0,blunders=0;
    for(let i=0;i<moves.length;i++){
      const before=scoreToCp(evals[i]),actual=-scoreToCp(evals[i+1]);
      const loss=Math.max(0,Math.round(before-actual));
      lossByColor[i%2].push(loss);
      if(loss>180)errors++;
      if(loss>350)blunders++;
      if(loss>=180)highlights.push({ply:i+1,san:moves[i].san||moves[i].display||moves[i].uci,loss,best:evals[i].bestMove||'—'});
    }
    const accuracy=values=>values.length?Math.max(0,Math.min(100,Math.round(100*Math.exp(-(values.reduce((a,b)=>a+b,0)/values.length)/250)))):null;
    reviewHtml({white:accuracy(lossByColor[0]),black:accuracy(lossByColor[1]),count:moves.length,partial:sourceMoves.length>60,errors,blunders,highlights:highlights.sort((a,b)=>b.loss-a.loss)});
  }catch(error){
    if(expected===token&&ended){
      review.replaceChildren();
      const warning=document.createElement('p');
      warning.className='move-notebook-note';
      warning.textContent='تعذر تشغيل التحليل الآلي على هذا الجهاز. ما زال سجل النقلات متاحًا.';
      review.append(warning);
      console.warn('Stockfish match review unavailable',error);
    }
  }finally{
    if(engine){engine.destroy();if(activeReview===engine)activeReview=null;}
  }
}
export function decorateBoardCoordinate(square,index,name){
  if(!square||!name)return;
  if(index%8===0){
    const rank=document.createElement('span');
    rank.className='board-coordinate board-coordinate-rank';
    rank.textContent=name.slice(1);
    rank.setAttribute('aria-hidden','true');
    square.append(rank);
  }
  if(index>=56){
    const file=document.createElement('span');
    file.className='board-coordinate board-coordinate-file';
    file.textContent=name[0];
    file.setAttribute('aria-hidden','true');
    square.append(file);
  }
}
/* Exactly one canonical idle-board painter is shared by homepage and both game exits. */
export function renderApprovedPreview(target){
  if(!target)return;
  const grid=document.createElement('span');
  grid.className='desktop-board-grid';
  const firstRank=['r','n','b','q','k','b','n','r'];
  const version=encodeURIComponent(document.querySelector('meta[name="shatranj-asset-version"]')?.content||'20261012-move-notebook-v2');
  for(let index=0;index<64;index++){
    const row=Math.floor(index/8),col=index%8;
    const square=document.createElement('span');
    square.className=`desktop-board-square ${(row+col)%2?'dark':'light'}`;
    const type=(row===0||row===7)?firstRank[col]:((row===1||row===6)?'p':null);
    if(type){
      const color=row<2?'b':'w';
      const piece=document.createElement('img');
      piece.className='desktop-board-preview-piece';
      if(type==='p'){
        piece.classList.add('chess-pawn');
        piece.style.setProperty('transform','translate(-50%, -50%) scale(.90)','important');
      }
      piece.src=`assets/pieces/${color}${type}.png?v=${version}`;
      piece.alt='';
      piece.draggable=false;
      square.append(piece);
    }
    decorateBoardCoordinate(square,index,`${'abcdefgh'[col]}${8-row}`);
    grid.append(square);
  }
  target.replaceChildren(grid);
}
export function openMoveNotebook(source){
  if(!window.matchMedia('(min-width:901px)').matches)return;
  if(!ensureHost())return;
  activeReview?.destroy();activeReview=null;
  token++;owner=source;records=[];ended=false;
  document.body.classList.add('desktop-move-notebook-active');
  text('moveNotebookTitle','سجل النقلات');
  text('moveNotebookSub',source==='computer'?'مباراة ضد الكمبيوتر':'مباراة مباشرة');
  const review=document.getElementById('moveNotebookReview');
  if(review)review.innerHTML='<span id="moveNotebookReviewStatus">يظهر التحليل بعد انتهاء المباراة.</span>';
  showRecords();
}
export function updateMoveNotebook(source,moves,{finished=false}={}){
  if(owner!==source)return;
  const wasFinished=ended;
  records=(Array.isArray(moves)?moves:[]).map((move,i)=>{
    const uci=uciFor(move);
    return {...move,uci,display:uci?`${uci.slice(0,2)}–${uci.slice(2,4)}${uci[4]?'='+uci[4].toUpperCase():''}`:String(move.san||'—'),ply:i+1};
  });
  showRecords();
  if(source==='computer'&&!finished)void enrichComputerMoves(token);
  if(finished&&!wasFinished){
    ended=true;
    text('moveNotebookTitle','مراجعة المباراة');
    const snapshot=records.slice(),current=token;
    if(source==='computer'){
      void enrichComputerMoves(current).then(()=>{
        if(current===token&&ended)void runReview(current,records.slice());
      });
    }else void runReview(current,snapshot);
  }
}
export function closeMoveNotebook(source){
  if(source&&owner!==source)return;
  owner='';ended=false;token++;records=[];
  activeReview?.destroy();activeReview=null;
  document.body.classList.remove('desktop-move-notebook-active');
  document.getElementById(HOST_ID)?.remove();
}
