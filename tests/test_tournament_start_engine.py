from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
admin = (ROOT / 'admin.js').read_text(encoding='utf-8')
public_page = (ROOT / 'tournaments.html').read_text(encoding='utf-8')
migration = (ROOT / 'supabase/migrations/20260907010000_tournament_start_engine.sql').read_text(encoding='utf-8')
permissions = (ROOT / 'supabase/migrations/20260907011000_tournament_start_engine_permissions.sql').read_text(encoding='utf-8')
rating_fix = (ROOT / 'supabase/migrations/20260907012000_tournament_rating_step.sql').read_text(encoding='utf-8')

for marker in [
    'create table if not exists private.tournament_matches',
    'private.start_tournament_core',
    'private.create_tournament_live_game',
    'private.advance_tournament_match',
    'private.process_tournament_live_game',
    'private.start_due_tournaments',
    'public.admin_start_tournament',
    'public.get_tournament_bracket',
    'public.get_my_tournament_match_access',
    'public.get_my_active_tournament_matches',
    "cron.schedule('start-due-tournaments'",
    "'1/2-1/2'",
]:
    assert marker in migration, marker

assert 'values(v_game_id,v_white_player,v_black_player,10);' in rating_fix
assert 'values(v_game_id,v_white_player,v_black_player,1);' not in rating_fix

for marker in [
    'revoke execute on function public.admin_start_tournament(uuid) from anon',
    'revoke execute on function public.get_my_tournament_match_access(uuid) from anon',
    'revoke execute on function public.get_my_active_tournament_matches() from anon',
]:
    assert marker in permissions, marker

assert 'ابدأ البطولة الآن' in admin
assert "rpc('admin_start_tournament'" in admin
assert "data-action=\"startTournament\"" in admin

assert 'مواجهات البطولة' in public_page
assert "rpc('get_tournament_bracket'" in public_page
assert "rpc('get_my_tournament_match_access'" in public_page
assert "sessionStorage.setItem('shatranj_live_game_id'" in public_page
assert 'دخول المباراة' in public_page

print('tournament start engine: PASS')
