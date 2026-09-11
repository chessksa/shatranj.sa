from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'supabase/migrations/20260912_v2_live_play_foundation.sql'
sql = path.read_text(encoding='utf-8') if path.exists() else ''
low = sql.lower()

for token in [
    'create table public.v2_games',
    'create table public.v2_game_moves',
    'create table private.v2_matchmaking_queue',
    'create table private.v2_rating_history',
    'create or replace function public.start_v2_matchmaking',
    'create or replace function public.poll_v2_matchmaking',
    'create or replace function public.cancel_v2_matchmaking',
    'create or replace function public.get_v2_game_state',
    'create or replace function private.commit_v2_move',
    'enable row level security',
    'supabase_realtime',
]:
    assert token in low, token

assert 'auth.uid()' in sql
assert 'array[5,10,15]' in sql.replace(' ', '')
assert 'is_synthetic' in sql
assert 'service_role' not in low
print('V2 live schema contract: PASS')
