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
    responsive = (ROOT / "admin-responsive-tables.js").read_text(encoding="utf-8")
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")
    for token in [
        "enhanceResponsiveTables",
        "data-label",
        "MutationObserver",
        "@media(max-width:760px)",
        ".table-wrap table",
        ".table-wrap thead",
        "td::before",
        "content:attr(data-label)",
    ]:
        assert token in responsive, token
    assert "admin-responsive-tables.js?v=20260910-1" in loader or "admin-responsive-tables.js?v=20260910-2" in loader


def test_players_mobile_list_is_compact_clickable_and_keeps_other_tables_as_cards():
    layer = (ROOT / "admin-player-list.js").read_text(encoding="utf-8")
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")

    for token in [
        "player-list-row",
        "data-player-row",
        "player-control-grid",
        "player-control-icon",
        "#playersView .table-wrap table",
        "#playersView .table-wrap thead",
        "#playersView .table-wrap tbody tr.player-list-row",
        "#playersView .table-wrap th:nth-child(4)",
        "#playersView .table-wrap td:nth-child(4)",
        "#playersView .table-wrap th:nth-child(6)",
        "#playersView .table-wrap td:nth-child(6)",
        "#playersView .table-wrap th:nth-child(7)",
        "#playersView .table-wrap td:nth-child(7)",
        "#playersView .table-wrap tbody td::before",
        "MutationObserver",
    ]:
        assert token in layer, token

    assert "admin-player-list.js?v=20260910-1" in loader


if __name__ == "__main__":
    test_enhanced_admin_dashboard_refreshes_core_stats_itself()
    test_enhanced_admin_dashboard_refreshes_recent_activity_itself()
    test_enhanced_admin_layer_is_loaded_from_admin_page_pipeline()
    test_admin_tables_are_fully_visible_on_mobile()
    test_players_mobile_list_is_compact_clickable_and_keeps_other_tables_as_cards()
    print("Enhanced admin dashboard tests passed")
