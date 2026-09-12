from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / 'supabase/migrations/20260912_phase6_rate_fairplay.sql'
LIVE = ROOT / 'supabase/functions/live-game-v2/index.ts'
STDVAR = ROOT / 'supabase/functions/standard-variant-v3/index.ts'
ADVVAR = ROOT / 'supabase/functions/advanced-variant-v4/index.ts'
CHESS960 = ROOT / 'supabase/functions/variant-game-v3/index.ts'


def test_rate_limit_and_fair_play_schema_contract():
    assert SQL.exists(), 'Phase 6 rate/fair-play migration is missing'
    text = SQL.read_text(encoding='utf-8').lower()
    for token in [
        'private.v6_rate_buckets',
        'v6_consume_rate_limit_server',
        'private.v6_fair_play_move_events',
        'private.v6_fair_play_cases',
        'v6_record_move_event_server',
        'admin_v6_list_fair_play_cases',
        'admin_v6_resolve_fair_play_case',
        'trg_v6_limit_v2_messages',
        'trg_v6_limit_v2_challenges',
        'trg_v6_limit_v3_reports',
    ]:
        assert token in text
    assert 'grant execute on function public.v6_consume_rate_limit_server' in text
    assert 'to service_role' in text
    assert 'grant execute on function public.v6_record_move_event_server' in text
    assert 'no automatic suspension' in text


def test_game_engines_use_server_rate_limit_and_move_telemetry():
    for path in [LIVE, STDVAR, ADVVAR, CHESS960]:
        text = path.read_text(encoding='utf-8')
        assert 'v6_consume_rate_limit_server' in text, path
        assert 'v6_record_move_event_server' in text, path
        assert 'elapsedMs' in text or 'elapsed' in text, path
