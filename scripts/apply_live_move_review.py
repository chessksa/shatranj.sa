from pathlib import Path
import re

JS_PATH = Path('play-v8.js')
HTML_PATH = Path('play-v10.html')

js = JS_PATH.read_text(encoding='utf-8')
html = HTML_PATH.read_text(encoding='utf-8')

if 'function showMoveReviewMode()' not in js:
    state_marker = "let gameCancelledHandled = false;\n"
    state_insert = """let gameCancelledHandled = false;
let reviewFens = [];
let reviewIndex = -1;
let moveReviewMode = false;
let graceStateLoaded = false;
"""
    if state_marker not in js:
        raise SystemExit('review state marker missing')
    js = js.replace(state_marker, state_insert, 1)

    old_grace = """function clearLiveSession(){
  ['shatranj_live_game_id','shatranj_live_game_code','shatranj_live_seat_key','shatranj_live_color'].forEach((key)=>sessionStorage.removeItem(key));
}

function updateGraceEndUI(){
  if(!endGraceBtn) return;
  const remaining = Math.max(0, graceDeadline - performance.now());
  const seconds = Math.ceil(remaining / 1000);
  const enabled = remaining > 0 && serverState?.status === 'active' && !graceRequestBusy;
  endGraceBtn.disabled = !enabled;
  if(endGraceCountdownEl){
    endGraceCountdownEl.textContent = remaining > 0 ? String(seconds) : 'انتهت';
  }
}

async function loadGraceEndWindow(){
  if(!liveGameId || !endGraceBtn) return;
  endGraceBtn.disabled = true;
  graceDeadline = 0;
  try{
    const { data, error } = await supabase.rpc('get_live_game_grace_state',{p_game_id:liveGameId});
    if(error) throw error;
    const row = firstRow(data);
    const remaining = Math.max(0, Number(row?.remaining_ms || 0));
    graceDeadline = performance.now() + remaining;
  }catch(err){
    console.error(err);
    graceDeadline = 0;
  }
  updateGraceEndUI();
}
"""
    new_grace = """function reviewStorageKey(){
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
"""
    if old_grace not in js:
        raise SystemExit('grace block marker missing')
    js = js.replace(old_grace, new_grace, 1)

    start_guard = """  if(event.type===INPUT_EVENT_TYPE.moveInputStarted){
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
"""
    start_repl = """  if(event.type===INPUT_EVENT_TYPE.moveInputStarted){
    if(isReviewingPast()) return false;
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
"""
    if start_guard not in js:
        raise SystemExit('move-start guard marker missing')
    js = js.replace(start_guard, start_repl, 1)

    validate_guard = """  if(event.type===INPUT_EVENT_TYPE.validateMoveInput){
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
"""
    validate_repl = """  if(event.type===INPUT_EVENT_TYPE.validateMoveInput){
    if(isReviewingPast()) return false;
    if(moveBusy || !game || !serverState || serverState.status!=='active') return false;
"""
    if validate_guard not in js:
        raise SystemExit('move-validate guard marker missing')
    js = js.replace(validate_guard, validate_repl, 1)

    fen_marker = """      game = new Chess(row.fen);
    }catch(err){
"""
    fen_repl = """      game = new Chess(row.fen);
      rememberLiveFen(row.fen);
    }catch(err){
"""
    if fen_marker not in js:
        raise SystemExit('server FEN marker missing')
    js = js.replace(fen_marker, fen_repl, 1)

    click_marker = """endGraceBtn.addEventListener('click',async()=>{
  updateGraceEndUI();
  if(endGraceBtn.disabled || graceRequestBusy || !liveGameId || !seatKey) return;
"""
    click_repl = """endGraceBtn.addEventListener('click',async(event)=>{
  updateGraceEndUI();
  if(moveReviewMode){
    const directionTarget=event.target.closest?.('[data-review-direction]');
    const direction=directionTarget ? Number(directionTarget.dataset.reviewDirection) : -1;
    stepMoveReview(direction);
    return;
  }
  if(endGraceBtn.disabled || graceRequestBusy || !liveGameId || !seatKey) return;
"""
    if click_marker not in js:
        raise SystemExit('grace click marker missing')
    js = js.replace(click_marker, click_repl, 1)

if '.grace-end-action.move-review-mode' not in html:
    css_anchor = ".grace-end-action:disabled .grace-countdown,.grace-end-action:disabled .grace-note{opacity:.62}"
    css_add = """.grace-end-action:disabled .grace-countdown,.grace-end-action:disabled .grace-note{opacity:.62}.grace-end-action.move-review-mode{opacity:1!important;cursor:pointer!important;padding:7px 8px}.move-review-inline{width:100%;display:grid;grid-template-columns:32px minmax(0,1fr) 32px;align-items:center;gap:5px;direction:ltr}.move-review-arrow{display:grid;place-items:center;min-height:32px;border:1px solid rgba(224,181,103,.35);border-radius:8px;color:var(--gold);font-size:24px;font-weight:900;line-height:1;user-select:none}.move-review-arrow.disabled{opacity:.25}.move-review-label{direction:rtl;color:var(--text);font-size:11px;font-weight:800;white-space:nowrap}"
"""
    if css_anchor not in html:
        raise SystemExit('review CSS anchor missing')
    html = html.replace(css_anchor, css_add, 1)

html = re.sub(r"play-v8\.js\?v=\d{8}-\d+", 'play-v8.js?v=20260907-5', html, count=1)

JS_PATH.write_text(js, encoding='utf-8')
HTML_PATH.write_text(html, encoding='utf-8')
