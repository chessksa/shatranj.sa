from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
play = (ROOT / 'play-v8.js').read_text(encoding='utf-8')
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

for marker in [
    'id="tournamentGameBadge"',
    'id="tournamentGameName"',
    'id="tournamentGameRound"',
    'class="tournament-game-badge"',
]:
    assert marker in page, marker

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
    assert marker in play, marker

print('tournament live-game badge: PASS')
