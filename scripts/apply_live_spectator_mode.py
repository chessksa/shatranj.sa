from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: Path, old: str, new: str):
    text = path.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'anchor not found in {path}: {old[:100]!r}')
    if text.count(old) != 1:
        raise SystemExit(f'anchor not unique in {path}: {old[:100]!r}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')


play = ROOT / 'play-live.js'
watch = ROOT / 'watch.html'
html = ROOT / 'play.html'

replace_once(
    play,
    "let liveGameId = null;\nlet seatKey = null;",
    "let liveGameId = null;\nlet spectatorMode = false;\nlet seatKey = null;"
)

replace_once(
    play,
    "  if(serverState.status==='active' && activeMs<=0 && !timeoutClaimBusy) claimTimeout();",
    "  if(!spectatorMode && serverState.status==='active' && activeMs<=0 && !timeoutClaimBusy) claimTimeout();"
)

replace_once(
    play,
    "async function handleSquare(square){\n  if(moveBusy || !game || !serverState || serverState.status!=='active') return;",
    "async function handleSquare(square){\n  if(spectatorMode) return;\n  if(moveBusy || !game || !serverState || serverState.status!=='active') return;"
)

replace_once(
    play,
    "async function maybeHandleDrawOffer(){\n  if(!serverState?.draw_offer_by || serverState.status!=='active') return;",
    "async function maybeHandleDrawOffer(){\n  if(spectatorMode) return;\n  if(!serverState?.draw_offer_by || serverState.status!=='active') return;"
)

replace_once(
    play,
    "function finishedMessage(result){\n  if(result==='1/2-1/2') return 'انتهت المباراة بالتعادل.';",
    "function finishedMessage(result){\n  if(spectatorMode){\n    if(result==='1/2-1/2') return 'انتهت المباراة بالتعادل.';\n    if(result==='1-0') return 'انتهت المباراة — فاز الأبيض.';\n    if(result==='0-1') return 'انتهت المباراة — فاز الأسود.';\n    return 'انتهت المباراة.';\n  }\n  if(result==='1/2-1/2') return 'انتهت المباراة بالتعادل.';"
)

replace_once(
    play,
    "    const { data, error } = await supabase.rpc('get_live_game_state',{p_game_id:liveGameId});",
    "    const request = spectatorMode\n      ? supabase.rpc('get_spectator_live_game_state',{p_game_id:liveGameId})\n      : supabase.rpc('get_live_game_state',{p_game_id:liveGameId});\n    const { data, error } = await request;"
)

replace_once(
    play,
    "async function openLiveGame(){\n  const recovered=await recoverSeatIfNeeded();",
    "async function openSpectatorGame(){\n  spectatorMode=true;\n  seatKey=null;\n  myColor='w';\n  showGamePage();\n  leaveText.textContent='العودة للمباريات';\n  resignBtn.hidden=true;\n  drawOfferBtn.hidden=true;\n  reportBtn.hidden=true;\n  const actionsCard=flipBoardEl.closest('.actions-card');\n  if(actionsCard) actionsCard.style.gridTemplateColumns='1fr';\n  document.title='مشاهدة مباشرة | شطرنج العرب';\n  await refreshLiveGame(true);\n  gamePollTimer=setInterval(()=>{\n    if(!document.hidden && serverState?.status!=='finished') refreshLiveGame(false);\n  },1200);\n}\n\nasync function openLiveGame(){\n  const recovered=await recoverSeatIfNeeded();"
)

replace_once(
    play,
    "resignBtn.addEventListener('click',async()=>{\n  if(!serverState || serverState.status!=='active') return;",
    "resignBtn.addEventListener('click',async()=>{\n  if(spectatorMode) return;\n  if(!serverState || serverState.status!=='active') return;"
)

replace_once(
    play,
    "drawOfferBtn.addEventListener('click',async()=>{\n  if(!serverState || serverState.status!=='active') return;",
    "drawOfferBtn.addEventListener('click',async()=>{\n  if(spectatorMode) return;\n  if(!serverState || serverState.status!=='active') return;"
)

replace_once(
    play,
    "leaveBtn.addEventListener('click',async()=>{\n  if(!matchmakingWaiting.hidden) await cancelMatchmaking();\n  location.href='index.html';\n});",
    "leaveBtn.addEventListener('click',async()=>{\n  if(!matchmakingWaiting.hidden) await cancelMatchmaking();\n  location.href=spectatorMode?'watch.html':'index.html';\n});"
)

replace_once(
    play,
    "reportBtn.addEventListener('click',()=>{\n  if(!liveGameId || gamePage.hidden){",
    "reportBtn.addEventListener('click',()=>{\n  if(spectatorMode) return;\n  if(!liveGameId || gamePage.hidden){"
)

old_init = """async function init(){
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
"""
new_init = """async function init(){
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

  liveGameId = params.get('game');

  if(liveGameId){
    await openLiveGame();
    return;
  }
"""
replace_once(play, old_init, new_init)

replace_once(
    watch,
    "    <article class=\"game\">",
    "    <a class=\"game\" href=\"play.html?spectate=${encodeURIComponent(g.id)}\" aria-label=\"مشاهدة المباراة مباشرة\">"
)
replace_once(watch, "    </article>`).join('');", "    </a>`).join('');")

replace_once(
    html,
    "const PLAY_CACHE_RESET_VERSION = '20260904-1';",
    "const PLAY_CACHE_RESET_VERSION = '20260907-spectator1';"
)
replace_once(
    html,
    '<script type="module" src="play-live.js?v=20260904-1"></script>',
    '<script type="module" src="play-live.js?v=20260907-spectator1"></script>'
)

print('live spectator patch applied')
