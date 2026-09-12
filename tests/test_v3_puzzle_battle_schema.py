from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_full_platform_phase3_puzzle_battle.sql'


def test_battle_is_server_scored_and_timed():
    text=SQL.read_text(encoding='utf-8').lower()
    for token in ['v3_puzzle_battles','v3_puzzle_battle_players','v3_puzzle_battle_puzzles','v3_puzzle_battle_moves','ends_at','v3_puzzle_battle_move','v3_finalize_puzzle_battle']:
        assert token in text
    assert 'solution_uci' in text
    assert 'for update' in text


def test_battle_has_atomic_matchmaking():
    text=SQL.read_text(encoding='utf-8').lower()
    assert 'v3_join_puzzle_battle' in text
    assert 'skip locked' in text
    assert 'v3_puzzle_battle_queue' in text
