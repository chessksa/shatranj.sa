from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'supabase/functions/advanced-variant-v4/index.ts'


def test_advanced_variant_edge_uses_server_rules_engine():
    text = SRC.read_text(encoding='utf-8')
    for token in [
        'npm:chessops@0.15.1', 'defaultPosition', 'setupPosition',
        'parseFen', 'makeFen', 'parseUci', 'makeUci', 'isLegal',
        'expectedPly', 'SUPABASE_SERVICE_ROLE_KEY',
        'v4_commit_advanced_variant_move_server'
    ]:
        assert token in text


def test_advanced_variant_edge_supports_all_five_modes_and_drops():
    text = SRC.read_text(encoding='utf-8').lower()
    for token in ['crazyhouse', 'atomic', 'antichess', 'horde', 'racingkings']:
        assert token in text
    assert 'dropdests' in text
    assert 'legalmoves' in text
    assert "action === 'state'" in text or 'action==="state"' in text
    assert "action === 'move'" in text or 'action==="move"' in text
