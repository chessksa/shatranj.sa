from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_admin_sections_become_a_fixed_compact_right_icon_rail_on_desktop():
    js = read("admin-home-compact.js")
    css = read("admin-home-compact.css")
    loader = read("admin-computer-games.js")

    for view in [
        "dashboardView",
        "playersView",
        "gamesView",
        "tournamentsView",
        "reportsView",
        "moderatorsView",
        "actionsView",
        "proSettingsNav",
    ]:
        assert view in js, view

    for token in [
        "ADMIN_SECTION_SHORTCUTS",
        "admin-section-icon",
        "admin-section-label",
        "aria-label",
        "title",
        "@media(min-width:761px)",
        "grid-template-columns:92px minmax(0,1fr)",
        "width:92px",
        "width:70px",
        "height:60px",
        "font-size:25px",
        "font-size:11px",
        "position:sticky",
        "right:0",
        "justify-content:center",
    ]:
        assert token in (js + css), token

    assert "admin-home-compact.css?v=20260911-3" in js
    assert "admin-home-compact.js?v=20260911-3" in loader


def test_admin_section_rail_stays_fixed_and_larger_on_mobile_too():
    css = read("admin-home-compact.css")
    for token in [
        "@media(max-width:760px)",
        "position:fixed",
        "width:72px",
        "padding-right:72px",
        "width:60px",
        "height:56px",
        ".admin-section-icon{font-size:22px}",
        ".admin-section-label{font-size:10px}",
        "transform:none!important",
        ".menu-btn",
        "display:none!important",
    ]:
        assert token in css, token


def test_dashboard_stats_are_compact_icon_metrics_instead_of_large_cards():
    js = read("admin-home-compact.js")
    css = read("admin-home-compact.css")

    for metric in [
        "totalPlayers",
        "proNewToday",
        "activeGames",
        "finishedGames",
        "openReports",
        "proBannedPlayers",
    ]:
        assert metric in js, metric

    for token in [
        "ADMIN_STAT_ICONS",
        "pro-stat-icon",
        "min-height:64px",
        "grid-template-columns:32px minmax(0,1fr)",
        ".pro-stat-note{display:none}",
    ]:
        assert token in (js + css), token


if __name__ == "__main__":
    test_admin_sections_become_a_fixed_compact_right_icon_rail_on_desktop()
    test_admin_section_rail_stays_fixed_and_larger_on_mobile_too()
    test_dashboard_stats_are_compact_icon_metrics_instead_of_large_cards()
    print("Compact admin home tests passed")
