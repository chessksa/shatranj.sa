from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SESSIONS=ROOT/'supabase/migrations/20260912_full_platform_phase3_puzzle_security.sql'
LOCKDOWN=ROOT/'supabase/migrations/20260912_full_platform_phase3_puzzle_security_lockdown.sql'
APP=ROOT/'v2/puzzles/app.mjs'


def test_puzzle_solutions_are_server_hidden_after_lockdown():
    session_text=SESSIONS.read_text(encoding='utf-8').lower()
    lock_text=LOCKDOWN.read_text(encoding='utf-8').lower()
    assert 'private.v3_puzzle_sessions' in session_text
    assert 'v3_start_puzzle_session' in session_text
    assert 'v3_submit_puzzle_session_move' in session_text
    assert 'v3_restart_puzzle_session' in session_text
    assert 'revoke select on table public.v2_puzzles from anon,authenticated' in lock_text
    assert 'revoke all on function public.v2_submit_puzzle_attempt' in lock_text


def test_puzzle_browser_never_fetches_solution_array():
    text=APP.read_text(encoding='utf-8')
    assert ".from('v2_puzzles')" not in text
    assert 'solution_uci' not in text
    assert 'v3_start_puzzle_session' in text
    assert 'v3_submit_puzzle_session_move' in text
