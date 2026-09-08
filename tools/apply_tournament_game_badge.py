from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing patch anchor: {label}')
    return text.replace(old, new, 1)

badge_html = '''        <div class="tournament-game-badge" id="tournamentGameBadge" hidden aria-label="مباراة بطولة">
          <strong>بطولة</strong>
          <span class="tournament-game-context"><span id="tournamentGameName">—</span><span aria-hidden="true">·</span><span id="tournamentGameRound">—</span></span>
        </div>
'''

badge_css = '''
    .tournament-game-badge{position:absolute;z-index:18;top:8px;left:50%;transform:translateX(-50%);max-width:min(78%,520px);min-height:29px;padding:4px 10px;border:1px solid rgba(224,181,103,.78);border-radius:10px;background:rgba(3,43,48,.95);box-shadow:0 6px 16px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;gap:7px;direction:rtl;white-space:nowrap;font-size:11px;line-height:1.15}
    .tournament-game-badge strong{color:#ffbd73;font-size:11px;font-weight:900}.tournament-game-context{display:flex;align-items:center;gap:5px;min-width:0;color:#f4efe6;font-weight:800}.tournament-game-context #tournamentGameName{max-width:250px;overflow:hidden;text-overflow:ellipsis}.tournament-game-context #tournamentGameRound{color:#efcf7c}
    @media(max-width:900px){.tournament-game-badge{top:5px;max-width:82%;min-height:25px;padding:3px 8px;font-size:10px}.tournament-game-badge strong{font-size:10px}.tournament-game-context #tournamentGameName{max-width:140px}}
'''

context_js = '''
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
  if(!badge || !liveGameId || !supabase) return;
  badge.hidden = true;
  try{
    const {data,error}=await supabase.rpc('get_live_game_tournament_context',{p_game_id:liveGameId});
    if(error) throw error;
    const row=firstRow(data);
    if(!row?.tournament_name) return;
    if(tournamentGameNameEl) tournamentGameNameEl.textContent=String(row.tournament_name);
    if(tournamentGameRoundEl) tournamentGameRoundEl.textContent=tournamentRoundLabel(row.round_no,row.max_round);
    badge.hidden = false;
  }catch(err){
    console.warn('تعذر تحميل بيانات بطولة المباراة',err);
    badge.hidden = true;
  }
}
'''

migration = '''-- Expose tournament context for a live game so play and spectator pages can show a compact badge.
create or replace function public.get_live_game_tournament_context(p_game_id uuid)
returns table(
  tournament_id uuid,
  tournament_name text,
  round_no integer,
  max_round integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id,
         t.name,
         tm.round_no,
         (
           select max(all_matches.round_no)
           from private.tournament_matches all_matches
           where all_matches.tournament_id=tm.tournament_id
         )::integer as max_round
  from private.tournament_matches tm
  join public.tournaments t on t.id=tm.tournament_id
  where tm.live_game_id=p_game_id
  limit 1;
$$;

revoke all on function public.get_live_game_tournament_context(uuid) from public;
grant execute on function public.get_live_game_tournament_context(uuid) to anon,authenticated;
'''

# Modern live-play page.
path = ROOT / 'play-v10.html'
text = path.read_text(encoding='utf-8')
text = replace_once(text, '    /* Mobile in-page pull refresh */', badge_css + '\n    /* Mobile in-page pull refresh */', 'play-v10 badge css')
text = replace_once(text, '      <section class="board-panel">\n        <div class="board-frame">', '      <section class="board-panel" style="position:relative">\n' + badge_html + '        <div class="board-frame">', 'play-v10 badge markup')
text = text.replace('play-v8.js?v=20260908-lastmove4', 'play-v8.js?v=20260909-tournamentbadge1')
path.write_text(text, encoding='utf-8')

# Modern live-play controller.
path = ROOT / 'play-v8.js'
text = path.read_text(encoding='utf-8')
text = replace_once(text, "const drawOfferBtn = $('drawOffer');", "const drawOfferBtn = $('drawOffer');\nconst tournamentGameBadge = $('tournamentGameBadge');\nconst tournamentGameNameEl = $('tournamentGameName');\nconst tournamentGameRoundEl = $('tournamentGameRound');", 'play-v8 badge elements')
text = replace_once(text, "function toast(message, ms=2200){", context_js + "\nfunction toast(message, ms=2200){", 'play-v8 context helper')
text = replace_once(text, "  showGamePage();\n  await refreshLiveGame(true);", "  showGamePage();\n  await loadTournamentGameContext();\n  await refreshLiveGame(true);", 'play-v8 open live context')
path.write_text(text, encoding='utf-8')

# Spectator/legacy play page.
path = ROOT / 'play.html'
text = path.read_text(encoding='utf-8')
text = replace_once(text, '  </style>', badge_css + '\n  </style>', 'play.html badge css')
text = replace_once(text, '      <section class="board-panel">\n        <div class="board-frame">', '      <section class="board-panel" style="position:relative">\n' + badge_html + '        <div class="board-frame">', 'play.html badge markup')
text = text.replace("const PLAY_CACHE_RESET_VERSION = '20260907-spectator1';", "const PLAY_CACHE_RESET_VERSION = '20260909-tournamentbadge1';")
text = text.replace('play-live.js?v=20260907-spectator1', 'play-live.js?v=20260909-tournamentbadge1')
path.write_text(text, encoding='utf-8')

# Spectator/legacy play controller.
path = ROOT / 'play-live.js'
text = path.read_text(encoding='utf-8')
text = replace_once(text, "const drawOfferBtn = $('drawOffer');", "const drawOfferBtn = $('drawOffer');\nconst tournamentGameBadge = $('tournamentGameBadge');\nconst tournamentGameNameEl = $('tournamentGameName');\nconst tournamentGameRoundEl = $('tournamentGameRound');", 'play-live badge elements')
text = replace_once(text, "function toast(message, ms=2200){", context_js + "\nfunction toast(message, ms=2200){", 'play-live context helper')
text = replace_once(text, "  document.title='مشاهدة مباشرة | شطرنج العرب';\n  await refreshLiveGame(true);", "  document.title='مشاهدة مباشرة | شطرنج العرب';\n  await loadTournamentGameContext();\n  await refreshLiveGame(true);", 'spectator context load')
text = replace_once(text, "  showGamePage();\n  await refreshLiveGame(true);", "  showGamePage();\n  await loadTournamentGameContext();\n  await refreshLiveGame(true);", 'legacy live context load')
path.write_text(text, encoding='utf-8')

migration_path = ROOT / 'supabase/migrations/20260909213000_tournament_game_badge.sql'
if migration_path.exists():
    raise SystemExit('migration already exists unexpectedly')
migration_path.write_text(migration, encoding='utf-8')

print('tournament game badge implementation applied')
