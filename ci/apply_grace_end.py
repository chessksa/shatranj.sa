from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"expected block not found in {path}: {old[:120]!r}")
    if text.count(old) != 1:
        raise SystemExit(f"expected exactly one match in {path}, found {text.count(old)}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


html = ROOT / "play-v10.html"
replace_once(
    html,
    ".panel-stack{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-content:space-between}",
    ".panel-stack{height:100%;display:grid;grid-template-rows:auto minmax(150px,1fr) auto minmax(150px,1fr);gap:14px;align-content:space-between}",
)
replace_once(
    html,
    ".actions-card{border-radius:18px;display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;min-height:94px}.action-item{background:transparent;border:0;color:var(--text);font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;cursor:pointer}.action-item+.action-item{border-right:1px solid rgba(224,181,103,.24)}.action-item:disabled{opacity:.32;cursor:default}.action-icon{font-size:26px;color:var(--gold)}.action-label{font-size:14px;font-weight:700}",
    ".actions-card{border-radius:18px;display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;min-height:100px}.action-item{background:transparent;border:0;color:var(--text);font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;padding:10px 8px}.action-item+.action-item{border-right:1px solid rgba(224,181,103,.24)}.action-item:disabled{opacity:.32;cursor:default}.action-icon{font-size:26px;color:var(--gold)}.action-label{font-size:14px;font-weight:700}.grace-end-action:not(:disabled){background:rgba(255,132,28,.07)}.grace-end-action:not(:disabled) .action-icon,.grace-end-action:not(:disabled) .grace-countdown{color:#ff8a24}.grace-countdown{min-width:31px;padding:2px 7px;border:1px solid rgba(255,138,36,.65);border-radius:999px;color:#ff8a24;font-size:12px;font-weight:900;line-height:1.25}.grace-note{color:var(--muted);font-size:9px;line-height:1.25;white-space:nowrap}.grace-end-action:disabled .grace-countdown,.grace-end-action:disabled .grace-note{opacity:.62}",
)
replace_once(
    html,
    ".opponent-slot{position:relative;overflow:hidden}#topPlayerCard:has(#opponentSearchPanel:not([hidden])){align-self:center;min-height:0;padding-top:0;padding-bottom:6px}.opponent-search-panel{grid-column:1/-1;width:100%;text-align:center}.opponent-search-title{font-size:16px;font-weight:800;margin-bottom:12px}.opponent-time-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.opponent-time-option{min-height:76px;border:1px solid rgba(224,181,103,.4);border-radius:12px;background:rgba(2,28,33,.44);color:var(--text);font:700 12px inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center}.opponent-time-option strong{font-size:25px;color:var(--gold)}.opponent-time-option span{font-size:11px;color:var(--muted)}.opponent-time-option:hover{border-color:var(--gold);background:rgba(224,181,103,.08)}.opponent-waiting-line{display:flex;align-items:center;justify-content:center;gap:11px;font-size:20px}.search-dots{display:inline-flex;gap:5px;direction:ltr}.search-dots i{width:7px;height:7px;border-radius:50%;background:var(--gold);opacity:.25;animation:searchDot 1.05s infinite ease-in-out}.search-dots i:nth-child(2){animation-delay:.16s}.search-dots i:nth-child(3){animation-delay:.32s}@keyframes searchDot{0%,65%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}.opponent-waiting-meta{display:flex;justify-content:center;gap:18px;margin-top:12px;font-size:11px;color:var(--muted)}.opponent-waiting-meta b{color:var(--gold)}.inline-cancel-search{margin-top:12px;height:34px;padding:0 15px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:transparent;color:var(--text);font:700 11px inherit;cursor:pointer}.opponent-search-error{min-height:16px;margin:7px 0 0;color:#ff8d8d;font-size:11px}.opponent-search-error:empty{display:none}#opponentSearchPanel,#opponentSearchPanel *{font-size:20px}.top-player-live{display:contents}",
    ".opponent-slot{position:relative;overflow:hidden;min-height:150px}.opponent-search-panel{grid-column:1/-1;width:100%;height:100%;min-height:114px;text-align:center;display:grid;align-content:center;padding:4px 0}.opponent-search-title{font-size:16px;font-weight:800;margin-bottom:12px}.opponent-time-options{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.opponent-time-option{min-height:76px;border:1px solid rgba(224,181,103,.4);border-radius:12px;background:rgba(2,28,33,.44);color:var(--text);font:700 12px inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center}.opponent-time-option strong{font-size:25px;color:var(--gold)}.opponent-time-option span{font-size:11px;color:var(--muted)}.opponent-time-option:hover{border-color:var(--gold);background:rgba(224,181,103,.08)}.opponent-waiting-line{display:flex;align-items:center;justify-content:center;gap:11px;font-size:16px}.search-dots{display:inline-flex;gap:5px;direction:ltr}.search-dots i{width:7px;height:7px;border-radius:50%;background:var(--gold);opacity:.25;animation:searchDot 1.05s infinite ease-in-out}.search-dots i:nth-child(2){animation-delay:.16s}.search-dots i:nth-child(3){animation-delay:.32s}@keyframes searchDot{0%,65%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}.opponent-waiting-meta{display:flex;justify-content:center;gap:20px;margin-top:11px;font-size:11px;color:var(--muted)}.opponent-waiting-meta b{color:var(--gold)}.inline-cancel-search{margin-top:11px;height:34px;padding:0 15px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:transparent;color:var(--text);font:700 11px inherit;cursor:pointer}.opponent-search-error{min-height:16px;margin:6px 0 0;color:#ff8d8d;font-size:11px}.opponent-search-error:empty{display:none}.top-player-live{display:contents}",
)
replace_once(
    html,
    '<button class="action-item" id="flipBoard" type="button"><span class="action-icon">↻</span><span class="action-label">قلب الرقعة</span></button>',
    '<button class="action-item grace-end-action" id="endGraceBtn" type="button" disabled><span class="action-icon">✕</span><span class="action-label">إنهاء</span><span class="grace-countdown" id="endGraceCountdown">5</span><span class="grace-note">خلال 5 ثوانٍ دون خصم نقاط</span></button>',
)
replace_once(html, "s.src='play-v8.js?v=20260904-12';", "s.src='play-v8.js?v=20260904-13';")
replace_once(html, "s.src='play-v10-match.js?v=20260904-12';", "s.src='play-v10-match.js?v=20260904-13';")

match = ROOT / "play-v10-match.js"
replace_once(match, "const flipBtn = $('flipBoard');", "const endGraceCountdownEl = $('endGraceCountdown');")
replace_once(
    match,
    "function orientPreviewBoard(){\n  const board = ensurePreviewBoard();\n  const orientation = flipped ? COLOR.black : COLOR.white;\n  if(board.getOrientation() !== orientation) board.setOrientation(orientation, false);\n  forceBoardSquareColors();\n}\n\n",
    "",
)
replace_once(
    match,
    "  $('resignBtn').disabled = true;\n  $('drawOffer').disabled = true;\n  $('reportBtn').disabled = true;",
    "  $('resignBtn').disabled = true;\n  $('drawOffer').disabled = true;\n  $('reportBtn').disabled = true;\n  $('endGraceBtn').disabled = true;\n  if(endGraceCountdownEl) endGraceCountdownEl.textContent = '5';",
)
replace_once(
    match,
    "flipBtn.addEventListener('click',()=>{\n  flipped = !flipped;\n  renderCoords();\n  orientPreviewBoard();\n});\n\n",
    "",
)

live = ROOT / "play-v8.js"
replace_once(
    live,
    "const resignBtn = $('resignBtn');\nconst flipBoardEl = $('flipBoard');\nconst drawOfferBtn = $('drawOffer');",
    "const resignBtn = $('resignBtn');\nconst endGraceBtn = $('endGraceBtn');\nconst endGraceCountdownEl = $('endGraceCountdown');\nconst drawOfferBtn = $('drawOffer');",
)
replace_once(
    live,
    "let finishedAlerted = false;\nlet gamePollTimer = null;",
    "let finishedAlerted = false;\nlet gamePollTimer = null;\nlet graceDeadline = 0;\nlet graceRequestBusy = false;\nlet gameCancelledHandled = false;",
)
replace_once(
    live,
    "function toast(message, ms=2200){\n  gameToast.textContent = message;\n  gameToast.hidden = false;\n  clearTimeout(toast._timer);\n  toast._timer = setTimeout(()=>{ gameToast.hidden=true; }, ms);\n}\n",
    "function toast(message, ms=2200){\n  gameToast.textContent = message;\n  gameToast.hidden = false;\n  clearTimeout(toast._timer);\n  toast._timer = setTimeout(()=>{ gameToast.hidden=true; }, ms);\n}\n\nfunction clearLiveSession(){\n  ['shatranj_live_game_id','shatranj_live_game_code','shatranj_live_seat_key','shatranj_live_color'].forEach((key)=>sessionStorage.removeItem(key));\n}\n\nfunction updateGraceEndUI(){\n  if(!endGraceBtn) return;\n  const remaining = Math.max(0, graceDeadline - performance.now());\n  const seconds = Math.ceil(remaining / 1000);\n  const enabled = remaining > 0 && serverState?.status === 'active' && !graceRequestBusy;\n  endGraceBtn.disabled = !enabled;\n  if(endGraceCountdownEl){\n    endGraceCountdownEl.textContent = remaining > 0 ? String(seconds) : 'انتهت';\n  }\n}\n\nasync function loadGraceEndWindow(){\n  if(!liveGameId || !endGraceBtn) return;\n  endGraceBtn.disabled = true;\n  graceDeadline = 0;\n  try{\n    const { data, error } = await supabase.rpc('get_live_game_grace_state',{p_game_id:liveGameId});\n    if(error) throw error;\n    const row = firstRow(data);\n    const remaining = Math.max(0, Number(row?.remaining_ms || 0));\n    graceDeadline = performance.now() + remaining;\n  }catch(err){\n    console.error(err);\n    graceDeadline = 0;\n  }\n  updateGraceEndUI();\n}\n",
)
replace_once(
    live,
    "  renderPlayers();\n\n  if(changed){",
    "  renderPlayers();\n\n  if(row.status==='cancelled' && !gameCancelledHandled){\n    gameCancelledHandled=true;\n    graceDeadline=0;\n    updateGraceEndUI();\n    clearInterval(gamePollTimer);\n    clearLiveSession();\n    toast('تم إنهاء المباراة دون احتساب نقاط.',900);\n    setTimeout(()=>{ location.replace('play-v10.html'); },700);\n    return;\n  }\n\n  if(changed){",
)
replace_once(
    live,
    "  if(row.status==='finished' && !finishedAlerted){\n    finishedAlerted=true;\n    clearInterval(gamePollTimer);",
    "  if(row.status==='finished' && !finishedAlerted){\n    finishedAlerted=true;\n    graceDeadline=0;\n    updateGraceEndUI();\n    clearInterval(gamePollTimer);",
)
replace_once(
    live,
    "  showGamePage();\n  await refreshLiveGame(true);\n  gamePollTimer=setInterval(()=>{\n    if(!document.hidden && serverState?.status!=='finished') refreshLiveGame(false);\n  },1200);",
    "  showGamePage();\n  await refreshLiveGame(true);\n  if(serverState?.status==='cancelled') return;\n  await loadGraceEndWindow();\n  gamePollTimer=setInterval(()=>{\n    if(!document.hidden && !['finished','cancelled'].includes(serverState?.status)) refreshLiveGame(false);\n  },1200);",
)
replace_once(
    live,
    "flipBoardEl.addEventListener('click',()=>{\n  flipped=!flipped;\n  selected=null;\n  legalTargets=[];\n  renderCoords();\n  renderBoard();\n});",
    "endGraceBtn.addEventListener('click',async()=>{\n  updateGraceEndUI();\n  if(endGraceBtn.disabled || graceRequestBusy || !liveGameId || !seatKey) return;\n  graceRequestBusy=true;\n  endGraceBtn.disabled=true;\n  try{\n    const { data, error }=await supabase.rpc('cancel_live_game_grace',{p_game_id:liveGameId,p_seat_key:seatKey});\n    if(error) throw error;\n    const ended = data === true || firstRow(data) === true;\n    if(!ended){\n      graceDeadline=0;\n      toast('انتهت مهلة الإنهاء.');\n      return;\n    }\n    graceDeadline=0;\n    clearInterval(gamePollTimer);\n    clearLiveSession();\n    toast('تم إنهاء المباراة دون احتساب نقاط.',900);\n    setTimeout(()=>{ location.replace('play-v10.html'); },650);\n  }catch(err){\n    console.error(err);\n    toast('تعذر إنهاء المباراة. حاول مرة أخرى.');\n    await loadGraceEndWindow();\n  }finally{\n    graceRequestBusy=false;\n    updateGraceEndUI();\n  }\n});",
)
replace_once(
    live,
    "setInterval(()=>{\n  if(!gamePage.hidden) updateClockUI();",
    "setInterval(()=>{\n  if(!gamePage.hidden){\n    updateClockUI();\n    updateGraceEndUI();\n  }",
)

print("grace-end patch applied")
