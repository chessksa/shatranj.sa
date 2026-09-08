from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
play = (ROOT / 'play-v8.js').read_text(encoding='utf-8')
spectator_page = (ROOT / 'play.html').read_text(encoding='utf-8')
spectator_play = (ROOT / 'play-live.js').read_text(encoding='utf-8')
migration_path = ROOT / 'supabase/migrations/20260909213000_tournament_game_badge.sql'

assert migration_path.exists(), 'tournament game context migration must exist'
migration = migration_path.read_text(encoding='utf-8')

for marker in [
    'public.get_live_game_tournament_context',
    'private.tournament_matches',
    'public.tournaments',
    'tournament_name',
    'round_no',
    'max_round',
]:
    assert marker in migration, marker

for html in [page, spectator_page]:
    for marker in [
        'id="tournamentGameBadge"',
        'id="tournamentGameName"',
        'id="tournamentGameRound"',
        'class="tournament-game-badge"',
    ]:
        assert marker in html, marker

for script in [play, spectator_play]:
    for marker in [
        "$('tournamentGameBadge')",
        "rpc('get_live_game_tournament_context'",
        'loadTournamentGameContext',
        "badge.hidden = true",
        "badge.hidden = false",
        "'النهائي'",
        "'نصف النهائي'",
        "'ربع النهائي'",
    ]:
        assert marker in script, marker

assert 'openSpectatorGame' in spectator_play
assert 'await loadTournamentGameContext();' in spectator_play

print('tournament live-game badge: PASS')
