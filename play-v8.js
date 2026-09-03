import {Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE} from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const files = ['a','b','c','d','e','f','g','h'];
const ranks = [8,7,6,5,4,3,2,1];
const cfg = window.SHATRANJ_CONFIG?.supabase || {};
const supabase = cfg.enabled && cfg.url && cfg.anonKey
  ? createClient(cfg.url, cfg.anonKey)
  : null;

const $ = (id) => document.getElementById(id);
const matchmakingScreen = $('matchmakingScreen');
const matchmakingSetup = $('matchmakingSetup');
const matchmakingWaiting = $('matchmakingWaiting');
const matchmakingFound = $('matchmakingFound');
const matchmakingProfile = $('matchmakingProfile');
const matchmakingError = $('matchmakingError');
const matchmakingWaitingError = $('matchmakingWaitingError');
const matchmakingRange = $('matchmakingRange');
const matchmakingElapsed = $('matchmakingElapsed');
const matchmakingOpponent = $('matchmakingOpponent');
const cancelMatchmakingBtn = $('cancelMatchmaking');
const gamePage = $('gamePage');
const leaveBtn = $('leaveBtn');
const leaveText = $('leaveText');
const reportBtn = $('reportBtn');
const gameToast = $('gameToast');
const reportModal = $('reportModal');
const reportReason = $('reportReason');
const submitReportBtn = $('submitReport');
const cancelReportBtn = $('cancelReport');
const reportMessage = $('reportMessage');

const boardEl = $('board');
const leftEl = $('coordsLeft');
const bottomEl = $('coordsBottom');
const topClockEl = $('topClock');
const bottomClockEl = $('bottomClock');
const topNameEl = $('topName');
const bottomNameEl = $('bottomName');
const topLocationEl = $('topLocation');
const bottomLocationEl = $('bottomLocation');
const topRatingEl = $('topRating');
const bottomRatingEl = $('bottomRating');
const topAvatarEl = $('topAvatar');
const bottomAvatarEl = $('bottomAvatar');
const resignBtn = $('resignBtn');
const flipBoardEl = $('flipBoard');
const drawOfferBtn = $('drawOffer');

let matchmakingTimer = null;
let matchmakingPolling = false;
let matchmakingStartedAt = 0;

let liveGameId = null;
let seatKey = null;
let myColor = null;
let game = null;
let cmBoard = null;
let serverState = null;
let lastServerUpdate = '';
let selected = null;
let legalTargets = [];
let flipped = false;
let orientationInitialized = false;
let moveBusy = false;
let refreshBusy = false;
let timeoutClaimBusy = false;
let drawPromptKey = '';
let finishedAlerted = false;
let gamePollTimer = null;

function firstRow(data){
  return Array.isArray(data) ? (data[0] || null) : data;
}

function toast(message, ms=2200){
  gameToast.textContent = message;
  gameToast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=>{ gameToast.hidden=true; }, ms);
}

function showMatchmakingState(state){
  matchmakingScreen.hidden = false;
  gamePage.hidden = true;
  matchmakingSetup.hidden = state !== 'setup';
  matchmakingWaiting.hidden = state !== 'waiting';
  matchmakingFound.hidden = state !== 'found';
  leaveText.textContent = 'رجوع';
}

function showGamePage(){
  matchmakingScreen.hidden = true;
  gamePage.hidden = false;
  leaveText.textContent = 'مغادرة المباراة';
}

function formatElapsed(seconds){
  const s = Math.max(0, Number(seconds) || 0);
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(Math.floor(s%60)).padStart(2,'0');
}

async function loadMyProfile(){
  const { data, error } = await supabase.rpc('get_my_player_profile');
  const profile = firstRow(data);
  if(error || !profile){
    matchmakingProfile.textContent = 'أكمل ملف اللاعب أولًا من الصفحة الرئيسية.';
    return null;
  }
  matchmakingProfile.textContent = `${profile.name} — تصنيف ${profile.rating}`;
  return profile;
}

async function enterMatchedGame(row){
  if(!row?.game_id || !row?.seat_key || !row?.color) return;
  sessionStorage.setItem('shatranj_live_game_id', row.game_id);
  sessionStorage.setItem('shatranj_live_game_code', row.game_code || '');
  sessionStorage.setItem('shatranj_live_seat_key', row.seat_key);
  sessionStorage.setItem('shatranj_live_color', row.color);
  sessionStorage.removeItem('shatranj_matchmaking_active');
  sessionStorage.removeItem('shatranj_matchmaking_started_at');
  clearInterval(matchmakingTimer);
  showMatchmakingState('found');
  matchmakingOpponent.textContent = row.opponent_name
    ? `خصمك: ${row.opponent_name}`
    : 'الخصم جاهز — جارٍ فتح المباراة...';
  setTimeout(()=>{
    location.href = `play-v8.html?game=${encodeURIComponent(row.game_id)}`;
  }, 850);
}

function updateWaitingUI(row){
  const fallback = Math.max(0,(Date.now()-matchmakingStartedAt)/1000);
  const seconds = Number(row?.waited_seconds ?? fallback);
  matchmakingElapsed.textContent = formatElapsed(seconds);
  matchmakingRange.textContent = `±${Number(row?.rating_window || 150)}`;
}

async function pollMatchmaking(){
  if(matchmakingPolling || !supabase) return;
  matchmakingPolling = true;
  try{
    const { data, error } = await supabase.rpc('poll_matchmaking');
    if(error) throw error;
    const row = firstRow(data);
    if(!row) return;
    if(row.state === 'matched'){
      await enterMatchedGame(row);
      return;
    }
    if(row.state === 'waiting'){
      updateWaitingUI(row);
      return;
    }
    sessionStorage.removeItem('shatranj_matchmaking_active');
    clearInterval(matchmakingTimer);
    showMatchmakingState('setup');
  }catch(err){
    console.error(err);
    matchmakingWaitingError.textContent = 'تعذر متابعة البحث. سنحاول من جديد تلقائيًا.';
  }finally{
    matchmakingPolling = false;
  }
}

function beginPolling(){
  clearInterval(matchmakingTimer);
  matchmakingTimer = setInterval(pollMatchmaking, 1500);
}

async function startMatchmaking(minutes){
  matchmakingError.textContent = '';
  matchmakingWaitingError.textContent = '';
  showMatchmakingState('waiting');
  matchmakingStartedAt = Date.now();
  sessionStorage.setItem('shatranj_matchmaking_active','1');
  sessionStorage.setItem('shatranj_matchmaking_started_at', String(matchmakingStartedAt));
  updateWaitingUI({waited_seconds:0,rating_window:150});

  try{
    const { data, error } = await supabase.rpc('start_matchmaking',{p_minutes:Number(minutes)});
    if(error) throw error;
    const row = firstRow(data);
    if(row?.state === 'matched'){
      await enterMatchedGame(row);
      return;
    }
    if(row?.state !== 'waiting') throw new Error('unexpected matchmaking state');
    updateWaitingUI(row);
    beginPolling();
  }catch(err){
    console.error(err);
    sessionStorage.removeItem('shatranj_matchmaking_active');
    clearInterval(matchmakingTimer);
    showMatchmakingState('setup');
    matchmakingError.textContent = String(err?.message || '').includes('active game exists')
      ? 'لديك مباراة نشطة بالفعل.'
      : 'تعذر بدء البحث عن خصم. حاول مرة أخرى.';
  }
}

async function cancelMatchmaking(){
  clearInterval(matchmakingTimer);
  sessionStorage.removeItem('shatranj_matchmaking_active');
  sessionStorage.removeItem('shatranj_matchmaking_started_at');
  try{
    await supabase.rpc('cancel_matchmaking');
  }catch(err){
    console.error(err);
  }
  showMatchmakingState('setup');
  matchmakingWaitingError.textContent = '';
}

function pieceSVG(type,color){
  const cls = color === 'w' ? 'white' : 'black';
  return `<div class="piece ${cls} piece-${type}"><img class="piece-image" src="assets/pieces/${color}${type}.png?v=20260903-4" alt="" aria-hidden="true" draggable="false"></div>`;
}

function renderCoords(){
  leftEl.innerHTML='';
  bottomEl.innerHTML='';
  const shownRanks = flipped ? [...ranks].reverse() : ranks;
  const shownFiles = flipped ? [...files].reverse() : files;
  shownRanks.forEach(n=>{ const div=document.createElement('div'); div.textContent=n; leftEl.appendChild(div); });
  shownFiles.forEach(f=>{ const div=document.createElement('div'); div.textContent=f; bottomEl.appendChild(div); });
}

function formatClock(ms){
  const safe = Math.max(0, Math.ceil((Number(ms)||0)/1000));
  return String(Math.floor(safe/60)).padStart(2,'0') + ':' + String(safe%60).padStart(2,'0');
}

function calculatedClocks(){
  if(!serverState || !game) return {w:0,b:0};
  let w = Number(serverState.white_time_ms || 0);
  let b = Number(serverState.black_time_ms || 0);
  if(serverState.status === 'active' && serverState.turn_started_at){
    const elapsed = Math.max(0, Date.now() - new Date(serverState.turn_started_at).getTime());
    if(game.turn()==='w') w=Math.max(0,w-elapsed);
    else b=Math.max(0,b-elapsed);
  }
  return {w,b};
}

function colorInfo(color){
  if(color==='w'){
    return {
      id: serverState.white_player_id,
      name: serverState.white_name,
      rating: serverState.white_rating,
      location: [serverState.white_city,serverState.white_region].filter(Boolean).join(' — ')
    };
  }
  return {
    id: serverState.black_player_id,
    name: serverState.black_name,
    rating: serverState.black_rating,
    location: [serverState.black_city,serverState.black_region].filter(Boolean).join(' — ')
  };
}

function setPlayerProfileLink(el, info){
  if(info?.id){
    el.href=`player.html?id=${encodeURIComponent(info.id)}`;
    el.removeAttribute('aria-disabled');
  }else{
    el.removeAttribute('href');
    el.setAttribute('aria-disabled','true');
  }
}

function renderPlayers(){
  const topColor = myColor === 'w' ? 'b' : 'w';
  const bottomColor = myColor;
  const top = colorInfo(topColor);
  const bottom = colorInfo(bottomColor);

  topNameEl.textContent = top.name || 'الخصم';
  setPlayerProfileLink(topNameEl, top);
  topRatingEl.textContent = top.rating ?? '—';
  topLocationEl.textContent = top.location || '—';
  bottomNameEl.textContent = bottom.name || 'أنت';
  setPlayerProfileLink(bottomNameEl, bottom);
  bottomRatingEl.textContent = bottom.rating ?? '—';
  bottomLocationEl.textContent = bottom.location || '—';

  topAvatarEl.classList.toggle('light', topColor==='w');
  bottomAvatarEl.classList.toggle('light', bottomColor==='w');
}

function updateClockUI(){
  if(!serverState || !game) return;
  const clocks = calculatedClocks();
  const topColor = myColor === 'w' ? 'b' : 'w';
  const bottomColor = myColor;
  const topMs = clocks[topColor];
  const bottomMs = clocks[bottomColor];

  topClockEl.textContent = formatClock(topMs);
  bottomClockEl.textContent = formatClock(bottomMs);
  topClockEl.classList.toggle('danger',topMs<=60000);
  bottomClockEl.classList.toggle('danger',bottomMs<=60000);
  topClockEl.style.outline = serverState.status==='active' && game.turn()===topColor
    ? '2px solid rgba(64,207,103,.65)' : 'none';
  bottomClockEl.style.outline = serverState.status==='active' && game.turn()===bottomColor
    ? '2px solid rgba(64,207,103,.65)' : 'none';

  const activeMs = clocks[game.turn()];
  if(serverState.status==='active' && activeMs<=0 && !timeoutClaimBusy) claimTimeout();
}

function ensureCmStyles(){
  if(!document.querySelector('link[data-cm-chessboard-core]')){
    const core=document.createElement('link');
    core.rel='stylesheet';
    core.href='https://cdn.jsdelivr.net/npm/cm-chessboard@8/assets/chessboard.css';
    core.dataset.cmChessboardCore='1';
    document.head.appendChild(core);
  }
  if(!document.querySelector('link[data-cm-chessboard-shatranj]')){
    const theme=document.createElement('link');
    theme.rel='stylesheet';
    theme.href='cm-chessboard-shatranj.css?v=20260903-1';
    theme.dataset.cmChessboardShatranj='1';
    document.head.appendChild(theme);
  }
}

function ensureBoard(){
  if(cmBoard) return cmBoard;
  ensureCmStyles();
  boardEl.className='cm-board-host';
  const orientation=flipped ? COLOR.black : COLOR.white;
  cmBoard=new Chessboard(boardEl,{
    position:game ? game.fen() : '8/8/8/8/8/8/8/8',
    orientation,
    responsive:true,
    assetsUrl:'https://cdn.jsdelivr.net/npm/cm-chessboard@8/assets/',
    style:{
      cssClass:'shatranj',
      showCoordinates:false,
      borderType:BORDER_TYPE.none,
      pieces:{file:'pieces/staunty.svg',tileSize:40},
      animationDuration:180
    }
  });
  cmBoard.enableMoveInput(handleBoardInput,myColor==='b' ? COLOR.black : COLOR.white);
  return cmBoard;
}

function renderBoard(){
  if(!game) return;
  const board=ensureBoard();
  const orientation=flipped ? COLOR.black : COLOR.white;
  if(board.getOrientation()!==orientation) board.setOrientation(orientation,false);
  board.setPosition(game.fen(),false);
  updateClockUI();
}

function localResult(){
  if(game.in_checkmate()) return game.turn()==='w' ? '0-1' : '1-0';
  if(game.in_draw()) return '1/2-1/2';
  return null;
}

function handleBoardInput(event){
  if(event.type===INPUT_EVENT_TYPE.moveInputStarted){
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
    if(game.turn()!==myColor) return false;
    const piece=game.get(event.squareFrom);
    return Boolean(piece && piece.color===myColor && piece.color===game.turn());
  }

  if(event.type===INPUT_EVENT_TYPE.validateMoveInput){
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
    if(game.turn()!==myColor) return false;
    const legal=game.moves({square:event.squareFrom,verbose:true});
    const candidate=legal.find(move=>move.to===event.squareTo);
    if(!candidate) return false;

    const move=game.move({from:event.squareFrom,to:event.squareTo,promotion:'q'});
    if(!move) return false;
    moveBusy=true;

    Promise.resolve().then(async()=>{
      try{
        const { error }=await supabase.rpc('submit_live_move',{
          p_game_id:liveGameId,
          p_seat_key:seatKey,
          p_from:move.from,
          p_to:move.to,
          p_promotion:move.promotion || null,
          p_new_fen:game.fen(),
          p_san:move.san,
          p_result:localResult()
        });
        if(error) throw error;
      }catch(err){
        console.error(err);
        toast('تعذر اعتماد الحركة. أُعيدت الرقعة إلى حالة الخادم.');
      }finally{
        moveBusy=false;
        await refreshLiveGame(true);
      }
    });
    return true;
  }

  return true;
}

async function claimTimeout(){
  if(timeoutClaimBusy || !liveGameId || !seatKey) return;
  timeoutClaimBusy=true;
  try{
    const { error } = await supabase.rpc('claim_live_timeout',{p_game_id:liveGameId,p_seat_key:seatKey});
    if(error) throw error;
    await refreshLiveGame(true);
  }catch(err){
    console.error(err);
  }finally{
    timeoutClaimBusy=false;
  }
}

async function maybeHandleDrawOffer(){
  if(!serverState?.draw_offer_by || serverState.status!=='active') return;
  if(serverState.draw_offer_by===myColor) return;
  const key=`${serverState.draw_offer_by}|${serverState.updated_at}`;
  if(drawPromptKey===key) return;
  drawPromptKey=key;

  setTimeout(async()=>{
    const accept=confirm('الخصم يعرض التعادل. هل توافق؟');
    try{
      const { error }=await supabase.rpc('respond_live_draw',{
        p_game_id:liveGameId,
        p_seat_key:seatKey,
        p_accept:accept
      });
      if(error) throw error;
      await refreshLiveGame(true);
    }catch(err){
      console.error(err);
      toast('تعذر إرسال رد التعادل.');
    }
  },80);
}

function finishedMessage(result){
  if(result==='1/2-1/2') return 'انتهت المباراة بالتعادل.';
  const won = (result==='1-0' && myColor==='w') || (result==='0-1' && myColor==='b');
  return won ? 'انتهت المباراة — فزت.' : 'انتهت المباراة — فاز الخصم.';
}

function applyServerState(row, force=false){
  if(!row) return;
  const changed = force || row.updated_at !== lastServerUpdate;
  serverState=row;

  if(!orientationInitialized){
    flipped = myColor==='b';
    orientationInitialized=true;
    renderCoords();
  }

  renderPlayers();

  if(changed){
    try{
      game = new Chess(row.fen);
    }catch(err){
      console.error(err);
      toast('تعذر تحميل وضع الرقعة.');
      return;
    }
    selected=null;
    legalTargets=[];
    lastServerUpdate=row.updated_at || '';
    renderBoard();
  }else{
    updateClockUI();
  }

  maybeHandleDrawOffer();

  if(row.status==='finished' && !finishedAlerted){
    finishedAlerted=true;
    clearInterval(gamePollTimer);
    setTimeout(()=>alert(finishedMessage(row.result)),120);
  }
}

async function refreshLiveGame(force=false){
  if(refreshBusy || !liveGameId) return;
  refreshBusy=true;
  try{
    const { data, error } = await supabase.rpc('get_live_game_state',{p_game_id:liveGameId});
    if(error) throw error;
    const row=firstRow(data);
    if(!row) throw new Error('game not found');
    applyServerState(row,force);
  }catch(err){
    console.error(err);
    toast('تعذر تحديث المباراة.');
  }finally{
    refreshBusy=false;
  }
}

async function recoverSeatIfNeeded(){
  seatKey=sessionStorage.getItem('shatranj_live_seat_key');
  myColor=sessionStorage.getItem('shatranj_live_color');
  const storedGame=sessionStorage.getItem('shatranj_live_game_id');

  if(seatKey && ['w','b'].includes(myColor) && (!storedGame || storedGame===liveGameId)) return true;

  const challengeId = new URLSearchParams(location.search).get('challenge') || sessionStorage.getItem('shatranj_friend_challenge_id');
  if(challengeId){
    const { data: challengeData, error: challengeError } = await supabase.rpc('get_my_challenge_game_access',{p_challenge_id:challengeId});
    const challengeRow = firstRow(challengeData);
    if(!challengeError && challengeRow?.state==='accepted' && challengeRow.game_id===liveGameId && challengeRow.seat_key && ['w','b'].includes(challengeRow.color)){
      seatKey=challengeRow.seat_key;
      myColor=challengeRow.color;
      sessionStorage.setItem('shatranj_live_game_id',challengeRow.game_id);
      sessionStorage.setItem('shatranj_live_game_code',challengeRow.game_code || '');
      sessionStorage.setItem('shatranj_live_seat_key',challengeRow.seat_key);
      sessionStorage.setItem('shatranj_live_color',challengeRow.color);
      sessionStorage.removeItem('shatranj_friend_challenge_id');
      return true;
    }
  }

  const { data, error }=await supabase.rpc('poll_matchmaking');
  if(error) return false;
  const row=firstRow(data);

  if(row?.state!=='matched' || row.game_id!==liveGameId || !row.seat_key) return false;

  seatKey=row.seat_key;
  myColor=row.color;
  sessionStorage.setItem('shatranj_live_game_id',row.game_id);
  sessionStorage.setItem('shatranj_live_game_code',row.game_code || '');
  sessionStorage.setItem('shatranj_live_seat_key',row.seat_key);
  sessionStorage.setItem('shatranj_live_color',row.color);
  return true;
}

async function openLiveGame(){
  const recovered=await recoverSeatIfNeeded();
  if(!recovered){
    toast('تعذر التحقق من مقعدك في المباراة.');
    setTimeout(()=>{ location.href='play-v8.html'; },1300);
    return;
  }

  showGamePage();
  await refreshLiveGame(true);
  gamePollTimer=setInterval(()=>{
    if(!document.hidden && serverState?.status!=='finished') refreshLiveGame(false);
  },1200);
}

resignBtn.addEventListener('click',async()=>{
  if(!serverState || serverState.status!=='active') return;
  if(!confirm('هل تريد الاستسلام؟')) return;
  try{
    const { error }=await supabase.rpc('resign_live_game',{p_game_id:liveGameId,p_seat_key:seatKey});
    if(error) throw error;
    await refreshLiveGame(true);
  }catch(err){
    console.error(err);
    toast('تعذر تنفيذ الاستسلام.');
  }
});

drawOfferBtn.addEventListener('click',async()=>{
  if(!serverState || serverState.status!=='active') return;
  if(serverState.draw_offer_by){
    toast(serverState.draw_offer_by===myColor ? 'عرض التعادل مرسل بالفعل.' : 'لديك عرض تعادل من الخصم.');
    return;
  }
  try{
    const { error }=await supabase.rpc('offer_live_draw',{p_game_id:liveGameId,p_seat_key:seatKey});
    if(error) throw error;
    toast('تم إرسال عرض التعادل.');
    await refreshLiveGame(true);
  }catch(err){
    console.error(err);
    toast('تعذر إرسال عرض التعادل.');
  }
});

flipBoardEl.addEventListener('click',()=>{
  flipped=!flipped;
  selected=null;
  legalTargets=[];
  renderCoords();
  renderBoard();
});

document.querySelectorAll('[data-minutes]').forEach(btn=>{
  btn.addEventListener('click',()=>startMatchmaking(btn.dataset.minutes));
});

cancelMatchmakingBtn.addEventListener('click',cancelMatchmaking);

leaveBtn.addEventListener('click',async()=>{
  if(!matchmakingWaiting.hidden) await cancelMatchmaking();
  location.href='index.html';
});

reportBtn.addEventListener('click',()=>{
  if(!liveGameId || gamePage.hidden){
    toast('يمكن إرسال البلاغ أثناء المباراة فقط.');
    return;
  }
  reportReason.value='';
  reportMessage.textContent='';
  reportMessage.className='report-message';
  reportModal.hidden=false;
  setTimeout(()=>reportReason.focus(),0);
});

cancelReportBtn.addEventListener('click',()=>{
  reportModal.hidden=true;
  reportMessage.textContent='';
});

submitReportBtn.addEventListener('click',async()=>{
  if(!liveGameId){
    reportMessage.textContent='لا توجد مباراة مرتبطة بالبلاغ.';
    return;
  }
  const reason=reportReason.value.trim();
  if(reason.length<3){
    reportMessage.textContent='اكتب سبب البلاغ بوضوح.';
    return;
  }
  submitReportBtn.disabled=true;
  reportMessage.textContent='جارٍ إرسال البلاغ...';
  reportMessage.className='report-message';
  try{
    const { error }=await supabase.rpc('create_game_report',{p_game_id:liveGameId,p_reason:reason});
    if(error) throw error;
    reportMessage.textContent='تم إرسال البلاغ للإدارة.';
    reportMessage.className='report-message ok';
    setTimeout(()=>{ reportModal.hidden=true; },900);
  }catch(err){
    console.error(err);
    reportMessage.textContent='تعذر إرسال البلاغ. حاول مرة أخرى.';
  }finally{
    submitReportBtn.disabled=false;
  }
});

setInterval(()=>{
  if(!gamePage.hidden) updateClockUI();
  if(!matchmakingWaiting.hidden && matchmakingStartedAt){
    matchmakingElapsed.textContent=formatElapsed((Date.now()-matchmakingStartedAt)/1000);
  }
},250);

async function init(){
  if(!supabase){
    alert('تعذر الاتصال بخدمة اللعب.');
    return;
  }

  const { data:{session} }=await supabase.auth.getSession();
  if(!session){
    location.href='index.html#register';
    return;
  }

  const params = new URLSearchParams(location.search);
  liveGameId = params.get('game');

  if(liveGameId){
    await openLiveGame();
    return;
  }

  showMatchmakingState('setup');
  await loadMyProfile();

  if(sessionStorage.getItem('shatranj_matchmaking_active')==='1'){
    matchmakingStartedAt=Number(sessionStorage.getItem('shatranj_matchmaking_started_at')) || Date.now();
    showMatchmakingState('waiting');
    await pollMatchmaking();
    if(!matchmakingWaiting.hidden) beginPolling();
  }
}

init();
