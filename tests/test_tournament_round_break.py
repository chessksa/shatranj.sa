from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'supabase/migrations/20260909210000_tournament_round_break.sql'
PAGE = (ROOT / 'tournaments.html').read_text(encoding='utf-8')

assert MIGRATION.exists(), 'round-break migration must exist'
sql = MIGRATION.read_text(encoding='utf-8')

for marker in [
    'ready_opens_at timestamptz',
    "interval '3 minutes'",
    'private.schedule_tournament_next_round',
    "status not in ('finished','bye')",
    "'round_break'::text",
    'ready_opens_at > clock_timestamp()',
    'public.get_tournament_bracket',
    'public.get_my_tournament_match_access',
]:
    assert marker in sql, marker

# The round-break guard must happen before the participant is marked ready.
access_start = sql.index('create function public.get_my_tournament_match_access')
access = sql[access_start:]
assert access.index("'round_break'::text") < access.index('player_one_ready_at=coalesce'), 'break must not count as player readiness'

# First round is explicitly open immediately; later rounds are scheduled only after the previous round completes.
assert "new.round_no=1" in sql
assert 'max(coalesce(tm.finished_at,tm.created_at))' in sql

for marker in [
    'round-break-countdown',
    'data-round-open-at',
    'updateTournamentRoundCountdowns',
    'الدور التالي خلال',
    "row?.state==='round_break'",
    'ready_opens_at',
]:
    assert marker in PAGE, marker

print('tournament three-minute round break: PASS')
