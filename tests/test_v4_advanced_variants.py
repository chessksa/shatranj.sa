from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'supabase/migrations/20260912_phase4_advanced_variants.sql'


def test_advanced_variant_schema_supports_all_modes():
    text = MIGRATION.read_text(encoding='utf-8').lower()
    for token in [
        'crazyhouse', 'atomic', 'antichess', 'horde', 'racingkings',
        'v3_variant_games', 'v3_variant_queue', 'v3_variant_ratings'
    ]:
        assert token in text


def test_advanced_variant_move_commit_is_service_only_and_versioned():
    text = MIGRATION.read_text(encoding='utf-8').lower()
    assert 'v4_commit_advanced_variant_move_server' in text
    assert 'p_expected_ply' in text
    assert "revoke all on function public.v4_commit_advanced_variant_move_server" in text
    assert 'service_role' in text
    assert 'private.v3_settle_variant_rating' in text
