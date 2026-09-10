from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PULL = ROOT / 'pull-to-refresh.js'


def test_mobile_pull_to_refresh_has_required_guardrails():
    assert PULL.exists(), 'pull-to-refresh.js must exist'
    source = PULL.read_text(encoding='utf-8')
    assert 'touchstart' in source
    assert 'touchmove' in source
    assert 'touchend' in source
    assert 'location.reload()' in source
    assert 'navigator.maxTouchPoints' in source
    assert 'window.scrollY' in source
    assert "'.board'" in source or '".board"' in source
    assert 'scrollHeight' in source and 'clientHeight' in source
    assert 'PULL_THRESHOLD' in source
