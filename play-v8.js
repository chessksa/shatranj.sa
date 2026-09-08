import {Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE} from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';
import {Markers} from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/extensions/markers/Markers.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { inferLastMoveFromFens, latestMoveFromServerMoves } from './last-move-highlight.mjs?v=20260908-3';

const LAST_MOVE_MARKER = { class: 'marker-frame-last-move', slice: 'markerFrame', position: 'above' };

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
const moveHintsEl = $('moveHints');
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
const topAvatarImgEl = $('topAvatarImg');
const bottomAvatarImgEl = $('bottomAvatarImg');
const resignBtn = $('resignBtn');
const topPlayerCard = $('topPlayerCard');
const bottomPlayerCard = $('bottomPlayerCard');
const gameActions = $('gameActions');
const endGraceBtn = $('endGraceBtn');
const endGraceCountdownEl = $('endGraceCountdown');
const drawOfferBtn = $('drawOffer');
const tournamentGameBadge = $('tournamentGameBadge');
const tournamentGameNameEl = $('tournamentGameName');
const tournamentGameRoundEl = $('tournamentGameRound');

let matchmakingTimer = null;
let matchmakingPolling = false;
let matchmakingStartedAt = 0;

let liveGameId = null;
let spectatorMode = false;
let seatKey = null;
let myColor = null;
let authUserId = null;
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
let graceDeadline = 0;
let graceRequestBusy = false;
let gameCancelledHandled = false;
let reviewFens = [];
let reviewIndex = -1;
let moveReviewMode = false;
let graceStateLoaded = false;
let lastMove = null;
let ignoreNextLastMoveInference = false;

function firstRow(data){
  return Array.isArray(data) ? (data[0] || null) : data;
}


function tournamentRoundLabel(round,maxRound){
  const current=Number(round)||1;
  const last=Number(maxRound)||current;
  if(current===last) return 'النهائي';
  if(current===last-1) return 'نصف النهائي';
  if(current===last-2) return 'ربع النهائي';
  return `الدور ${current}`;
}

async function loadTournamentGameContext(){
  const badge=tournamentGameBadge;
  const sideHeadStack=document.querySelector('.side-head-stack');
  if(sideHeadStack && badge && badge.parentElement!==sideHeadStack) sideHeadStack.appendChild(badge);
  if(!badge || !liveGameId || !supabase) return;
  document.documentElement.classList.remove('tournament-match');
  document.body.classList.remove('tournament-match');
  badge.hidden = true;
  try{
    const {data,error}=await supabase.rpc('get_live_game_tournament_context',{p_game_id:liveGameId});
    if(error) throw error;
    const row=firstRow(data);
    if(!row?.tournament_name) return;
    document.documentElement.classList.add('tournament-match');
    document.body.classList.add('tournament-match');
    if(tournamentGameNameEl) tournamentGameNameEl.textContent=String(row.tournament_name);
    if(tournamentGameRoundEl) tournamentGameRoundEl.textContent=tournamentRoundLabel(row.round_no,row.max_round);
    badge.hidden = false;
  }catch(err){
    console.warn('تعذر تحميل بيانات بطولة المباراة',err);
    document.documentElement.classList.remove('tournament-match');
    document.body.classList.remove('tournament-match');
    badge.hidden = true;
    }
}

function toast(message, ms=2200){
  gameToast.textContent = message;
  gameToast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=>{ gameToast.hidden=true; }, ms);
}

function reviewStorageKey(){
  return `shatranj_live_review_${liveGameId || 'unknown'}`;
}

function restoreMoveReviewHistory(){
  if(!liveGameId || reviewFens.length) return;
  try{
    const raw=sessionStorage.getItem(reviewStorageKey());
    const parsed=raw ? JSON.parse(raw) : [];
    if(Array.isArray(parsed)) reviewFens=parsed.filter((fen)=>typeof fen==='string' && fen.trim()).slice(-512);
  }catch(err){
    console.warn('تعذر استعادة سجل الحركات المحلي',err);
    reviewFens=[];
  }
  reviewIndex=reviewFens.length-1;
}

function rememberLiveFen(fen){
  if(!fen) return;
  restoreMoveReviewHistory();
  if(reviewFens[reviewFens.length-1]!==fen){
    reviewFens.push(fen);
    if(reviewFens.length>512) reviewFens=reviewFens.slice(-512);
  }
  reviewIndex=reviewFens.length-1;
  try{
    sessionStorage.setItem(reviewStorageKey(),JSON.stringify(reviewFens));
  }catch(err){
    console.warn('تعذر حفظ سجل الحركات المحلي',err);
  }
  updateMoveReviewControls();
}

function isReviewingPast(){
  return moveReviewMode && reviewIndex>=0 && reviewIndex<reviewFens.length-1;
}

function updateMoveReviewControls(){
  if(!moveReviewMode || !endGraceBtn) return;
  const back=endGraceBtn.querySelector('[data-review-direction="-1"]');
  const forward=endGraceBtn.querySelector('[data-review-direction="1"]');
  const backDisabled=reviewIndex <= 0;
  const forwardDisabled=reviewIndex >= reviewFens.length - 1;
  back?.classList.toggle('disabled',backDisabled);
  forward?.classList.toggle('disabled',forwardDisabled);
  back?.setAttribute('aria-disabled',String(backDisabled));
  forward?.setAttribute('aria-disabled',String(forwardDisabled));
}

function showMoveReviewMode(){
  if(!endGraceBtn || gameActions?.classList.contains('game-result-actions')) return;
  if(!moveReviewMode){
    moveReviewMode=true;
    endGraceBtn.classList.add('move-review-mode');
    endGraceBtn.disabled=false;
    endGraceBtn.setAttribute('aria-label','مراجعة الحركات السابقة');
    endGraceBtn.innerHTML=`<span class="move-review-inline"><span class="move-review-arrow" data-review-direction="-1" aria-label="رجوع">‹</span><span class="move-review-label">الحركة السابقة</span><span class="move-review-arrow" data-review-direction="1" aria-label="تقدم">›</span></span>`;
  }
  updateMoveReviewControls();
}

function renderReviewedFen(index){
  if(index<0 || index>=reviewFens.length || !game) return;
  reviewIndex=index;
  clearMoveHints();
  const board=ensureBoard();
  const orientation=flipped ? COLOR.black : COLOR.white;
  if(board.getOrientation()!==orientation) board.setOrientation(orientation,false);
  board.setPosition(reviewFens[reviewIndex],false);
  forceBoardSquareColors();
  renderLastMoveHighlight();
  updateMoveReviewControls();
}

function stepMoveReview(direction){
  if(!moveReviewMode || !reviewFens.length) return;
  const step=Number(direction)<0 ? -1 : 1;
  if(step<0 && reviewIndex <= 0) return;
  if(step>0 && reviewIndex >= reviewFens.length - 1) return;
  renderReviewedFen(reviewIndex+step);
}

function clearLiveSession(){
  ['shatranj_live_game_id','shatranj_live_game_code','shatranj_live_seat_key','shatranj_live_color'].forEach((key)=>sessionStorage.removeItem(key));
  if(liveGameId) sessionStorage.removeItem(reviewStorageKey());
}

function updateGraceEndUI(){
  if(!endGraceBtn || moveReviewMode) return;
  if(!graceStateLoaded){
    endGraceBtn.disabled=true;
    return;
  }
  const remaining = Math.max(0, graceDeadline - performance.now());
  if(remaining <= 0){
    if(serverState?.status==='active') showMoveReviewMode();
    else endGraceBtn.disabled=true;
    return;
  }
  const seconds = Math.ceil(remaining / 1000);
  const enabled = serverState?.status === 'active' && !graceRequestBusy;
  endGraceBtn.disabled = !enabled;
  if(endGraceCountdownEl) endGraceCountdownEl.textContent=String(seconds);
}

async function loadGraceEndWindow(){
  if(!liveGameId || !endGraceBtn) return;
  endGraceBtn.disabled = true;
  graceDeadline = 0;
  graceStateLoaded=false;
  try{
    const { data, error } = await supabase.rpc('get_live_game_grace_state',{p_game_id:liveGameId});
    if(error) throw error;
    const row = firstRow(data);
    const remaining = Math.max(0, Number(row?.remaining_ms || 0));
    graceDeadline = performance.now() + remaining;
    graceStateLoaded=true;
  }catch(err){
    console.error(err);
    graceDeadline = 0;
  }
  updateGraceEndUI();
}

function showMatchmakingState(state){
  matchmakingScreen.hidden = false;
  gamePage.hidden = true;
  matchmakingSetup.hidden = state !== 'setup';
  matchmakingWaiting.hidden = state !== 'waiting';
  matchmakingFound.hidden = state !== 'found';
  leaveText.textContent = 'الرئيسية';
}

function showGamePage(){
  matchmakingScreen.hidden = true;
  gamePage.hidden = false;
  leaveText.textContent = 'الرئيسية';
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
  return `<div class="piece ${cls} piece-${type}"><img class="piece-image" src="assets/pieces/${color}${type}.png?v=20260904-12" alt="" aria-hidden="true" draggable="false"></div>`;
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
      location: [serverState.white_region,serverState.white_city].filter(Boolean).join(' — ')
    };
  }
  return {
    id: serverState.black_player_id,
    name: serverState.black_name,
    rating: serverState.black_rating,
    location: [serverState.black_region,serverState.black_city].filter(Boolean).join(' — ')
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

const playerAvatarPathCache = new Map();

async function getPlayerAvatarPath(playerId){
  if(playerAvatarPathCache.has(playerId)) return playerAvatarPathCache.get(playerId);
  const pending=(async()=>{
    try{
      const { data, error }=await supabase.rpc('get_public_player_profile',{p_player_id:playerId});
      if(error) throw error;
      const profile=firstRow(data);
      return profile?.avatar_path || `${playerId}/avatar.webp`;
    }catch(err){
      console.error(err);
      return `${playerId}/avatar.webp`;
    }
  })();
  playerAvatarPathCache.set(playerId,pending);
  return pending;
}

async function setPlayerAvatar(box,img,info,legacyAuthUserId=null){
  if(!box || !img || !info?.id) return;
  const playerId=String(info.id);
  if(img.dataset.playerId===playerId && img.getAttribute('src')) return;
  img.dataset.playerId=playerId;
  img.hidden=true;
  const avatarPath=await getPlayerAvatarPath(playerId);
  if(img.dataset.playerId!==playerId) return;
  const legacyAvatarPath=legacyAuthUserId ? `${legacyAuthUserId}/avatar.webp` : null;
  const avatarUrl=(path)=>`${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  let triedLegacy=false;
  img.onload=()=>{ if(img.dataset.playerId===playerId) img.hidden=false; };
  img.onerror=()=>{
    if(img.dataset.playerId!==playerId) return;
    if(!triedLegacy && legacyAvatarPath && legacyAvatarPath!==avatarPath){
      triedLegacy=true;
      img.src=avatarUrl(legacyAvatarPath);
      return;
    }
    img.hidden=true;
  };
  img.src=avatarUrl(avatarPath);
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
  setPlayerAvatar(topAvatarEl, topAvatarImgEl, top);
  setPlayerAvatar(bottomAvatarEl, bottomAvatarImgEl, bottom, authUserId);
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


function clearMoveHints(){
  if(!moveHintsEl) return;
  moveHintsEl.querySelectorAll('.move-hint').forEach((hint)=>hint.remove());
}

function moveHintPosition(square){
  const fileIndex=files.indexOf(String(square || '')[0]);
  const rank=Number(String(square || '')[1]);
  if(fileIndex<0 || !Number.isFinite(rank) || rank<1 || rank>8) return null;
  let col=fileIndex;
  let row=8-rank;
  if(flipped){
    col=7-col;
    row=7-row;
  }
  return {col,row};
}

function clearLastMoveHighlight(){
  const board=cmBoard;
  if(!board?.removeMarkers) return;
  board.removeMarkers(LAST_MOVE_MARKER);
}

function renderLastMoveHighlight(){
  const board=cmBoard;
  clearLastMoveHighlight();
  if(!board?.addMarker || !lastMove?.from || !lastMove?.to || isReviewingPast()) return;
  board.addMarker(LAST_MOVE_MARKER,lastMove.from);
  board.addMarker(LAST_MOVE_MARKER,lastMove.to);
}

function showMoveHints(fromSquare){
  clearMoveHints();
  if(!moveHintsEl || !game || !fromSquare) return;
  const moves=game.moves({square:fromSquare,verbose:true});
  const targets=new Map();
  moves.forEach((move)=>{
    const current=targets.get(move.to);
    targets.set(move.to,{to:move.to,capture:Boolean(move.captured) || Boolean(current?.capture)});
  });
  targets.forEach((target)=>{
    const pos=moveHintPosition(target.to);
    if(!pos) return;
    const hint=document.createElement('span');
    hint.className='move-hint' + (target.capture ? ' capture' : '');
    hint.style.left=`${pos.col * 12.5}%`;
    hint.style.top=`${pos.row * 12.5}%`;
    hint.dataset.square=target.to;
    moveHintsEl.appendChild(hint);
  });
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
    theme.href='cm-chessboard-shatranj-v3.css?v=20260904-3';
    theme.dataset.cmChessboardShatranj='1';
    document.head.appendChild(theme);
  }
}

function forceBoardSquareColors(){
  boardEl.querySelectorAll('.cm-chessboard .square.white').forEach((square)=>{
    square.style.setProperty('fill','#d6cfbf','important');
  });
  boardEl.querySelectorAll('.cm-chessboard .square.black').forEach((square)=>{
    square.style.setProperty('fill','#246f77','important');
  });
}

function watchBoardSquareColors(){
  if(boardEl._shatranjColorObserver) return;
  const observer=new MutationObserver(()=>forceBoardSquareColors());
  observer.observe(boardEl,{childList:true,subtree:true});
  boardEl._shatranjColorObserver=observer;
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
    assetsUrl:'assets/',
    extensions:[{class:Markers,props:{autoMarkers:null,sprite:'last-move-markers.svg'}}],
    style:{
      cssClass:'shatranj',
      showCoordinates:false,
      borderType:BORDER_TYPE.none,
      pieces:{file:'pieces/shatranj-approved-20260904.svg?v=20260905-3',tileSize:40},
      animationDuration:180
    }
  });
  cmBoard.enableMoveInput(handleBoardInput,myColor==='b' ? COLOR.black : COLOR.white);
  forceBoardSquareColors();
  watchBoardSquareColors();
  return cmBoard;
}

function renderBoard(){
  if(!game) return;
  const board=ensureBoard();
  const orientation=flipped ? COLOR.black : COLOR.white;
  if(board.getOrientation()!==orientation) board.setOrientation(orientation,false);
  board.setPosition(game.fen(),false);
  forceBoardSquareColors();
  renderLastMoveHighlight();
  updateClockUI();
}

function localResult(){
  if(game.in_checkmate()) return game.turn()==='w' ? '0-1' : '1-0';
  if(game.in_draw()) return '1/2-1/2';
  return null;
}

function handleBoardInput(event){
  if(spectatorMode) return false;
  if(event.type===INPUT_EVENT_TYPE.moveInputStarted){
    if(isReviewingPast()) return false;
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
    if(game.turn()!==myColor) return false;
    const piece=game.get(event.squareFrom);
    const allowed=Boolean(piece && piece.color===myColor && piece.color===game.turn());
    if(!allowed){
      clearMoveHints();
      return false;
    }
    selected=event.squareFrom;
    legalTargets=game.moves({square:event.squareFrom,verbose:true});
    showMoveHints(event.squareFrom);
    return true;
  }

  if(event.type===INPUT_EVENT_TYPE.validateMoveInput){
    if(isReviewingPast()) return false;
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
    if(game.turn()!==myColor) return false;
    const legal=game.moves({square:event.squareFrom,verbose:true});
    const candidate=legal.find(move=>move.to===event.squareTo);
    if(!candidate) return false;
    clearMoveHints();

    const move=game.move({from:event.squareFrom,to:event.squareTo,promotion:'q'});
    if(!move) return false;
    lastMove = { from: move.from, to: move.to };
    renderLastMoveHighlight();
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
        ignoreNextLastMoveInference = true;
        lastMove = null;
        renderLastMoveHighlight();
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
  if(spectatorMode) return;
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

function applyFinishedGameUI(result){
  if(!topPlayerCard || !bottomPlayerCard || !gameActions) return;
  [topPlayerCard,bottomPlayerCard].forEach((card)=>{
    card.classList.remove('result-winner','result-loser');
  });
  gameActions.classList.add('game-result-actions');

  const banner=document.createElement('div');
  banner.className='game-result-banner';
  const title=document.createElement('span');
  title.className='game-result-title';
  const name=document.createElement('strong');
  name.className='game-result-name';
  const winnerColor = result==='1-0' ? 'w' : result==='0-1' ? 'b' : null;

  if(!winnerColor){
    title.textContent='انتهت المباراة بالتعادل';
    banner.appendChild(title);
    gameActions.replaceChildren(banner);
    return;
  }

  const topColor = myColor === 'w' ? 'b' : 'w';
  const winner = colorInfo(winnerColor);
  const winnerCard = winnerColor===topColor ? topPlayerCard : bottomPlayerCard;
  const loserCard = winnerColor===topColor ? bottomPlayerCard : topPlayerCard;
  winnerCard.classList.add('result-winner');
  loserCard.classList.add('result-loser');
  title.textContent='مبروك';
  name.textContent=winner.name || (winnerColor===myColor ? 'أنت' : 'الخصم');
  banner.append(title,name);
  gameActions.replaceChildren(banner);
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

  if(row.status==='cancelled' && !gameCancelledHandled){
    gameCancelledHandled=true;
    graceDeadline=0;
    updateGraceEndUI();
    clearInterval(gamePollTimer);
    clearLiveSession();
    toast('تم إنهاء المباراة دون احتساب نقاط.',900);
    setTimeout(()=>{ location.replace('play-v10.html'); },700);
    return;
  }

  if(changed){
    restoreMoveReviewHistory();
    let previousFen=game?.fen?.() || null;
    if(!previousFen && reviewFens.length){
      const latestStoredFen=reviewFens[reviewFens.length-1];
      previousFen=latestStoredFen===row.fen && reviewFens.length>1
        ? reviewFens[reviewFens.length-2]
        : latestStoredFen;
    }
    const fenChanged=Boolean(previousFen && previousFen!==row.fen);
    const serverLastMove=fenChanged && !ignoreNextLastMoveInference
      ? latestMoveFromServerMoves(row.moves)
      : null;
    const inferredLastMove=fenChanged && !ignoreNextLastMoveInference && !serverLastMove
      ? inferLastMoveFromFens(previousFen, row.fen, Chess)
      : null;
    try{
      game = new Chess(row.fen);
      rememberLiveFen(row.fen);
    }catch(err){
      console.error(err);
      toast('تعذر تحميل وضع الرقعة.');
      return;
    }
    if(ignoreNextLastMoveInference){
      lastMove=null;
      ignoreNextLastMoveInference=false;
    }else if(fenChanged){
      lastMove=serverLastMove || inferredLastMove;
    }
    selected=null;
    legalTargets=[];
    clearMoveHints();
    lastServerUpdate=row.updated_at || '';
    renderBoard();
  }else{
    updateClockUI();
  }

  maybeHandleDrawOffer();

  if(row.status==='finished' && !finishedAlerted){
    finishedAlerted=true;
    graceDeadline=0;
    updateGraceEndUI();
    clearInterval(gamePollTimer);
    applyFinishedGameUI(row.result);
    toast(finishedMessage(row.result),4200);
  }
}

async function refreshLiveGame(force=false){
  if(refreshBusy || !liveGameId) return;
  refreshBusy=true;
  try{
    const request = spectatorMode
      ? supabase.rpc('get_spectator_live_game_state',{p_game_id:liveGameId})
      : supabase.rpc('get_live_game_state',{p_game_id:liveGameId});
    const { data, error } = await request;
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

async function openSpectatorGame(){
  spectatorMode=true;
  seatKey=null;
  myColor='w';
  showGamePage();
  if(leaveText) leaveText.textContent='العودة للبطولات';
  if(resignBtn) resignBtn.hidden=true;
  if(drawOfferBtn) drawOfferBtn.hidden=true;
  if(endGraceBtn) endGraceBtn.hidden=true;
  if(reportBtn) reportBtn.hidden=true;
  document.title='مشاهدة مباراة بطولة | شطرنج العرب';
  await loadTournamentGameContext();
  await refreshLiveGame(true);
  gamePollTimer=setInterval(()=>{
    if(!document.hidden && !['finished','cancelled'].includes(serverState?.status)) refreshLiveGame(false);
  },1200);
}

async function openLiveGame(){
  const recovered=await recoverSeatIfNeeded();
  if(!recovered){
    toast('تعذر التحقق من مقعدك في المباراة.');
    setTimeout(()=>{ location.href='play-v8.html'; },1300);
    return;
  }

  showGamePage();
  await loadTournamentGameContext();
  await refreshLiveGame(true);
  if(serverState?.status==='cancelled') return;
  loadGraceEndWindow();
  gamePollTimer=setInterval(()=>{
    if(!document.hidden && !['finished','cancelled'].includes(serverState?.status)) refreshLiveGame(false);
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

endGraceBtn.addEventListener('click',async(event)=>{
  updateGraceEndUI();
  if(moveReviewMode){
    const directionTarget=event.target.closest?.('[data-review-direction]');
    const direction=directionTarget ? Number(directionTarget.dataset.reviewDirection) : -1;
    stepMoveReview(direction);
    return;
  }
  if(endGraceBtn.disabled || graceRequestBusy || !liveGameId || !seatKey) return;
  graceRequestBusy=true;
  endGraceBtn.disabled=true;
  try{
    const { data, error }=await supabase.rpc('cancel_live_game_grace',{p_game_id:liveGameId,p_seat_key:seatKey});
    if(error) throw error;
    const ended = data === true || firstRow(data) === true;
    if(!ended){
      graceDeadline=0;
      toast('انتهت مهلة الإنهاء.');
      return;
    }
    graceDeadline=0;
    clearInterval(gamePollTimer);
    clearLiveSession();
    toast('تم إنهاء المباراة دون احتساب نقاط.',900);
    setTimeout(()=>{ location.replace('play-v10.html'); },650);
  }catch(err){
    console.error(err);
    toast('تعذر إنهاء المباراة. حاول مرة أخرى.');
    loadGraceEndWindow();
  }finally{
    graceRequestBusy=false;
    updateGraceEndUI();
  }
});

document.querySelectorAll('[data-minutes]').forEach(btn=>{
  btn.addEventListener('click',()=>startMatchmaking(btn.dataset.minutes));
});

cancelMatchmakingBtn.addEventListener('click',cancelMatchmaking);

leaveBtn.addEventListener('click',async()=>{
  if(!matchmakingWaiting.hidden) await cancelMatchmaking();
  location.href=spectatorMode?'tournaments.html':'index.html';
});

reportBtn.addEventListener('click',()=>{
  if(spectatorMode) return;
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
  if(!gamePage.hidden){
    updateClockUI();
    updateGraceEndUI();
  }
  if(!matchmakingWaiting.hidden && matchmakingStartedAt){
    matchmakingElapsed.textContent=formatElapsed((Date.now()-matchmakingStartedAt)/1000);
  }
},250);

async function init(){
  if(!supabase){
    alert('تعذر الاتصال بخدمة اللعب.');
    return;
  }

  const params = new URLSearchParams(location.search);
  const spectatorGameId = params.get('spectate');
  if(spectatorGameId){
    liveGameId=spectatorGameId;
    await openSpectatorGame();
    return;
  }

  const { data:{session} }=await supabase.auth.getSession();
  if(!session){
    location.href='index.html#register';
    return;
  }
  authUserId=session.user.id;

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
