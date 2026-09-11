from pathlib import Path

root = Path(__file__).resolve().parents[1]
edge_path = root / 'supabase/functions/live-game-v2/index.ts'
edge = edge_path.read_text(encoding='utf-8') if edge_path.exists() else ''
server_path = root / 'supabase/migrations/20260912_v2_live_move_server_rpc.sql'
server_sql = server_path.read_text(encoding='utf-8') if server_path.exists() else ''

for token in [
    'npm:chess.js@1.4.0',
    'authorization',
    'auth.getUser',
    'expectedPly',
    'new Chess(',
    '.move(',
    'commit_v2_move_server',
    'SUPABASE_SERVICE_ROLE_KEY',
]:
    assert token.lower() in edge.lower(), token

assert 'create or replace function public.commit_v2_move_server' in server_sql.lower()
assert 'private.commit_v2_move' in server_sql.lower()
assert 'grant execute on function public.commit_v2_move_server' in server_sql.lower()
assert 'to service_role' in server_sql.lower()

for forbidden in ['p_new_fen', 'p_san', 'p_result']:
    assert forbidden not in edge, forbidden

assert (root / 'supabase/functions/live-game-v2/deno.json').exists()
print('V2 Edge Function contract: PASS')
