from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "pull-to-refresh.js").read_text(encoding="utf-8")


def test_pull_to_refresh_moves_page_with_finger_and_restores_it():
    assert "translate3d(0," in SOURCE
    assert "document.body.style.transform" in SOURCE
    assert "document.body.style.transition" in SOURCE
    assert "restorePagePosition" in SOURCE


def test_pull_to_refresh_has_longer_drag_and_gold_refresh_indicator():
    assert "const PULL_THRESHOLD = 132;" in SOURCE
    assert "const MAX_PAGE_OFFSET = 132;" in SOURCE
    assert "shatranj-pull-refresh-indicator" in SOURCE
    assert "#d8b665" in SOURCE
    assert "rotate(" in SOURCE
    assert "refreshIndicator" in SOURCE
