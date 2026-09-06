from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
watch = (ROOT / 'watch.html').read_text(encoding='utf-8')
play = (ROOT / 'play-live.js').read_text(encoding='utf-8')
html = (ROOT / 'play.html').read_text(encoding='utf-8')
migration = ROOT / 'supabase/migrations/20260907013000_live_spectator_mode.sql'

assert 'play.html?spectate=' in watch, 'watch cards must open spectator board'
assert 'spectatorMode' in play, 'play-live.js must have spectator mode'
assert "rpc('get_spectator_live_game_state'" in play, 'spectator must use sanitized read RPC'
assert 'if(spectatorMode) return;' in play, 'spectator clicks must never submit moves'
assert "location.href=spectatorMode?'watch.html':'index.html'" in play.replace(' ', ''), 'spectator back action must return to watch page'
assert 'play-live.js?v=20260907-spectator1' in html, 'play-live cache token must be bumped'
assert migration.exists(), 'spectator migration must exist'
sql = migration.read_text(encoding='utf-8')
for marker in [
    'create or replace function public.get_spectator_live_game_state',
    'grant execute on function public.get_spectator_live_game_state(uuid) to anon, authenticated',
    'revoke all on function public.get_spectator_live_game_state(uuid) from public',
]:
    assert marker in sql, marker

print('live spectator mode: PASS')
