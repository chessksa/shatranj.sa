from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'supabase/migrations/20260912_full_platform_phase3_standard_variants.sql'
EDGE = ROOT / 'supabase/functions/standard-variant-v3/index.ts'
UI = ROOT / 'variants.html'


def test_standard_variant_schema_contract():
    text = MIGRATION.read_text(encoding='utf-8')
    assert "'threecheck'" in text
    assert "'kingofthehill'" in text
    assert 'white_checks' in text
    assert 'black_checks' in text
    assert 'v3_queue_variant_server' in text
    assert 'v3_commit_standard_variant_move_server' in text


def test_standard_variant_edge_is_server_authoritative():
    text = EDGE.read_text(encoding='utf-8')
    assert "npm:chess.js@1.4.0" in text
    assert "variant === 'threecheck'" in text
    assert "variant === 'kingofthehill'" in text
    assert 'isCenterSquare' in text
    assert 'third-check' in text
    assert 'king-of-the-hill' in text
    assert 'expectedPly' in text
    assert 'SUPABASE_SERVICE_ROLE_KEY' in text


def test_variants_ui_exposes_supported_modes():
    text = UI.read_text(encoding='utf-8')
    assert 'Chess960' in text
    assert 'Three-Check' in text
    assert 'King of the Hill' in text
