import {
  getSession,
  getCurrentPlayer,
  startMatchmaking,
  pollMatchmaking,
  cancelMatchmaking,
  getGameState,
  submitMove,
  subscribeGame,
  graceEnd,
  resignGame,
  offerDraw,
  respondDraw,
  timeoutGame,
} from '../play/api.js';
import { remainingAt, formatClock, isFinalMinute } from '../play/clock.mjs';
import { normalizeGameState } from '../play/state.mjs';

const css=document.createElement('link');
css.rel='stylesheet';
css.href=new URL('./inline-play.css?v=20260918-inline-play1',import.meta.url).href;
document.head.appendChild(css);

const desktop=window.matchMedia('(min-width:901px)');
const START_FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PIECE_ROOT='assets/pieces/';
const validMinutes=[5,10,15];

let selectedMinutes=10;
let currentPlayer=null;
let currentGame=null;
let orientation='w';
let selectedSquare=null;
let renderedPosition=new Map();
let polling=false;
let pollTimer=null;
let unsubscribeGame=null;
let refreshPromise=null;
let clockTimer=null;
let submittingMove=false;
let actionInFlight=false;
let timeoutRequested=false;
let active=false;
let mounted=false;
let identityReady=false;

let preview=null;
let board=null;
let panel=null;
let opponentName=null;
let opponentMeta=null;
let searchStatus=null;
let topClock=null;
let bottomClock=null;
let playerName=null;
let playerMeta=null;
let searchTools=null;
let searchButton=null;
let graceButton=null;
let drawButton=null;
let resignButton=null;
let quickTimeButtons=[];

function pieceAsset(color,type){
  return `${PIECE_ROOT}${color}${type}.png`;
}

function parseFen(fen){
  const placement=String(fen||START_FEN).split(/\s+/)[0];
  const rows=placement.split('/');
  if(rows.length!==8) throw new Error('Invalid FEN');
  const position=new Map();
  rows.forEach((row,rowIndex)=>{
    let file=0;
    for(const token of row){
      if(/\d/.test(token)){
        file+=Number(token);
        continue;
      }
      const color=token===token.toUpperCase()?'w':'b';
      const type=token.toLowerCase();
      if(!'pnbrqk'.includes(type)||file>7) throw new Error('Invalid FEN');
      position.set(`${String.fromCharCode(97+file)}${8-rowIndex}`,{color,type});
      file+=1;
    }
    if(file!==8) throw new Error('Invalid FEN');
  });
  return position;
}

function orderedSquares(color){
  const files=color==='b'?['h','g','f','e','d','c','b','a']:['a','b','c','d','e','f','g','h'];
  const ranks=color==='b'?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
  return ranks.flatMap(rank=>files.map(file=>`${file}${rank}`));
}

function normalizePlayLinks(){
  document.querySelectorAll('[data-desktop-nav="play"],[data-tune-action="play"]').forEach(link=>{
    link.setAttribute('href','#play');
  });
}

function setActiveNav(id){
  document.querySelectorAll('.desktop-home-nav-link').forEach(link=>{
    link.classList.toggle('active',link.dataset.desktopNav===id);
  });
}

function updateHistoryGame(gameId=null){
  const url=new URL(location.href);
  if(gameId) url.searchParams.set('game',gameId);
  else url.searchParams.delete('game');
  url.searchParams.delete('auto');
  history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
}

function updatePlayRoute(enabled){
  const url=new URL(location.href);
  if(enabled){
    url.hash='#play';
  }else{
    url.hash='';
    url.searchParams.delete('game');
    url.searchParams.delete('auto');
  }
  history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
}

function restoreStaticBoard(){
  const target=document.getElementById('homeBoardPreview');
  if(!target) return;
  target.classList.remove('inline-play-active');
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

function ensurePanel(){
  const column=document.getElementById('desktopDashboardColumn');
  if(!column) return false;
  panel=document.getElementById('desktopInlinePlayPanel');
  if(!panel){
    panel=document.createElement('section');
    panel.id='desktopInlinePlayPanel';
    panel.className='desktop-inline-play-panel';
    panel.hidden=true;
    panel.innerHTML=`
      <section class="inline-play-player-card inline-play-opponent-card">
        <div class="inline-play-player-copy">
          <a id="inlinePlayOpponentName" class="inline-play-player-name">بانتظار الخصم</a>
          <span id="inlinePlayOpponentMeta" class="inline-play-player-meta">—</span>
          <span id="inlinePlayStatus" class="inline-play-status" aria-live="polite">اختر وقت المباراة ثم ابدأ البحث</span>
        </div>
        <time id="inlinePlayClockBlack" class="inline-play-clock" datetime="PT10M">10:00</time>
      </section>

      <section id="inlinePlaySearchTools" class="inline-play-search-tools">
        <span class="inline-play-time-label">وقت المباراة</span>
        <div class="inline-play-times" aria-label="زمن المباراة">
          <button type="button" data-inline-minutes="5">5 دقائق</button>
          <button type="button" data-inline-minutes="10">10 دقائق</button>
          <button type="button" data-inline-minutes="15">15 دقيقة</button>
        </div>
        <button id="inlinePlaySearch" class="inline-play-search-button" type="button" disabled>ابحث عن خصم</button>
      </section>

      <section class="inline-play-actions" aria-label="أدوات المباراة">
        <button id="inlinePlayGrace" class="inline-play-grace" type="button" hidden>إنهاء <span>5</span></button>
        <button id="inlinePlayDraw" type="button" disabled>تعادل</button>
        <button id="inlinePlayResign" class="inline-play-danger" type="button" disabled>استسلام</button>
      </section>

      <section class="inline-play-player-card inline-play-current-card">
        <div class="inline-play-player-copy">
          <a id="inlinePlayPlayerName" class="inline-play-player-name">أنت</a>
          <span id="inlinePlayPlayerMeta" class="inline-play-player-meta">النقاط —</span>
        </div>
        <time id="inlinePlayClockWhite" class="inline-play-clock" datetime="PT10M">10:00</time>
      </section>
      <div class="inline-play-spacer" aria-hidden="true"></div>`;
    column.appendChild(panel);
  }

  opponentName=panel.querySelector('#inlinePlayOpponentName');
  opponentMeta=panel.querySelector('#inlinePlayOpponentMeta');
  searchStatus=panel.querySelector('#inlinePlayStatus');
  topClock=panel.querySelector('#inlinePlayClockBlack');
  bottomClock=panel.querySelector('#inlinePlayClockWhite');
  playerName=panel.querySelector('#inlinePlayPlayerName');
  playerMeta=panel.querySelector('#inlinePlayPlayerMeta');
  searchTools=panel.querySelector('#inlinePlaySearchTools');
  searchButton=panel.querySelector('#inlinePlaySearch');
  graceButton=panel.querySelector('#inlinePlayGrace');
  drawButton=panel.querySelector('#inlinePlayDraw');
  resignButton=panel.querySelector('#inlinePlayResign');
  quickTimeButtons=[...panel.querySelectorAll('[data-inline-minutes]')];
  return true;
}

function ensureBoard(){
  preview=document.getElementById('homeBoardPreview');
  if(!preview) return false;
  preview.classList.add('inline-play-active');
  let grid=preview.querySelector('#inlinePlayBoardGrid');
  if(!grid){
    preview.replaceChildren();
    grid=document.createElement('div');
    grid.id='inlinePlayBoardGrid';
    grid.className='desktop-board-grid inline-play-grid';
    grid.setAttribute('role','grid');
    grid.setAttribute('aria-label','رقعة الشطرنج');
    preview.appendChild(grid);
  }
  board=grid;
  return true;
}

function setStatus(message,{searching=false,error=false}={}){
  if(!searchStatus) return;
  searchStatus.textContent=message;
  searchStatus.classList.toggle('searching',searching);
  searchStatus.classList.toggle('error',error);
}

function setSelectedMinutes(minutes){
  selectedMinutes=validMinutes.includes(Number(minutes))?Number(minutes):10;
  quickTimeButtons.forEach(button=>{
    button.classList.toggle('active',Number(button.dataset.inlineMinutes)===selectedMinutes);
  });
  if(!currentGame&&topClock&&bottomClock){
    const value=selectedMinutes*60*1000;
    topClock.textContent=formatClock(value);
    bottomClock.textContent=formatClock(value);
  }
}

function renderPosition(fen=START_FEN,color=orientation){
  if(!board) return;
  renderedPosition=parseFen(fen);
  const fragment=document.createDocumentFragment();
  for(const squareName of orderedSquares(color)){
    const file=squareName.charCodeAt(0)-97;
    const rank=Number(squareName[1]);
    const square=document.createElement('button');
    square.type='button';
    square.className=`desktop-board-square inline-play-square ${(file+rank)%2===1?'light':'dark'}`;
    square.dataset.square=squareName;
    square.setAttribute('role','gridcell');
    square.setAttribute('aria-label',squareName);
    const piece=renderedPosition.get(squareName);
    if(piece){
      const image=document.createElement('img');
      image.className='inline-play-piece';
      image.src=pieceAsset(piece.color,piece.type);
      image.alt='';
      image.draggable=false;
      square.appendChild(image);
    }
    fragment.appendChild(square);
  }
  board.replaceChildren(fragment);
  updateSelectableSquares();
}

function updateIdentity(){
  if(!currentPlayer||!playerName||!playerMeta) return;
  playerName.textContent=currentPlayer.name||'أنت';
  playerName.href=`player.html?id=${encodeURIComponent(currentPlayer.id)}`;
  const city=currentPlayer.city?` · ${currentPlayer.city}`:'';
  playerMeta.textContent=`النقاط ${Number(currentPlayer.rating??1500)}${city}`;
}

function gameColor(){
  if(!currentGame||!currentPlayer) return null;
  if(currentGame.white_player_id===currentPlayer.id) return 'w';
  if(currentGame.black_player_id===currentPlayer.id) return 'b';
  return null;
}

function updateCurrentRatingFromGame(){
  if(!currentPlayer||!currentGame) return;
  const mine=gameColor();
  const rating=mine==='w'?currentGame.white_rating:mine==='b'?currentGame.black_rating:null;
  if(Number.isFinite(Number(rating))){
    currentPlayer.rating=Number(rating);
    updateIdentity();
  }
}

function resetOpponent(){
  if(opponentName){
    opponentName.textContent='بانتظار الخصم';
    opponentName.removeAttribute('href');
  }
  if(opponentMeta) opponentMeta.textContent='—';
}

function updateOpponent(){
  if(!currentGame||!currentPlayer||!opponentName||!opponentMeta) return;
  const mine=gameColor();
  const id=mine==='w'?currentGame.black_player_id:currentGame.white_player_id;
  const name=mine==='w'?currentGame.black_name:currentGame.white_name;
  const rating=mine==='w'?currentGame.black_rating:currentGame.white_rating;
  opponentName.textContent=name||'الخصم';
  if(id) opponentName.href=`player.html?id=${encodeURIComponent(id)}`;
  opponentMeta.textContent=`النقاط ${Number(rating??1500)}`;
}

function opponentOfferedDraw(){
  return Boolean(currentGame?.draw_offered_by&&currentPlayer&&currentGame.draw_offered_by!==currentPlayer.id);
}

function ownDrawOfferPending(){
  return Boolean(currentGame?.draw_offered_by&&currentPlayer&&currentGame.draw_offered_by===currentPlayer.id);
}

function playableGame(){
  return Boolean(currentGame&&['matched','active'].includes(currentGame.status));
}

function updateControls(){
  if(!panel) return;
  const playable=playableGame();
  const finished=Boolean(currentGame&&!playable);
  panel.classList.toggle('has-game',playable);
  if(searchTools) searchTools.hidden=playable;
  if(resignButton) resignButton.disabled=!playable||actionInFlight;
  if(drawButton){
    drawButton.disabled=!playable||actionInFlight||ownDrawOfferPending();
    drawButton.textContent=opponentOfferedDraw()?'رد على التعادل':ownDrawOfferPending()?'تم عرض التعادل':'تعادل';
  }
  if(searchButton){
    searchButton.hidden=playable;
    searchButton.disabled=!identityReady||actionInFlight;
    if(finished&&!polling) searchButton.textContent='مباراة جديدة';
  }
  quickTimeButtons.forEach(button=>button.disabled=polling||playable||actionInFlight);
}

function gameFinishedMessage(){
  if(!currentGame) return '';
  if(currentGame.status==='cancelled') return 'تم إنهاء المباراة بلا خصم نقاط';
  if(currentGame.status!=='finished') return '';
  if(currentGame.result==='1/2-1/2') return 'انتهت المباراة بالتعادل';
  const mine=gameColor();
  const won=(mine==='w'&&currentGame.result==='1-0')||(mine==='b'&&currentGame.result==='0-1');
  return won?'فزت بالمباراة':'انتهت المباراة بالخسارة';
}

async function requestTimeout(){
  if(timeoutRequested||!playableGame()) return;
  timeoutRequested=true;
  try{
    await timeoutGame(currentGame.id);
    await refreshGame();
    const message=gameFinishedMessage();
    if(message) setStatus(message);
  }catch(error){
    setStatus(error.message||'تعذر حسم انتهاء الوقت',{error:true});
  }finally{
    if(playableGame()) timeoutRequested=false;
  }
}

function renderClocks(){
  if(!currentGame||!topClock||!bottomClock) return;
  const clocks=remainingAt(currentGame,Date.now());
  const mine=gameColor();
  const topValue=mine==='b'?clocks.white:clocks.black;
  const bottomValue=mine==='b'?clocks.black:clocks.white;
  topClock.textContent=formatClock(topValue);
  bottomClock.textContent=formatClock(bottomValue);
  topClock.classList.toggle('final-minute',isFinalMinute(topValue));
  bottomClock.classList.toggle('final-minute',isFinalMinute(bottomValue));

  const graceRemaining=currentGame.status==='matched'&&currentGame.grace_until_ms
    ?Math.max(0,currentGame.grace_until_ms-Date.now())
    :0;
  if(graceButton){
    graceButton.hidden=graceRemaining<=0||currentGame.ply>0;
    if(!graceButton.hidden) graceButton.querySelector('span').textContent=String(Math.max(1,Math.ceil(graceRemaining/1000)));
  }

  if(playableGame()){
    const activeRemaining=currentGame.turn==='w'?clocks.white:clocks.black;
    if(activeRemaining<=0) void requestTimeout();
  }
}

function startClockLoop(){
  if(clockTimer) clearInterval(clockTimer);
  renderClocks();
  clockTimer=setInterval(renderClocks,200);
}

function stopClockLoop(){
  if(clockTimer) clearInterval(clockTimer);
  clockTimer=null;
}

function updateSelectableSquares(){
  if(!board) return;
  const myColor=gameColor();
  const canMove=Boolean(playableGame()&&myColor&&currentGame.turn===myColor&&!submittingMove&&!actionInFlight);
  board.querySelectorAll('.inline-play-square').forEach(square=>{
    const piece=renderedPosition.get(square.dataset.square);
    square.classList.toggle('selected',square.dataset.square===selectedSquare);
    square.classList.toggle('movable',canMove&&Boolean(selectedSquare||piece?.color===myColor));
  });
}

async function refreshGame(){
  if(!currentGame?.id) return null;
  if(refreshPromise) return refreshPromise;
  refreshPromise=(async()=>{
    currentGame=normalizeGameState(await getGameState(currentGame.id));
    orientation=gameColor()||orientation;
    updateCurrentRatingFromGame();
    updateOpponent();
    renderPosition(currentGame.fen,orientation);
    updateControls();
    renderClocks();
    const message=gameFinishedMessage();
    if(message) setStatus(message);
    return currentGame;
  })().finally(()=>{refreshPromise=null;});
  return refreshPromise;
}

function beginSubscription(gameId){
  if(unsubscribeGame) unsubscribeGame();
  unsubscribeGame=subscribeGame(gameId,()=>{
    refreshGame().catch(()=>setStatus('تعذر تحديث المباراة',{error:true}));
  });
}

function stopSubscription(){
  if(unsubscribeGame) unsubscribeGame();
  unsubscribeGame=null;
}

async function openGame(gameId){
  stopPolling();
  const state=normalizeGameState(await getGameState(gameId));
  if(!state) throw new Error('تعذر تحميل المباراة');
  currentGame=state;
  orientation=gameColor()||'w';
  updateHistoryGame(gameId);
  setStatus('تم العثور على الخصم');
  updateCurrentRatingFromGame();
  updateOpponent();
  renderPosition(currentGame.fen,orientation);
  updateControls();
  startClockLoop();
  beginSubscription(gameId);
}

function stopPolling(){
  polling=false;
  if(pollTimer) clearTimeout(pollTimer);
  pollTimer=null;
  if(searchButton){
    searchButton.classList.remove('searching');
    if(!currentGame||playableGame()) searchButton.textContent='ابحث عن خصم';
  }
  updateControls();
}

async function handleMatchResult(result){
  if(result?.queue_status==='matched'&&result?.game_id){
    await openGame(result.game_id);
    return true;
  }
  return false;
}

async function pollOnce(){
  if(!polling) return;
  try{
    if(await handleMatchResult(await pollMatchmaking())) return;
  }catch(error){
    stopPolling();
    setStatus(error.message||'تعذر متابعة البحث',{error:true});
    return;
  }
  pollTimer=setTimeout(pollOnce,1200);
}

async function beginSearch(minutes=selectedMinutes){
  if(polling||playableGame()||!identityReady) return;
  if(currentGame&&!playableGame()){
    currentGame=null;
    stopSubscription();
    stopClockLoop();
    selectedSquare=null;
    resetOpponent();
    renderPosition(START_FEN,'w');
    setSelectedMinutes(selectedMinutes);
    updateHistoryGame(null);
  }
  setSelectedMinutes(minutes);
  polling=true;
  searchButton.classList.add('searching');
  searchButton.textContent='إلغاء البحث';
  setStatus('جاري البحث عن خصم',{searching:true});
  updateControls();
  try{
    if(await handleMatchResult(await startMatchmaking(selectedMinutes))) return;
    pollTimer=setTimeout(pollOnce,1000);
  }catch(error){
    stopPolling();
    setStatus(error.message||'تعذر بدء البحث',{error:true});
  }
}

async function toggleSearch(){
  if(!polling) return beginSearch(selectedMinutes);
  try{await cancelMatchmaking();}catch{}
  stopPolling();
  setStatus('تم إلغاء البحث');
}

async function handleSquareClick(event){
  const square=event.target.closest('.inline-play-square');
  if(!square||submittingMove||actionInFlight||!currentGame) return;
  const myColor=gameColor();
  if(!myColor||currentGame.turn!==myColor||!playableGame()) return;
  const target=square.dataset.square;
  const targetPiece=renderedPosition.get(target);
  if(!selectedSquare){
    if(targetPiece?.color!==myColor) return;
    selectedSquare=target;
    updateSelectableSquares();
    return;
  }
  if(target===selectedSquare){
    selectedSquare=null;
    updateSelectableSquares();
    return;
  }
  if(targetPiece?.color===myColor){
    selectedSquare=target;
    updateSelectableSquares();
    return;
  }

  const source=selectedSquare;
  const sourcePiece=renderedPosition.get(source);
  selectedSquare=null;
  submittingMove=true;
  updateSelectableSquares();
  const reachesPromotionRank=sourcePiece?.type==='p'&&(target.endsWith('8')||target.endsWith('1'));
  try{
    await submitMove({
      gameId:currentGame.id,
      expectedPly:currentGame.ply,
      from:source,
      to:target,
      promotion:reachesPromotionRank?'q':null,
    });
    await refreshGame();
    if(currentGame.status!=='finished') setStatus('المباراة جارية');
  }catch(error){
    await refreshGame().catch(()=>{});
    setStatus(error.code==='illegal_move'?'نقلة غير قانونية':(error.message||'تعذر تنفيذ النقلة'),{error:true});
  }finally{
    submittingMove=false;
    updateSelectableSquares();
  }
}

async function handleGraceEnd(){
  if(!currentGame||actionInFlight||graceButton.hidden) return;
  actionInFlight=true;
  updateControls();
  try{
    await graceEnd(currentGame.id);
    await refreshGame();
    if(currentGame.status==='cancelled'){
      setStatus('تم إنهاء المباراة بلا خصم نقاط');
      updateControls();
    }
  }catch(error){
    setStatus(error.message||'انتهت مهلة الإنهاء',{error:true});
    await refreshGame().catch(()=>{});
  }finally{
    actionInFlight=false;
    updateControls();
  }
}

async function handleResign(){
  if(!currentGame||actionInFlight||resignButton.disabled) return;
  if(!window.confirm('هل تريد الاستسلام؟')) return;
  actionInFlight=true;
  updateControls();
  try{
    await resignGame(currentGame.id);
    await refreshGame();
  }catch(error){
    setStatus(error.message||'تعذر الاستسلام',{error:true});
  }finally{
    actionInFlight=false;
    updateControls();
  }
}

async function handleDraw(){
  if(!currentGame||actionInFlight||drawButton.disabled) return;
  actionInFlight=true;
  updateControls();
  try{
    if(opponentOfferedDraw()){
      const accept=window.confirm('هل تريد قبول عرض التعادل؟\nاختر إلغاء لرفض العرض.');
      await respondDraw(currentGame.id,accept);
      setStatus(accept?'تم قبول التعادل':'تم رفض التعادل');
    }else{
      await offerDraw(currentGame.id);
      setStatus('تم إرسال عرض التعادل');
    }
    await refreshGame();
  }catch(error){
    setStatus(error.message||'تعذر تنفيذ طلب التعادل',{error:true});
  }finally{
    actionInFlight=false;
    updateControls();
  }
}

async function initializeIdentity(){
  if(identityReady&&currentPlayer) return true;
  if(searchButton) searchButton.disabled=true;
  let session;
  try{
    session=await getSession();
  }catch(error){
    setStatus(error.message||'تعذر التحقق من تسجيل الدخول',{error:true});
    return false;
  }
  if(!session){
    setStatus('سجل الدخول أولًا لبدء اللعب',{error:true});
    return false;
  }
  try{
    currentPlayer=await getCurrentPlayer();
  }catch(error){
    setStatus(error.message||'تعذر تحميل بيانات اللاعب',{error:true});
    return false;
  }
  if(!currentPlayer||currentPlayer.is_synthetic){
    setStatus('يلزم حساب لاعب صالح',{error:true});
    return false;
  }
  identityReady=true;
  updateIdentity();
  if(searchButton) searchButton.disabled=false;
  updateControls();
  return true;
}

function bindPanelOnce(){
  if(mounted) return;
  board.addEventListener('click',handleSquareClick);
  searchButton.addEventListener('click',toggleSearch);
  graceButton.addEventListener('click',handleGraceEnd);
  resignButton.addEventListener('click',handleResign);
  drawButton.addEventListener('click',handleDraw);
  quickTimeButtons.forEach(button=>button.addEventListener('click',()=>setSelectedMinutes(Number(button.dataset.inlineMinutes))));
  mounted=true;
}

async function enterInlinePlay({gameId=null}={}){
  if(!desktop.matches) return;
  window.dispatchEvent(new CustomEvent('desktop:inline-computer-stop'));
  normalizePlayLinks();
  if(!ensurePanel()||!ensureBoard()) return;

  document.body.classList.add('desktop-inline-play-active');
  active=true;
  updatePlayRoute(true);
  const home=document.getElementById('desktopDashboardHome');
  const view=document.getElementById('desktopDashboardView');
  if(home) home.hidden=true;
  if(view) view.hidden=true;
  panel.hidden=false;
  setActiveNav('play');

  bindPanelOnce();
  setSelectedMinutes(selectedMinutes);
  resetOpponent();
  renderPosition(currentGame?.fen||START_FEN,currentGame?orientation:'w');
  updateControls();

  if(!await initializeIdentity()) return;

  const requested=gameId||new URLSearchParams(location.search).get('game');
  if(requested){
    try{
      await openGame(requested);
    }catch(error){
      setStatus(error.message||'تعذر فتح المباراة',{error:true});
    }
    return;
  }

  if(currentGame?.id){
    try{
      await openGame(currentGame.id);
    }catch(error){
      currentGame=null;
      setStatus(error.message||'تعذر استعادة المباراة',{error:true});
    }
  }else{
    setStatus('اختر وقت المباراة ثم ابدأ البحث');
  }
}

function exitInlinePlay(){
  if(!active) return;
  active=false;
  document.body.classList.remove('desktop-inline-play-active');
  if(polling){
    cancelMatchmaking().catch(()=>{});
    stopPolling();
  }
  stopClockLoop();
  stopSubscription();
  selectedSquare=null;
  if(panel) panel.hidden=true;
  const home=document.getElementById('desktopDashboardHome');
  if(home) home.hidden=false;
  restoreStaticBoard();
  updatePlayRoute(false);
}

function handleEntryClick(event){
  if(!desktop.matches) return;
  const playNav=event.target.closest('[data-desktop-nav="play"]');
  const quickPlay=event.target.closest('[data-tune-action="play"]');
  const previewClick=event.target.closest('#homeBoardPreview');
  const computerBoardClick=event.target.closest('#inlineComputerBoardGrid')
    || document.getElementById('homeBoardPreview')?.classList.contains('inline-computer-active')
    || location.hash==='#computer';

  /* Computer mode owns every click inside its board. Never hand those
     clicks to normal matchmaking/play navigation. */
  if(previewClick&&computerBoardClick) return;
  if(active&&previewClick) return;

  if(playNav||quickPlay||previewClick){
    event.preventDefault();
    if(playNav||quickPlay) event.stopPropagation();
    void enterInlinePlay();
    return;
  }

  if(active){
    const nav=event.target.closest('[data-desktop-nav]');
    if(nav&&nav.dataset.desktopNav!=='play') exitInlinePlay();
  }
}

function boot(){
  if(!desktop.matches) return;
  normalizePlayLinks();
  const observer=new MutationObserver(()=>normalizePlayLinks());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',handleEntryClick,true);

  const requestedGameId=new URLSearchParams(location.search).get('game');
  const requestedPlayMode=location.hash==='#play';
  if(requestedGameId||requestedPlayMode){
    let attempts=0;
    const timer=setInterval(()=>{
      attempts+=1;
      if(document.getElementById('homeBoardPreview')&&document.getElementById('desktopDashboardColumn')){
        clearInterval(timer);
        void enterInlinePlay({gameId:requestedGameId||null});
      }else if(attempts>80){
        clearInterval(timer);
      }
    },50);
  }
}

window.addEventListener('desktop:inline-play-stop',()=>exitInlinePlay());

window.addEventListener('pagehide',()=>{
  if(polling) cancelMatchmaking().catch(()=>{});
  stopPolling();
  stopClockLoop();
  stopSubscription();
});

boot();
