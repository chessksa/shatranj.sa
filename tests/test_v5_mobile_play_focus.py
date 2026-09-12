from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_mobile_focus_assets_are_wired_into_play_page():
    html = read("play-v2.html")
    assert 'href="v2/play/mobile-focus.css?v=20260912-global5"' in html
    assert 'src="v2/play/mobile-focus.mjs?v=20260912-global5"' in html


def test_live_game_focus_hides_mobile_navigation_and_recovers_space():
    css = read("v2/play/mobile-focus.css")
    assert "body.v2-shell-active.v2-route-play.v2-game-active" in css
    assert ".v2-mobile-nav" in css
    assert "display:none!important" in css
    assert "padding-bottom" in css


def test_focus_mode_tracks_game_lifecycle():
    script = read("v2/play/mobile-focus.mjs")
    assert "v2-game-active" in script
    assert "MutationObserver" in script
    assert "URLSearchParams" in script
    assert "terminal" in script.lower()


def test_mobile_board_is_explicitly_centered_and_controls_have_icon_treatment():
    css = read("v2/play/mobile-focus.css")
    assert ".v2-board-column" in css
    assert "align-items:center" in css
    assert ".v2-board" in css
    assert "margin-inline:auto" in css
    assert "#v2-resign::before" in css
    assert "#v2-draw::before" in css
    assert "#v2-board-settings::before" in css


def test_mobile_live_game_matches_global_site_structure():
    css = read("v2/play/mobile-focus.css")
    assert "#24231f" in css
    assert "#6f8d53" in css
    assert "grid-template-columns:repeat(3,minmax(0,1fr))" in css
    assert "body.v2-game-active .v2-side-panel>.v5-custom-box" not in css
    assert "body.v2-game-active .v5-custom-box :disabled" in css


def test_play_page_always_hides_bottom_nav_and_compacts_lower_area():
    css = read("v2/play/mobile-focus.css")
    assert "body.v2-shell-active.v2-route-play .v2-mobile-nav" in css
    assert "body.v2-shell-active.v2-route-play .v2-mobile-more" in css
    assert "padding-bottom:0!important" in css
    assert "margin:4px auto 0!important" in css
    assert "min-height:56px!important" in css
    assert "min-height:34px!important" in css


def test_play_page_removes_old_time_increment_and_rated_row():
    html = read("play-v2.html")
    assert 'class="v5-custom-box"' not in html
    assert 'id="v5-custom-increment"' not in html
    assert "الزيادة" not in html
    assert "مباراة نقاط" not in html


def test_top_time_picker_starts_matchmaking_without_increment_option():
    html = read("play-v2.html")
    script = read("v2/play/phase5.mjs")
    assert 'id="v5-time-picker-button"' in html
    assert 'id="v5-time-picker-menu"' in html
    for seconds in (60, 180, 300, 600, 900, 1800):
        assert f'data-base-seconds="{seconds}"' in html
    assert "incrementSeconds: 0" in script
    assert "rated: true" in script
    assert "startTimeSearch" in script
    assert "url.searchParams.delete('auto')" in html
