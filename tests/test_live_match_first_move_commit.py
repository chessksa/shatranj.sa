"""Regression guard for the live-game first-move (22P02) repair."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
migration = (
    ROOT / "supabase/migrations/20261018174500_fix_v2_first_move_composite.sql"
).read_text(encoding="utf-8").lower()
edge = (ROOT / "supabase/functions/live-game-v2/index.ts").read_text(encoding="utf-8")

assert "create or replace function public.commit_v2_move_server" in migration
assert "select * into v_game\n  from private.commit_v2_move(" in migration
assert "select private.commit_v2_move(" not in migration
assert "v_game := private.settle_v2_rating(game_id)" in migration
assert "from public, anon, authenticated" in migration
assert "to service_role" in migration
assert "commit_v2_move_server" in edge
print("First live move composite-row regression: PASS")
