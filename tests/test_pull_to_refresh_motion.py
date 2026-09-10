from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "pull-to-refresh.js").read_text(encoding="utf-8")
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")


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
    assert "refreshIndicator" in SOURCE


def test_refresh_indicator_is_eight_rotating_gold_dots():
    assert "pull-refresh-dots" in SOURCE
    assert SOURCE.count('class="pull-refresh-dot"') == 8
    assert "@keyframes shatranjPullDotsSpin" in SOURCE
    assert "#d8b665" in SOURCE
    assert "pull-refresh-ring" not in SOURCE


def test_home_loader_cache_busts_site_presence_for_pull_refresh():
    assert "site-presence\\.js\\?v=" in INDEX
    assert "site-presence.js?v='+runtimeVersion" in INDEX
