from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_mobile_focus_assets_are_wired_into_play_page():
    html = read("play-v2.html")
    assert 'href="v2/play/mobile-focus.css"' in html
    assert 'src="v2/play/mobile-focus.mjs"' in html


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
    assert "calc(100dvh - 300px)" in css
    assert "body.v2-game-active .v2-side-panel>.v5-custom-box" not in css
    assert "body.v2-game-active .v5-custom-box :disabled" in css
