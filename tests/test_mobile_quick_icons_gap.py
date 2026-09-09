from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobileallspace4"
MARKER = "/* MOBILE ALL INTERFACE SPACING 4PX 20260909 */"


def unified_spacing_section():
    css = (ROOT / "home-theme-base.css").read_text(encoding="utf-8")
    assert MARKER in css
    return css.split(MARKER, 1)[1]


def test_all_mobile_interface_groups_use_four_pixel_gaps():
    section = unified_spacing_section()
    required = [
        ".hero-live-stats{column-gap:4px!important;row-gap:4px!important}",
        ".home-feature-grid{column-gap:4px!important;row-gap:4px!important}",
        ".quick-icons{column-gap:4px!important;row-gap:4px!important}",
        ".header-live{column-gap:4px!important;row-gap:4px!important}",
        "#ranking .ranking-filters{column-gap:4px!important;row-gap:4px!important}",
        ".home-hero .home-board-actions{column-gap:4px!important;row-gap:4px!important}",
        ".compact-member-nav .nav-user{column-gap:4px!important;row-gap:4px!important}",
        "body.home-signed-in .compact-member-nav .nav-user{column-gap:4px!important;row-gap:4px!important}",
    ]
    for rule in required:
        assert rule in section, rule


def test_mobile_vertical_section_spacing_is_four_pixels_everywhere():
    section = unified_spacing_section()
    required = [
        ".home-header .compact-member-nav{padding-block:4px!important}",
        ".welcome-ticker{margin-block:4px 0!important}",
        ".home-hero{padding:4px 0 0!important}",
        ".hero-kicker{margin:0 0 4px!important}",
        ".home-hero h1{margin:0 0 4px!important}",
        ".home-hero p{margin:0 0 4px!important}",
        ".hero-live-stats{margin:0 0 4px!important}",
        "#ranking{padding:4px 7px 0!important}",
        "#ranking .head{margin:0 0 4px!important}",
        ".home-features{padding:4px 0 0!important}",
        "#register{padding:4px 0!important}",
        "footer{margin-top:4px!important}",
    ]
    for rule in required:
        assert rule in section, rule


def test_four_pixel_spacing_stylesheets_are_cache_busted():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    theme = (ROOT / "home-theme.css").read_text(encoding="utf-8")
    assert f'href="home-theme.css?v={VERSION}"' in html
    assert f'@import url("./home-theme-base.css?v={VERSION}");' in theme


def test_invite_button_still_participates_in_play_grid():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    invite = (ROOT / "home-invite.js").read_text(encoding="utf-8")
    assert 'id="homeBoardActions" class="home-board-actions"' in html
    assert "document.querySelector('#homeBoardActions')" in invite
    assert "wrap.className = 'home-invite-wrap'" in invite


if __name__ == "__main__":
    test_all_mobile_interface_groups_use_four_pixel_gaps()
    test_mobile_vertical_section_spacing_is_four_pixels_everywhere()
    test_four_pixel_spacing_stylesheets_are_cache_busted()
    test_invite_button_still_participates_in_play_grid()
    print("all mobile interface spacing 4px: PASS")
