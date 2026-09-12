from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIVE = ROOT / 'supabase/functions/live-game-v2/index.ts'


def test_live_game_applies_increment_after_legal_move():
    text = LIVE.read_text(encoding='utf-8')
    assert 'increment_seconds' in text
    assert 'incrementMs' in text
    assert "moverColor === 'w'" in text
    assert 'whiteMs += incrementMs' in text
    assert 'blackMs += incrementMs' in text
