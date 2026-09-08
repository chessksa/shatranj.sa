from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# play-v10.html: route spectators through the same modern live page/script.
path = ROOT / 'play-v10.html'
text = path.read_text(encoding='utf-8')
text = text.replace(
    "    const computerMode = params.has('computer');\n    const hasGame = Boolean(params.get('game'));",
    "    const computerMode = params.has('computer');\n    const spectatorGame = params.get('spectate');\n    const hasGame = Boolean(params.get('game') || spectatorGame);"
)
text = text.replace(
    "s.src='play-v8.js?v=20260909-tournamentbanner2';",
    "s.src='play-v8.js?v=20260909-tournamentspectator1';"
)
path.write_text(text, encoding='utf-8')

# tournaments.html: tournament watchers use the modern play layout too.
path = ROOT / 'tournaments.html'
text = path.read_text(encoding='utf-8')
text = text.replace(
    'href="play.html?spectate=${encodeURIComponent(match.game_id)}"',
    'href="play-v10.html?spectate=${encodeURIComponent(match.game_id)}"'
)
path.write_text(text, encoding='utf-8')

# play-v8.js: add read-only spectator support without changing the modern board/layout.
path = ROOT / 'play-v8.js'
text = path.read_text(encoding='utf-8')
text = text.replace(
    "let liveGameId = null;\nlet seatKey = null;",
    "let liveGameId = null;\nlet spectatorMode = false;\nlet seatKey = null;"
)
text = text.replace(
    "function handleBoardInput(event){\n  if(event.type===INPUT_EVENT_TYPE.moveInputStarted){",
    "function handleBoardInput(event){\n  if(spectatorMode) return false;\n  if(event.type===INPUT_EVENT_TYPE.moveInputStarted){"
)
text = text.replace(
    "async function maybeHandleDrawOffer(){\n  if(!serverState?.draw_offer_by || serverState.status!=='active') return;",
    "async function maybeHandleDrawOffer(){\n  if(spectatorMode) return;\n  if(!serverState?.draw_offer_by || serverState.status!=='active') return;"
)
text = text.replace(
    "    const { data, error } = await supabase.rpc('get_live_game_state',{p_game_id:liveGameId});",
    "    const request = spectatorMode\n      ? supabase.rpc('get_spectator_live_game_state',{p_game_id:liveGameId})\n      : supabase.rpc('get_live_game_state',{p_game_id:liveGameId});\n    const { data, error } = await request;"
)
marker = "async function openLiveGame(){\n"
insert = """async function openSpectatorGame(){
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

"""
if insert not in text:
    text = text.replace(marker, insert + marker)
text = text.replace(
    "leaveBtn.addEventListener('click',async()=>{\n  if(!matchmakingWaiting.hidden) await cancelMatchmaking();\n  location.href='index.html';\n});",
    "leaveBtn.addEventListener('click',async()=>{\n  if(!matchmakingWaiting.hidden) await cancelMatchmaking();\n  location.href=spectatorMode?'tournaments.html':'index.html';\n});"
)
text = text.replace(
    "reportBtn.addEventListener('click',()=>{\n  if(!liveGameId || gamePage.hidden){",
    "reportBtn.addEventListener('click',()=>{\n  if(spectatorMode) return;\n  if(!liveGameId || gamePage.hidden){"
)
old_init = """  const { data:{session} }=await supabase.auth.getSession();
  if(!session){
    location.href='index.html#register';
    return;
  }
  authUserId=session.user.id;

  const params = new URLSearchParams(location.search);
  liveGameId = params.get('game');

  if(liveGameId){
    await openLiveGame();
    return;
  }
"""
new_init = """  const params = new URLSearchParams(location.search);
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
"""
text = text.replace(old_init, new_init)
path.write_text(text, encoding='utf-8')
