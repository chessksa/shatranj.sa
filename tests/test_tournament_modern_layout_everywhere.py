from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
play = (ROOT / 'play-v8.js').read_text(encoding='utf-8')
tournaments = (ROOT / 'tournaments.html').read_text(encoding='utf-8')

# Tournament spectators must use the same modern play page/layout as tournament players/demo.
assert "const spectatorGame = params.get('spectate');" in page
assert "const hasGame = Boolean(params.get('game') || spectatorGame);" in page
assert "play-v10.html?spectate=${encodeURIComponent(match.game_id)}" in tournaments

# The modern live script must support a read-only spectator mode while preserving the same board/player UI.
for marker in [
    'let spectatorMode = false;',
    "params.get('spectate')",
    "supabase.rpc('get_spectator_live_game_state'",
    'if(spectatorMode) return false;',
    'async function openSpectatorGame()',
    'await loadTournamentGameContext();',
]:
    assert marker in play, marker

print('tournament modern layout everywhere: PASS')
