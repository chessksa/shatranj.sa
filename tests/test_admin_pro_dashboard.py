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


def test_all_admin_mobile_tables_are_compact_centered_rows():
    responsive = (ROOT / "admin-responsive-tables.js").read_text(encoding="utf-8")
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")

    for token in [
        "COMPACT_TABLES",
        "playersTableBody",
        "gamesTableBody",
        "computerGamesTableBody",
        "reportsTableBody",
        "actionsTableBody",
        "moderatorsTableBody",
        "tournamentsTableBody",
        "compact-admin-row",
        "compact-admin-hidden",
        "data-row-open",
        "text-align:center",
        "@media(max-width:760px)",
        "MutationObserver",
    ]:
        assert token in responsive, token

    assert "admin-responsive-tables.js?v=20260910-3" in loader or "admin-responsive-tables.js?v=20260910-4" in loader


def test_player_detail_controls_keep_icons():
    layer = (ROOT / "admin-player-list.js").read_text(encoding="utf-8")
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")
    for token in ["player-control-grid", "player-control-icon", "editPlayer", "ban", "unban", "deletePlayer"]:
        assert token in layer, token
    assert "admin-player-list.js?v=20260910-2" in loader


def test_admin_view_survives_page_refresh():
    path = ROOT / "admin-view-state.js"
    assert path.exists(), "admin-view-state.js"
    js = path.read_text(encoding="utf-8")
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")
    for token in [
        "restoreAdminView",
        "location.hash",
        "history.replaceState",
        "data-view",
        "hashchange",
    ]:
        assert token in js, token
    assert "admin-view-state.js?v=20260910-1" in loader


def test_admin_games_are_one_scrollable_table_with_player_pairs():
    path = ROOT / "admin-unified-games.js"
    assert path.exists(), "admin-unified-games.js"
    js = path.read_text(encoding="utf-8")
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")
    responsive = (ROOT / "admin-responsive-tables.js").read_text(encoding="utf-8")

    for token in [
        "unifiedGamesTableBody",
        "gamesTableBody",
        "computerGamesTableBody",
        "اللاعبين",
        " × ",
        "الكمبيوتر",
        "unified-games-source",
        "max-height",
        "overflow:auto",
        "MutationObserver",
    ]:
        assert token in js, token

    assert "unifiedGamesTableBody" in responsive
    assert "admin-unified-games.js?v=20260910-1" in loader


def test_computer_games_resolve_real_player_names_through_admin_rpc():
    js = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")
    assert "admin_list_players_v3" in js
    assert "players.set(p.id, p)" in js
    assert ".from('players')" not in js


if __name__ == "__main__":
    test_enhanced_admin_dashboard_refreshes_core_stats_itself()
    test_enhanced_admin_dashboard_refreshes_recent_activity_itself()
    test_enhanced_admin_layer_is_loaded_from_admin_page_pipeline()
    test_all_admin_mobile_tables_are_compact_centered_rows()
    test_player_detail_controls_keep_icons()
    test_admin_view_survives_page_refresh()
    test_admin_games_are_one_scrollable_table_with_player_pairs()
    test_computer_games_resolve_real_player_names_through_admin_rpc()
    print("Enhanced admin dashboard tests passed")
