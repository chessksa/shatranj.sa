from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_ranking_scroll_area_is_excluded_from_pull_to_refresh():
    notifications = read("site-notifications.js")
    pull = read("pull-to-refresh.js")
    assert "function installRankingPullGuard()" in notifications
    assert "dataset.noPullRefresh = '1'" in notifications
    assert "installRankingPullGuard();" in notifications
    assert "'[data-no-pull-refresh]'" in pull


def test_mobile_ranking_keeps_internal_vertical_scroll_only():
    css = read("home-theme.css")
    assert "#ranking .table-wrap" in css
    assert "overflow-y:auto!important" in css
    assert "overflow-x:hidden!important" in css
    assert "overscroll-behavior:contain!important" in css
