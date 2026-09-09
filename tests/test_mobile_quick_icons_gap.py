from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobilegap4"


def test_visible_mobile_home_action_grid_uses_one_pixel_gap_on_both_axes():
    css = (ROOT / "home-theme-base.css").read_text(encoding="utf-8")
    assert ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:1px!important}" in css
    assert ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important;gap:1px!important}" in css


def test_desktop_home_action_gap_is_unchanged():
    css = (ROOT / "home-theme-base.css").read_text(encoding="utf-8")
    assert "body.home-signed-in .home-hero .home-board-actions{gap:10px!important}" in css


def test_mobile_gap_stylesheets_are_cache_busted():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    theme = (ROOT / "home-theme.css").read_text(encoding="utf-8")
    assert f'href="home-theme.css?v={VERSION}"' in html
    assert f'@import url("./home-theme-base.css?v={VERSION}");' in theme


if __name__ == "__main__":
    test_visible_mobile_home_action_grid_uses_one_pixel_gap_on_both_axes()
    test_desktop_home_action_gap_is_unchanged()
    test_mobile_gap_stylesheets_are_cache_busted()
    print("visible mobile home action gap: PASS")
