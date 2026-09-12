from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_full_platform_phase3_puzzle_security.sql'
APP=ROOT/'v2/puzzles/app.mjs'


def test_puzzle_solutions_are_not_directly_readable():
    text=SQL.read_text(encoding='utf-8').lower()
    assert 'revoke select on table public.v2_puzzles from anon,authenticated' in text
    assert 'private.v3_puzzle_sessions' in text
    assert 'v3_start_puzzle_session' in text
    assert 'v3_submit_puzzle_session_move' in text
    assert 'v3_restart_puzzle_session' in text


def test_puzzle_browser_never_fetches_solution_array():
    text=APP.read_text(encoding='utf-8')
    assert ".from('v2_puzzles')" not in text
    assert 'solution_uci' not in text
    assert 'v3_start_puzzle_session' in text
    assert 'v3_submit_puzzle_session_move' in text
