from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    target = ROOT / path
    assert target.is_file(), f"missing required file: {path}"
    return target.read_text(encoding="utf-8")


def test_admin_page_lists_computer_games_and_loads_module():
    html = read("admin.html")
    assert 'id="computerGamesTableBody"' in html
    assert 'admin-computer-games.js' in html
    assert 'مباريات ضد الكمبيوتر' in html


def test_admin_computer_module_is_read_only_and_links_to_watch_page():
    js = read("admin-computer-games.js")
    assert ".from('computer_games')" in js
    assert "computer-watch.html?game=" in js
    assert ".insert(" not in js
    assert ".update(" not in js
    assert ".delete(" not in js


def test_computer_watch_is_read_only_and_requires_session():
    html = read("computer-watch.html")
    assert "getSession" in html
    assert ".from('computer_games')" in html
    assert "ليس لديك صلاحية" in html
    assert ".insert(" not in html
    assert ".update(" not in html
    assert ".delete(" not in html


def test_database_migration_limits_computer_game_read_access_to_admin_scope():
    sql = read("supabase/migrations/20260908_admin_computer_spectator.sql")
    assert "private.can_view_computer_game" in sql
    assert "private.admin_scope_allows" in sql
    assert "to authenticated" in sql.lower()
    assert "grant select on table public.computer_games to authenticated" in sql.lower()
    assert "revoke all on table public.computer_games from anon" in sql.lower()
    assert "computer_games_admin_read" in sql
