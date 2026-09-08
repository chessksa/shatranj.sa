from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_public_watch_lists_computer_games_via_rpc():
    watch = (ROOT / 'watch.html').read_text(encoding='utf-8')
    assert "rpc('list_public_computer_games')" in watch
    assert 'computer-watch.html?game=' in watch


def test_computer_watch_is_public_read_only_rpc():
    page = (ROOT / 'computer-watch.html').read_text(encoding='utf-8')
    assert "rpc('get_public_computer_game'" in page
    assert 'auth.getSession()' not in page
    assert ".from('computer_games')" not in page
    assert 'مشاهدة فقط' in page


def test_public_rpc_migration_is_limited_and_anon_callable():
    migration = (ROOT / 'supabase/migrations/20260908_public_computer_spectator.sql').read_text(encoding='utf-8')
    assert 'create or replace function public.list_public_computer_games()' in migration.lower()
    assert 'create or replace function public.get_public_computer_game(p_game_id uuid)' in migration.lower()
    assert "where g.status = 'active'" in migration.lower()
    assert 'grant execute on function public.list_public_computer_games() to anon, authenticated;' in migration.lower()
    assert 'grant execute on function public.get_public_computer_game(uuid) to anon, authenticated;' in migration.lower()
    assert 'grant select on table public.computer_games to anon' not in migration.lower()
