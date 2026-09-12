from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_phase5_matchmaking_rematch.sql'


def sql_text():
    assert SQL.exists(), 'Phase 5 matchmaking/rematch migration is missing'
    return SQL.read_text(encoding='utf-8').lower()


def test_v5_matchmaking_supports_custom_clock_and_rated_state():
    text=sql_text()
    for token in [
        'base_seconds','increment_seconds','rated',
        'start_v5_matchmaking','poll_v5_matchmaking','cancel_v5_matchmaking',
        'for update skip locked','matched_game_id'
    ]:
        assert token in text
    assert 'p_base_seconds between 30 and 3600' in text
    assert 'p_increment_seconds between 0 and 60' in text


def test_rematch_is_linked_locked_and_swaps_source_colors():
    text=sql_text()
    for token in [
        'challenge_type','source_game_id','rematch',
        'v5_request_rematch','v5_get_rematch_state',
        'for update','v_source.black_player_id','v_source.white_player_id'
    ]:
        assert token in text
    assert 'unique' in text
    assert 'source_game_id' in text
