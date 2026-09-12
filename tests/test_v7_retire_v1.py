from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20260912_phase7_retire_v1.sql"
API = ROOT / "v2/play/api.js"

LEGACY_SIGNATURES = [
    "create_live_game(text)",
    "join_live_game(text,text)",
    "submit_live_move(uuid,text,text,text,text,text,text,text)",
    "resign_live_game(uuid,text)",
    "offer_live_draw(uuid,text)",
    "respond_live_draw(uuid,text,boolean)",
    "claim_live_timeout(uuid,text)",
    "cancel_live_game_grace(uuid,text)",
    "start_matchmaking(integer)",
    "poll_matchmaking()",
    "cancel_matchmaking()",
]

LEGACY_CALL_NAMES = [
    "create_live_game",
    "join_live_game",
    "submit_live_move",
    "resign_live_game",
    "offer_live_draw",
    "respond_live_draw",
    "claim_live_timeout",
    "cancel_live_game_grace",
    "start_matchmaking",
    "poll_matchmaking",
    "cancel_matchmaking",
]


def test_v1_retirement_migration_revokes_legacy_execution_and_cleans_stale_queue():
    assert MIGRATION.exists(), "Phase 7 migration is missing"
    sql = MIGRATION.read_text(encoding="utf-8").lower()

    for signature in LEGACY_SIGNATURES:
        assert signature in sql, f"missing legacy signature: {signature}"

    assert "revoke execute" in sql
    assert "from public, anon, authenticated" in sql
    assert "private.matchmaking_queue" in sql
    assert "status = 'cancelled'" in sql or "status='cancelled'" in sql
    assert "status = 'waiting'" in sql or "status='waiting'" in sql


def test_current_v2_play_api_does_not_use_legacy_v1_rpcs():
    source = API.read_text(encoding="utf-8")
    for name in LEGACY_CALL_NAMES:
        assert f"rpc('{name}'" not in source
        assert f'rpc("{name}"' not in source

    assert "start_v2_matchmaking" in source
    assert "start_v5_matchmaking" in source
    assert "functions.invoke('live-game-v2'" in source
