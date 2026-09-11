from pathlib import Path

sql_path = Path('supabase/migrations/20260912_v2_live_actions.sql')
sql = sql_path.read_text(encoding='utf-8') if sql_path.exists() else ''
edge = Path('supabase/functions/live-game-v2/index.ts').read_text(encoding='utf-8')
api = Path('v2/play/api.js').read_text(encoding='utf-8')
app = Path('v2/play/app.js').read_text(encoding='utf-8')
low = sql.lower()

for token in [
    'create or replace function private.settle_v2_rating',
    'create or replace function private.v2_game_action',
    'create or replace function public.v2_game_action_server',
    "'grace_end'", "'resign'", "'offer_draw'", "'respond_draw'", "'timeout'",
    'rating_settled', 'v2_rating_history', 'games_count', 'wins', 'draws', 'losses',
    'interval \'5 seconds\'', 'clock_timestamp()', 'for update', 'greatest(0',
    'grant execute on function public.v2_game_action_server', 'to service_role'
]:
    assert token in low, token

assert '+ 10' in sql or '+10' in sql
assert '- 10' in sql or '-10' in sql
assert 'private.settle_v2_rating' in low

for token in ['grace_end', 'resign', 'offer_draw', 'respond_draw', 'timeout', 'v2_game_action_server']:
    assert token in edge, token
for token in ['timeoutGame', 'graceEnd', 'resignGame', 'offerDraw', 'respondDraw']:
    assert token in api, token
for token in ['graceEnd', 'resignGame', 'offerDraw', 'respondDraw', 'timeoutGame', 'graceButton.addEventListener', 'resignButton.addEventListener', 'drawButton.addEventListener']:
    assert token in app, token

assert 'ratingDelta' not in app
assert 'rating_delta' not in app
print('V2 live actions: PASS')
