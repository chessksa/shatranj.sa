import {Chessboard, COLOR, BORDER_TYPE} from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.SHATRANJ_CONFIG?.supabase || {};
const supabase = cfg.enabled && cfg.url && cfg.anonKey ? createClient(cfg.url, cfg.anonKey) : null;
const $ = (id) => document.getElementById(id);

const boardEl = $('board');
const leftEl = $('coordsLeft');
const bottomEl = $('coordsBottom');
const bottomNameEl = $('bottomName');
const bottomLocationEl = $('bottomLocation');
const bottomRatingEl = $('bottomRating');
const bottomClockEl = $('bottomClock');
const topClockEl = $('topClock');
const setupEl = $('opponentSearchSetup');
const waitingEl = $('opponentSearchWaiting');
const errorEl = $('opponentSearchError');
const waitingErrorEl = $('opponentSearchWaitingError');
const rangeEl = $('inlineMatchmakingRange');
const elapsedEl = $('inlineMatchmakingElapsed');
const cancelBtn = $('cancelInlineMatchmaking');
const leaveBtn = $('leaveBtn');
const flipBtn = $('flipBoard');

const files = ['a','b','c','d','e','f','g','h'];
const ranks = [8,7,6,5,4,3,2,1];
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let flipped = false;
let pollTimer = null;
let startedAt = 0;
let polling = false;
let previewBoard = null;

function firstRow(data){
  return Array.isArray(data) ? (data[0] || null) : data;
}

function ensureCmStyles(){
  if(!document.querySelector('link[data-cm-chessboard-core]')){
    const core = document.createElement('link');
    core.rel = 'stylesheet';
    core.href = 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/assets/chessboard.css';
    core.dataset.cmChessboardCore = '1';
    document.head.appendChild(core);
  }
  if(!document.querySelector('link[data-cm-chessboard-shatranj]')){
    const theme = document.createElement('link');
    theme.rel = 'stylesheet';
    theme.href = 'cm-chessboard-shatranj-v3.css?v=20260904-3';
    theme.dataset.cmChessboardShatranj = '1';
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

function ensurePreviewBoard(){
  if(previewBoard) return previewBoard;
  ensureCmStyles();
  boardEl.className = 'cm-board-host';
  previewBoard = new Chessboard(boardEl, {
    position: START_FEN,
    orientation: flipped ? COLOR.black : COLOR.white,
    responsive: true,
    assetsUrl:'assets/',
    style: {
      cssClass: 'shatranj',
      showCoordinates: false,
      borderType: BORDER_TYPE.none,
      pieces:{file:'pieces/shatranj-approved-20260904.svg?v=20260904-5',tileSize:40},
      animationDuration: 180
    }
  });
  forceBoardSquareColors();
  watchBoardSquareColors();
  return previewBoard;
}

function renderCoords(){
  leftEl.innerHTML = '';
  bottomEl.innerHTML = '';
  const shownRanks = flipped ? [...ranks].reverse() : ranks;
  const shownFiles = flipped ? [...files].reverse() : files;
  shownRanks.forEach((n)=>{ const d=document.createElement('div'); d.textContent=n; leftEl.appendChild(d); });
  shownFiles.forEach((f)=>{ const d=document.createElement('div'); d.textContent=f; bottomEl.appendChild(d); });
}

function orientPreviewBoard(){
  const board = ensurePreviewBoard();
  const orientation = flipped ? COLOR.black : COLOR.white;
  if(board.getOrientation() !== orientation) board.setOrientation(orientation, false);
  forceBoardSquareColors();
}

function formatElapsed(seconds){
  const s = Math.max(0, Number(seconds) || 0);
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(Math.floor(s%60)).padStart(2,'0');
}

function showSetup(){
  setupEl.hidden = false;
  waitingEl.hidden = true;
  errorEl.textContent = '';
  waitingErrorEl.textContent = '';
  topClockEl.textContent = '--:--';
  bottomClockEl.textContent = '--:--';
}

function showWaiting(minutes){
  setupEl.hidden = true;
  waitingEl.hidden = false;
  errorEl.textContent = '';
  waitingErrorEl.textContent = '';
  const clock = String(Number(minutes)).padStart(2,'0') + ':00';
  topClockEl.textContent = clock;
  bottomClockEl.textContent = clock;
}

function updateWaiting(row){
  const fallback = Math.max(0, (Date.now()-startedAt)/1000);
  const seconds = Number(row?.waited_seconds ?? fallback);
  elapsedEl.textContent = formatElapsed(seconds);
  rangeEl.textContent = `±${Number(row?.rating_window || 150)}`;
}

async function loadProfile(){
  const { data, error } = await supabase.rpc('get_my_player_profile');
  const p = firstRow(data);
  if(error || !p){
    errorEl.textContent = 'أكمل ملف اللاعب أولًا من الصفحة الرئيسية.';
    return null;
  }
  bottomNameEl.textContent = p.name || 'أنت';
  bottomRatingEl.textContent = p.rating ?? '—';
  bottomLocationEl.textContent = [p.city,p.region].filter(Boolean).join(' — ') || '—';
  return p;
}

function enterMatch(row){
  if(!row?.game_id || !row?.seat_key || !row?.color) return;
  sessionStorage.setItem('shatranj_live_game_id', row.game_id);
  sessionStorage.setItem('shatranj_live_game_code', row.game_code || '');
  sessionStorage.setItem('shatranj_live_seat_key', row.seat_key);
  sessionStorage.setItem('shatranj_live_color', row.color);
  sessionStorage.removeItem('shatranj_matchmaking_active');
  sessionStorage.removeItem('shatranj_matchmaking_started_at');
  clearInterval(pollTimer);
  location.replace(`play-v10.html?game=${encodeURIComponent(row.game_id)}`);
}

async function pollMatchmaking(){
  if(polling || !supabase) return;
  polling = true;
  try{
    const { data, error } = await supabase.rpc('poll_matchmaking');
    if(error) throw error;
    const row = firstRow(data);
    if(!row) return;
    if(row.state === 'matched'){
      enterMatch(row);
      return;
    }
    if(row.state === 'waiting'){
      updateWaiting(row);
      return;
    }
    sessionStorage.removeItem('shatranj_matchmaking_active');
    clearInterval(pollTimer);
    showSetup();
  }catch(err){
    console.error(err);
    waitingErrorEl.textContent = 'تعذر متابعة البحث. سنحاول تلقائيًا.';
  }finally{
    polling = false;
  }
}

function beginPolling(){
  clearInterval(pollTimer);
  pollTimer = setInterval(pollMatchmaking, 1500);
}

async function startMatchmaking(minutes){
  if(!supabase) return;
  const m = Number(minutes);
  showWaiting(m);
  startedAt = Date.now();
  sessionStorage.setItem('shatranj_matchmaking_active','1');
  sessionStorage.setItem('shatranj_matchmaking_started_at', String(startedAt));
  updateWaiting({waited_seconds:0,rating_window:150});
  try{
    const { data, error } = await supabase.rpc('start_matchmaking',{p_minutes:m});
    if(error) throw error;
    const row = firstRow(data);
    if(row?.state === 'matched'){
      enterMatch(row);
      return;
    }
    if(row?.state !== 'waiting') throw new Error('unexpected matchmaking state');
    updateWaiting(row);
    beginPolling();
  }catch(err){
    console.error(err);
    sessionStorage.removeItem('shatranj_matchmaking_active');
    clearInterval(pollTimer);
    showSetup();
    errorEl.textContent = String(err?.message || '').includes('active game exists')
      ? 'لديك مباراة نشطة بالفعل.'
      : 'تعذر بدء البحث عن خصم. حاول مرة أخرى.';
  }
}

async function cancelMatchmaking(){
  clearInterval(pollTimer);
  sessionStorage.removeItem('shatranj_matchmaking_active');
  sessionStorage.removeItem('shatranj_matchmaking_started_at');
  try{ await supabase.rpc('cancel_matchmaking'); }catch(err){ console.error(err); }
  showSetup();
}

async function init(){
  renderCoords();
  ensurePreviewBoard();
  showSetup();

  $('resignBtn').disabled = true;
  $('drawOffer').disabled = true;
  $('reportBtn').disabled = true;

  if(!supabase){
    errorEl.textContent = 'تعذر الاتصال بخدمة اللعب.';
    return;
  }
  const { data:{session} } = await supabase.auth.getSession();
  if(!session){
    location.href = 'index.html#register';
    return;
  }
  await loadProfile();

  if(sessionStorage.getItem('shatranj_matchmaking_active') === '1'){
    startedAt = Number(sessionStorage.getItem('shatranj_matchmaking_started_at')) || Date.now();
    showWaiting(0);
    await pollMatchmaking();
    if(!waitingEl.hidden) beginPolling();
  }
}

document.querySelectorAll('#opponentSearchSetup [data-minutes]').forEach((btn)=>{
  btn.addEventListener('click',()=>startMatchmaking(btn.dataset.minutes));
});
cancelBtn.addEventListener('click', cancelMatchmaking);
leaveBtn.addEventListener('click', async()=>{
  if(!waitingEl.hidden) await cancelMatchmaking();
  location.href = 'index.html';
});
flipBtn.addEventListener('click',()=>{
  flipped = !flipped;
  renderCoords();
  orientPreviewBoard();
});

setInterval(()=>{
  if(!waitingEl.hidden && startedAt){
    elapsedEl.textContent = formatElapsed((Date.now()-startedAt)/1000);
  }
},250);

init();
