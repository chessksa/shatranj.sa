import {
  getSession,
  getCurrentPlayer,
  startMatchmaking,
  pollMatchmaking,
  cancelMatchmaking,
  getGameState,
  getGameMoves,
  submitMove,
  subscribeGame,
  graceEnd,
  resignGame,
  offerDraw,
  respondDraw,
  timeoutGame,
  supabaseClient,
} from '../play/api.js?v=20261018-live-speed-v3';
import { remainingAt, formatClock, isFinalMinute } from '../play/clock.mjs';
import { normalizeGameState } from '../play/state.mjs';
import { preloadChessEngine, previewMove } from '../play/instant-move.mjs?v=20261018-move-speed-v1';
import { moveFromRecord, moveFromPositions, setLastMoveClass } from '../play/last-move.mjs?v=20261018-last-move-v1';
import { playBoardMoveSound } from '../board/move-sound.mjs?v=20261013-movesound-v1';
import { renderCapturedPieces } from '../play/captured-pieces.mjs?v=20261018-premove-review-v1';
import { decorateBoardCoordinate, renderApprovedPreview, openMoveNotebook, updateMoveNotebook, closeMoveNotebook } from './move-notebook.mjs?v=20261012-notebook-aligned-v13';

// index.html preloads the canonical desktop stylesheet. Keep one fallback for
// standalone imports, never add another copy during a normal homepage refresh.
if(!document.querySelector('link[data-inline-play]')){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.dataset.inlinePlay='1';
  const inlineVersion=encodeURIComponent(document.querySelector('meta[name="shatranj-asset-version"]')?.content||'20261012-desktop-canonical-v4');
  css.href=new URL(`./inline-play.css?v=${inlineVersion}`,import.meta.url).href;
  document.head.insertBefore(css,document.querySelector('link[href*="site-charcoal-theme.css"]'));
}

const desktop=window.matchMedia('(min-width:901px)');
const START_FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PIECE_ROOT='assets/pieces/';
const validMinutes=[5,10,15];

let selectedMinutes=10;
let currentPlayer=null;
let currentGame=null;
let orientation='w';
let selectedSquare=null;
let queuedPremove=null;
let renderedPosition=new Map();
let displayedFen=null;
let lastMove=null;
let polling=false;
let pollTimer=null;
let unsubscribeGame=null;
let refreshPromise=null;
let clockTimer=null;
let fallbackSyncTimer=null;
let submittingMove=false;
let actionInFlight=false;
let timeoutRequested=false;
let active=false;
let playGeneration=0;
let mounted=false;
let identityReady=false;

let preview=null;
let board=null;
let panel=null;
let opponentName=null;
let opponentMeta=null;
let ownAvatar=null;
let ownAvatarFallback=null;
let opponentAvatar=null;
let opponentAvatarFallback=null;
let avatarWatcher=null;
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
  return `${PIECE_ROOT}${color}${type}.png?v=20261012-extracted-photo-pieces-v3`;
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
  document.querySelectorAll('[data-tune-action="play"]').forEach(link=>{
    link.setAttribute('href','#play');
  });
}

function setActiveNav(id){
  document.querySelectorAll('.desktop-home-nav-link').forEach(link=>{
    const selected=link.dataset.desktopNav===id;
    link.classList.toggle('active',selected);
    if(selected)link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
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
  renderApprovedPreview(target);
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
        <span class="inline-play-player-avatar" aria-label="الصورة الرمزية للخصم">
          <img id="inlinePlayOpponentAvatar" alt="صورة الخصم" hidden>
          <span id="inlinePlayOpponentFallback" class="inline-play-avatar-fallback" aria-hidden="true">♟</span>
        </span>
        <div class="inline-play-player-copy">
          <a id="inlinePlayOpponentName" class="inline-play-player-name">بانتظار الخصم</a>
          <span id="inlinePlayOpponentMeta" class="inline-play-player-meta">—</span>
          <span id="inlinePlayOpponentCaptured" class="inline-play-captured">—</span>
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
        <span class="inline-play-player-avatar" aria-label="الصورة الرمزية للاعب">
          <img id="inlinePlayPlayerAvatar" alt="صورتك الشخصية" hidden>
          <span id="inlinePlayPlayerFallback" class="inline-play-avatar-fallback" aria-hidden="true">♟</span>
        </span>
        <div class="inline-play-player-copy">
          <a id="inlinePlayPlayerName" class="inline-play-player-name">جارٍ التحميل</a>
          <span id="inlinePlayPlayerMeta" class="inline-play-player-meta">النقاط —</span>
          <span id="inlinePlayPlayerCaptured" class="inline-play-captured">—</span>
        </div>
        <time id="inlinePlayClockWhite" class="inline-play-clock" datetime="PT10M">10:00</time>
      </section>
      <div class="inline-play-spacer" aria-hidden="true"></div>`;
    column.appendChild(panel);
  }

  opponentName=panel.querySelector('#inlinePlayOpponentName');
  opponentMeta=panel.querySelector('#inlinePlayOpponentMeta');
  ownAvatar=panel.querySelector('#inlinePlayPlayerAvatar');
  ownAvatarFallback=panel.querySelector('#inlinePlayPlayerFallback');
  opponentAvatar=panel.querySelector('#inlinePlayOpponentAvatar');
  opponentAvatarFallback=panel.querySelector('#inlinePlayOpponentFallback');
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
    const isSelected=Number(button.dataset.inlineMinutes)===selectedMinutes;
    button.classList.toggle('active',isSelected);
    button.setAttribute('aria-pressed',String(isSelected));
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
  displayedFen=fen;
  board.dataset.positionFen=fen;
  const fragment=document.createDocumentFragment();
  for(const [displayIndex,squareName] of orderedSquares(color).entries()){
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
    decorateBoardCoordinate(square,displayIndex,squareName);
    fragment.appendChild(square);
  }
  board.replaceChildren(fragment);
  updateSelectableSquares();
  setLastMoveClass(board,lastMove);
  renderCaptureIndicators();
}


function playerInitial(value){
  const first=String(value||'').trim().replace(/^@/,'').charAt(0);
  return first ? first.toUpperCase() : '♟';
}

function avatarPublicUrl(playerId){
  if(!playerId)return '';
  try{
    return supabaseClient().storage.from('avatars')
      .getPublicUrl(`${playerId}/avatar.webp`).data.publicUrl||'';
  }catch{return '';}
}

// A failed/missing image never leaves the broken-image glyph in the player card.
function setPlayerAvatar(image,fallback,src,{playerId='',initial='♟'}={}){
  if(!image||!fallback)return;
  fallback.textContent=playerInitial(initial);
  const resolved=String(src||'');
  if(image.dataset.avatarPlayer===String(playerId)&&image.dataset.avatarSource===resolved)return;
  image.dataset.avatarPlayer=String(playerId);
  image.dataset.avatarSource=resolved;
  image.hidden=true;
  fallback.hidden=false;
  image.onload=()=>{
    if(image.dataset.avatarSource!==resolved)return;
    image.hidden=false;
    fallback.hidden=true;
  };
  image.onerror=()=>{
    if(image.dataset.avatarSource!==resolved)return;
    image.hidden=true;
    fallback.hidden=false;
  };
  if(resolved)image.src=resolved;
  else image.removeAttribute('src');
}

function syncOwnAvatar(){
  if(!currentPlayer)return;
  const header=document.getElementById('headerMemberAvatar');
  // Reuse the account's working image URL, including legacy-avatar fallback.
  const src=header?.getAttribute('src')||avatarPublicUrl(currentPlayer.id);
  setPlayerAvatar(ownAvatar,ownAvatarFallback,src,{
    playerId:currentPlayer.id,initial:currentPlayer.name
  });
}
function watchOwnAvatar(){
  avatarWatcher?.disconnect();
  const header=document.getElementById('headerMemberAvatar');
  if(header){
    avatarWatcher=new MutationObserver(syncOwnAvatar);
    avatarWatcher.observe(header,{attributes:true,attributeFilter:['src','hidden']});
  }
  syncOwnAvatar();
}

function updateIdentity(){
  if(!currentPlayer||!playerName||!playerMeta) return;
  playerName.textContent=currentPlayer.name||'اللاعب';
  playerName.href=`player.html?id=${encodeURIComponent(currentPlayer.id)}`;
  const city=currentPlayer.city?` · ${currentPlayer.city}`:'';
  playerMeta.textContent=`النقاط ${Number(currentPlayer.rating??1500)}${city}`;
  syncOwnAvatar();
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
  setPlayerAvatar(opponentAvatar,opponentAvatarFallback,'',{initial:'♟'});
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
  setPlayerAvatar(opponentAvatar,opponentAvatarFallback,avatarPublicUrl(id),{playerId:id,initial:name||'الخصم'});
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

function turnMessage(){
  if(!playableGame()) return '';
  const mine=gameColor();
  if(!mine) return 'تعذر تحديد مقعد اللاعب — افتح المباراة مجددًا';
  return currentGame.turn===mine?'دورك الآن — انقر القطعة ثم مربع النقل':'بانتظار نقلة الخصم';
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

async function refreshMoveNotebook(){
  if(!currentGame?.id) return;
  const gameId=currentGame.id;
  try{
    const moves=await getGameMoves(gameId);
    if(currentGame?.id===gameId){
      updateMoveNotebook('online',moves,{finished:!playableGame()});
      if(Number(currentGame.ply)===moves.length){
        lastMove=moveFromRecord(moves[moves.length-1])||lastMove;
        setLastMoveClass(board,lastMove);
      }
    }
  }catch(error){
    console.warn('تعذر تحميل سجل النقلات',error);
  }
}

async function refreshGame(){
  if(!active||!currentGame?.id||submittingMove) return null;
  if(refreshPromise) return refreshPromise;
  const gameId=currentGame.id;
  const generation=playGeneration;
  refreshPromise=(async()=>{
    const latest=normalizeGameState(await getGameState(gameId));
    // Never let a late API response repaint an idle homepage after navigation.
    if(!active||generation!==playGeneration||currentGame?.id!==gameId)return null;
    if(!latest) throw new Error('تعذر استعادة حالة المباراة');
    if(submittingMove||latest.ply<currentGame.ply||
       (['finished','cancelled'].includes(currentGame.status)&&!['finished','cancelled'].includes(latest.status))) return currentGame;
    const previous=currentGame;
    const changed=previous?.ply!==latest.ply||previous?.fen!==latest.fen;
    const ended=previous?.status!==latest.status;
    if(changed)lastMove=Number(latest.ply)===Number(previous?.ply)+1
      ?moveFromPositions(previous?.fen,latest.fen):null;
    currentGame=latest;
    orientation=gameColor()||orientation;
    updateCurrentRatingFromGame();
    updateOpponent();
    if(changed||displayedFen!==latest.fen){
      selectedSquare=null;
      renderPosition(currentGame.fen,orientation);
      if(changed) playBoardMoveSound(previous?.fen,currentGame.fen);
    }else{
      updateSelectableSquares();
    }
    updateControls();
    renderClocks();
    if(changed||ended) void refreshMoveNotebook();
    if(changed||ended){
      const message=gameFinishedMessage()||turnMessage();
      if(message) setStatus(message,{error:!gameColor()&&!ended});
    }
    return currentGame;
  })().finally(()=>{refreshPromise=null;});
  return refreshPromise;
}

let fallbackSyncActive=false;
function stopFallbackSync(){
  fallbackSyncActive=false;
  if(fallbackSyncTimer) clearTimeout(fallbackSyncTimer);
  fallbackSyncTimer=null;
}
function startFallbackSync(){
  stopFallbackSync();
  fallbackSyncActive=true;
  const tick=async()=>{
    if(!fallbackSyncActive) return;
    if(active&&playableGame()&&document.visibilityState!=='hidden'&&!submittingMove){
      await refreshGame().catch(()=>{});
    }
    if(!fallbackSyncActive) return;
    const waiting=Boolean(currentGame&&currentGame.turn!==gameColor());
    fallbackSyncTimer=setTimeout(tick,waiting?1200:3500);
  };
  fallbackSyncTimer=setTimeout(tick,1200);
}

function applyLiveGameRow(row){
  if(!active||submittingMove||!currentGame||!row||row.id!==currentGame.id||
     typeof row.fen!=='string'||!Number.isInteger(Number(row.ply))||
     Number(row.ply)<currentGame.ply||
     (['finished','cancelled'].includes(currentGame.status)&&!['finished','cancelled'].includes(row.status))) return false;
  const previous=currentGame;
  currentGame=normalizeGameState({...previous,...row});
  orientation=gameColor()||orientation;
  const changed=previous.ply!==currentGame.ply||previous.fen!==currentGame.fen;
  if(changed)lastMove=Number(currentGame.ply)===Number(previous.ply)+1
    ?moveFromPositions(previous.fen,currentGame.fen):null;
  if(changed||displayedFen!==currentGame.fen){
    selectedSquare=null;
    renderPosition(currentGame.fen,orientation);
    if(changed) playBoardMoveSound(previous.fen,currentGame.fen);
    void refreshMoveNotebook();
  }else{
    updateSelectableSquares();
  }
  updateControls();
  renderClocks();
  setStatus(gameFinishedMessage()||turnMessage());
  return true;
}

function beginSubscription(gameId){
  if(unsubscribeGame) unsubscribeGame();
  unsubscribeGame=subscribeGame(gameId,(type,row)=>{
    if(type==='game'&&applyLiveGameRow(row))return;
    if(!submittingMove) void refreshGame().catch(()=>{});
  });
}

function stopSubscription(){
  if(unsubscribeGame) unsubscribeGame();
  unsubscribeGame=null;
}

async function openGame(gameId){
  if(!active)return;
  const generation=playGeneration;
  stopPolling();
  const state=normalizeGameState(await getGameState(gameId));
  if(!active||generation!==playGeneration)return;
  if(!state) throw new Error('تعذر تحميل المباراة');
  currentGame=state;
  lastMove=null;
  orientation=gameColor()||'w';
  openMoveNotebook('online');
  updateHistoryGame(gameId);
  setStatus('تم العثور على الخصم');
  updateCurrentRatingFromGame();
  updateOpponent();
  renderPosition(currentGame.fen,orientation);
  updateControls();
  setStatus(turnMessage(),{error:!gameColor()});
  void refreshMoveNotebook();
  if(!active||generation!==playGeneration)return;
  startClockLoop();
  beginSubscription(gameId);
  startFallbackSync();
  void preloadChessEngine();
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
    closeMoveNotebook('online');
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
  const promotion=sourcePiece?.type==='p'&&(target.endsWith('8')||target.endsWith('1'))?'q':null;
  const preview=previewMove({fen:currentGame.fen,from:source,to:target,promotion});
  if(preview?.legal===false){
    updateSelectableSquares();
    setStatus('نقلة غير قانونية',{error:true});
    return;
  }
  const gameId=currentGame.id;
  const expectedPly=currentGame.ply;
  const previousLastMove=lastMove;
  submittingMove=true;
  updateSelectableSquares();
  if(preview?.legal){
    lastMove={from:source,to:target};
    renderPosition(preview.fen,orientation);
  }
  try{
    const response=await submitMove({gameId,expectedPly,from:source,to:target,promotion});
    if(!active||currentGame?.id!==gameId)return;
    if(response?.game?.id===gameId && Number(response.game.ply)>=expectedPly+1){
      const previous=currentGame;
      currentGame=normalizeGameState({...previous,...response.game});
      orientation=gameColor()||orientation;
      lastMove={from:source,to:target};
      if(displayedFen!==currentGame.fen) renderPosition(currentGame.fen,orientation);
      else setLastMoveClass(board,lastMove);
      playBoardMoveSound(previous?.fen,currentGame.fen);
      updateCurrentRatingFromGame();
      updateOpponent();
      updateControls();
      renderClocks();
      void refreshMoveNotebook();
      setStatus(gameFinishedMessage()||turnMessage());
    }else{
      submittingMove=false;
      await refreshGame();
    }
  }catch(error){
    if(!active||currentGame?.id!==gameId)return;
    lastMove=previousLastMove;
    if(displayedFen!==currentGame.fen) renderPosition(currentGame.fen,orientation);
    else setLastMoveClass(board,lastMove);
    submittingMove=false;
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
  watchOwnAvatar();
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

async function enterInlinePlay({gameId=null,minutes=selectedMinutes,autoStart=false}={}){
  if(!desktop.matches) return;
  window.dispatchEvent(new CustomEvent('desktop:inline-computer-stop'));
  normalizePlayLinks();
  if(!ensurePanel()||!ensureBoard()) return;

  document.body.classList.add('desktop-inline-play-active');
  active=true;
  const generation=++playGeneration;
  updatePlayRoute(true);
  const home=document.getElementById('desktopDashboardHome');
  const view=document.getElementById('desktopDashboardView');
  if(home) home.hidden=true;
  if(view) view.hidden=true;
  panel.hidden=false;
  setActiveNav('play');

  bindPanelOnce();
  if(currentPlayer)watchOwnAvatar();
  setSelectedMinutes(minutes);
  resetOpponent();
  renderPosition(currentGame?.fen||START_FEN,currentGame?orientation:'w');
  updateControls();

  if(!await initializeIdentity()||!active||generation!==playGeneration) return;

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
    if(autoStart)void beginSearch(minutes);
  }
}

function exitInlinePlay(){
  if(!active) return;
  avatarWatcher?.disconnect();
  avatarWatcher=null;
  active=false;
  ++playGeneration;
  document.body.classList.remove('desktop-inline-play-active');
  if(polling){
    cancelMatchmaking().catch(()=>{});
    stopPolling();
  }
  stopClockLoop();
  stopFallbackSync();
  stopSubscription();
  closeMoveNotebook('online');
  selectedSquare=null;
  lastMove=null;
  if(panel) panel.hidden=true;
  const home=document.getElementById('desktopDashboardHome');
  if(home) home.hidden=false;
  restoreStaticBoard();
  updatePlayRoute(false);
}

function handleEntryClick(event){
  if(!desktop.matches) return;
  const quickPlay=event.target.closest('[data-tune-action="play"]');
  const previewClick=event.target.closest('#homeBoardPreview');
  // Spectator owns this exact board; neither the visitor nor its closing
  // controls may start matchmaking by clicking its squares.
  if(previewClick?.classList.contains('inline-tournament-spectator'))return;
  const computerBoardClick=event.target.closest('#inlineComputerBoardGrid')
    || document.getElementById('homeBoardPreview')?.classList.contains('inline-computer-active')
    || location.hash==='#computer';
  const puzzleBoardClick=event.target.closest('#inlinePuzzleBoardGrid')
    || document.getElementById('homeBoardPreview')?.classList.contains('inline-puzzle-active')
    || location.hash==='#puzzles';
  const learnBoardClick=event.target.closest('#inlineLearnBoardGrid')
    || document.getElementById('homeBoardPreview')?.classList.contains('inline-learn-active')
    || location.hash==='#learn';
  const variantBoardClick=event.target.closest('#variantBoard')
    || document.getElementById('homeBoardPreview')?.classList.contains('inline-variants-active')
    || location.hash==='#variants';

  /* Active computer, puzzle, lesson, and variant boards own their clicks.
     Never open standard matchmaking when moving a piece in another mode. */
  if(previewClick&&(computerBoardClick||puzzleBoardClick||learnBoardClick||variantBoardClick)) return;
  if(active&&previewClick) return;

  if(quickPlay||previewClick){
    event.preventDefault();
    if(quickPlay) event.stopPropagation();
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
window.addEventListener('desktop:inline-play-open',event=>{
  const minutes=Number(event.detail?.minutes);
  void enterInlinePlay({minutes:validMinutes.includes(minutes)?minutes:10,autoStart:!!event.detail?.autoStart});
});

window.addEventListener('pagehide',()=>{
  if(polling) cancelMatchmaking().catch(()=>{});
  stopPolling();
  stopClockLoop();
  stopSubscription();
  closeMoveNotebook('online');
});

boot();
