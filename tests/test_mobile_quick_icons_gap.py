from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-featuregap1"


def test_mobile_feature_icon_grid_uses_one_pixel_gap_on_both_axes():
    css = (ROOT / "home-theme-base.css").read_text(encoding="utf-8")
    assert ".home-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1px!important}" in css


def test_accidental_mobile_play_action_gap_is_restored():
    css = (ROOT / "home-theme-base.css").read_text(encoding="utf-8")
    assert ".home-hero .home-board-actions{width:100%!important;max-width:560px;gap:9px!important}" in css
    assert ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important}" in css
    assert ".home-hero .home-board-actions{grid-template-columns:1fr 1fr!important;gap:1px!important}" not in css
    assert "body.home-signed-in .home-hero .home-board-actions{gap:10px!important}" in css


def test_mobile_feature_gap_stylesheets_are_cache_busted():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    theme = (ROOT / "home-theme.css").read_text(encoding="utf-8")
    assert f'href="home-theme.css?v={VERSION}"' in html
    assert f'@import url("./home-theme-base.css?v={VERSION}");' in theme


if __name__ == "__main__":
    test_mobile_feature_icon_grid_uses_one_pixel_gap_on_both_axes()
    test_accidental_mobile_play_action_gap_is_restored()
    test_mobile_feature_gap_stylesheets_are_cache_busted()
    print("mobile feature icon gap: PASS")
