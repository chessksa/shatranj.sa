from pathlib import Path

root = Path(__file__).resolve().parents[1]
schema = (root / 'schema.sql').read_text(encoding='utf-8')
migration = (root / 'supabase/migrations/20260905_shatranj_arab.sql').read_text(encoding='utf-8')

assert 'شطرنج العرب' in schema
assert "[+][1-9][0-9]{7,14}" in schema
assert "[+][1-9][0-9]{7,14}" in migration
assert 'create or replace function public.claim_player_profile' in migration
assert "[[:space:]()-]" in migration
assert 'chr(43)' in migration
assert 'invalid saudi mobile' not in migration.lower()

print('Arab database schema: PASS')
