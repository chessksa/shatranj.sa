from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_enhanced_admin_dashboard_refreshes_core_stats_itself():
    js = (ROOT / "admin-pro.js").read_text(encoding="utf-8")
    assert "admin_dashboard_stats_v2" in js
    for target in ["totalPlayers", "activeGames", "finishedGames", "openReports"]:
        assert target in js
    for field in ["total_players", "active_games", "finished_games", "open_reports"]:
        assert field in js


def test_enhanced_admin_layer_is_loaded_from_admin_page_pipeline():
    loader = (ROOT / "admin-computer-games.js").read_text(encoding="utf-8")
    assert "admin-pro.js?v=20260910-1" in loader


if __name__ == "__main__":
    test_enhanced_admin_dashboard_refreshes_core_stats_itself()
    test_enhanced_admin_layer_is_loaded_from_admin_page_pipeline()
    print("Enhanced admin dashboard tests passed")
