from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_mobile_workspace_is_loaded_directly_from_index():
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    dashboard = (ROOT / "v2/home/dashboard.mjs").read_text(encoding="utf-8")
    assert "v2/home/mobile-board-shell.css?v=" in index
    assert "v2/home/mobile-board-shell.mjs?v=" in index
    assert "20260920-mobile-board3" in index
    assert "mobile-board-shell.mjs" not in dashboard


def test_workspace_logic_is_mobile_only():
    js = (ROOT / "v2/home/mobile-board-shell.mjs").read_text(encoding="utf-8")
    assert "window.matchMedia('(max-width:900px)')" in js
    assert "document.body.classList.add('mobile-board-workspace')" in js
    assert "mobile-fixed-board" in js
    assert "assets/pieces/" in js
    assert "showView('play')" in js


def test_board_stays_fixed_while_views_change():
    js = (ROOT / "v2/home/mobile-board-shell.mjs").read_text(encoding="utf-8")
    for view in ["home", "play", "computer", "ranking", "invite", "more"]:
        assert f"id:'{view}'" in js
    assert "mobileWorkspacePanel" in js
    assert "mobileWorkspaceBody" in js
    assert "rankingNode" in js
    assert "inviteNode" in js


def test_mobile_layout_has_fixed_board_icon_rail_and_changing_panel():
    css = (ROOT / "v2/home/mobile-board-shell.css").read_text(encoding="utf-8")
    assert "@media(max-width:900px)" in css
    assert "--mobile-board-size:" in css
    assert "grid-template-rows:var(--mobile-board-size) 58px minmax(0,1fr)!important" in css
    assert ".mobile-workspace-tabs" in css
    assert "grid-template-columns:repeat(6,minmax(0,1fr))" in css
    assert ".mobile-workspace-panel" in css
    assert ".mobile-board-grid" in css
    assert ".mobile-board-piece" in css


def test_desktop_rules_are_not_added_to_mobile_workspace_stylesheet():
    css = (ROOT / "v2/home/mobile-board-shell.css").read_text(encoding="utf-8")
    assert "@media(min-width:901px)" not in css


def test_mobile_workspace_keeps_current_play_routes():
    js = (ROOT / "v2/home/mobile-board-shell.mjs").read_text(encoding="utf-8")
    assert 'href="play-v2.html?auto=1"' in js
    assert 'href="play-entry-v16.html?computer=1&v=20260918-sidewidth-freeze1"' in js


if __name__ == "__main__":
    test_mobile_workspace_is_loaded_directly_from_index()
    test_workspace_logic_is_mobile_only()
    test_board_stays_fixed_while_views_change()
    test_mobile_layout_has_fixed_board_icon_rail_and_changing_panel()
    test_desktop_rules_are_not_added_to_mobile_workspace_stylesheet()
    test_mobile_workspace_keeps_current_play_routes()
    print("mobile fixed board workspace: PASS")
