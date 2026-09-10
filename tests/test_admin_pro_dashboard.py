from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_enhanced_admin_dashboard_refreshes_core_stats_itself():
    js = (ROOT / "admin-pro.js").read_text(encoding="utf-8")
    assert "admin_dashboard_stats_v2" in js
    for target in ["totalPlayers", "activeGames", "finishedGames", "openReports"]:
        assert target in js
    for field in ["total_players", "active_games", "finished_games", "open_reports"]:
        assert field in js


def test_enhanced_admin_dashboard_refreshes_recent_activity_itself():
    js = (ROOT / "admin-pro.js").read_text(encoding="utf-8")
    for token in [
        "admin_list_players_v3",
        "admin_list_games_v2",
        "admin_list_reports_v2",
        "admin_list_actions_v2",
        "renderRecentPlayers",
        "renderRecentGames",
        "renderRecentReports",
    ]:
        assert token in js, token


def test_enhanced_admin_layer_is_loaded_from_admin_page_pipeline():
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")
    assert "admin-pro.js?v=20260910-2" in loader


def test_admin_tables_are_fully_visible_on_mobile():
    js = (ROOT / "admin-pro.js").read_text(encoding="utf-8")
    css = (ROOT / "admin-pro.css").read_text(encoding="utf-8")
    for token in ["enhanceResponsiveTables", "data-label", "MutationObserver"]:
        assert token in js, token
    for token in [
        "@media(max-width:760px)",
        ".table-wrap table",
        ".table-wrap thead",
        "td::before",
        "content:attr(data-label)",
    ]:
        assert token in css, token


if __name__ == "__main__":
    test_enhanced_admin_dashboard_refreshes_core_stats_itself()
    test_enhanced_admin_dashboard_refreshes_recent_activity_itself()
    test_enhanced_admin_layer_is_loaded_from_admin_page_pipeline()
    test_admin_tables_are_fully_visible_on_mobile()
    print("Enhanced admin dashboard tests passed")
