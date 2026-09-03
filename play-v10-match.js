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
let flipped = false;
let pollTimer = null;
let startedAt = 0;
let polling = false;

const startingBoard = [
  ['br','bn','bb','bq','bk','bb','bn','br'],
  ['bp','bp','bp','bp','bp','bp','bp','bp'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wp','wp','wp','wp','wp','wp','wp','wp'],
  ['wr','wn','wb','wq','wk','wb','wn','wr']
];

function firstRow(data){
  return Array.isArray(data) ? (data[0] || null) : data;
}

function pieceMarkup(code){
  if(!code) return '';
  const color = code[0];
  const type = code[1];
  const cls = color === 'w' ? 'white' : 'black';
  return `<div class="piece ${cls} piece-${type}"><img class="piece-image" src="assets/pieces/${color}${type}.png?v=20260903-4" alt="" aria-hidden="true" draggable="false"></div>`;
}

function renderCoords(){
  leftEl.innerHTML = '';
  bottomEl.innerHTML = '';
  const shownRanks = flipped ? [...ranks].reverse() : ranks;
  const shownFiles = flipped ? [...files].reverse() : files;
  shownRanks.forEach((n)=>{ const d=document.createElement('div'); d.textContent=n; leftEl.appendChild(d); });
  shownFiles.forEach((f)=>{ const d=document.createElement('div'); d.textContent=f; bottomEl.appendChild(d); });
}

function renderPreviewBoard(){
  boardEl.innerHTML = '';
  const rows = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  for(const row of rows){
    for(const col of cols){
      const square = document.createElement('div');
      square.className = 'square ' + (((row+col)%2===0) ? 'light' : 'dark');
      square.innerHTML = pieceMarkup(startingBoard[row][col]);
      boardEl.appendChild(square);
    }
  }
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
  renderPreviewBoard();
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
  renderPreviewBoard();
});

setInterval(()=>{
  if(!waitingEl.hidden && startedAt){
    elapsedEl.textContent = formatElapsed((Date.now()-startedAt)/1000);
  }
},250);

init();
