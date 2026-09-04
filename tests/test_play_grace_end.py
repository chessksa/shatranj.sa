from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase" / "migrations" / "20260904_grace_end_window.sql"


def test_side_panel_keeps_search_card_size_and_replaces_flip_with_end():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert "#topPlayerCard:has(" not in html
    assert "opponent-slot{position:relative;overflow:hidden;min-height:150px}" in html
    assert 'id="endGraceBtn"' in html
    assert 'id="endGraceCountdown"' in html
    assert 'id="flipBoard"' not in html
    assert "إنهاء" in html


def test_prematch_end_button_is_disabled_until_an_opponent_is_found():
    js = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    assert "$('endGraceBtn').disabled = true;" in js
    assert "$('flipBoard')" not in js


def test_live_game_uses_server_grace_window_and_handles_no_rating_cancel():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "get_live_game_grace_state" in js
    assert "cancel_live_game_grace" in js
    assert "row.status==='cancelled'" in js
    assert "graceDeadline" in js
    assert "$('flipBoard')" not in js


def test_grace_end_database_migration_is_server_enforced_and_unrated():
    assert MIGRATION.exists()
    sql = MIGRATION.read_text(encoding="utf-8")
    assert "create or replace function public.get_live_game_grace_state" in sql.lower()
    assert "create or replace function public.cancel_live_game_grace" in sql.lower()
    assert "g.created_at + interval '5 seconds'" in sql.lower()
    assert "status='cancelled'" in sql.lower()
    assert "result=null" in sql.lower()
    assert "grant execute" in sql.lower()
    assert "to authenticated" in sql.lower()

# Fresh CI verification marker for the approved implementation.
