from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-mobileallgap3"
MARKER = "/* MOBILE ALL INTERFACE GAPS 3PX 20260909 */"


def unified_gap_section():
    css = (ROOT / "home-theme-base.css").read_text(encoding="utf-8")
    assert MARKER in css
    return css.split(MARKER, 1)[1]


def test_all_mobile_interface_groups_use_three_pixel_gaps():
    section = unified_gap_section()
    required = [
        ".hero-live-stats{column-gap:3px!important;row-gap:3px!important}",
        ".home-feature-grid{column-gap:3px!important;row-gap:3px!important}",
        ".quick-icons{column-gap:3px!important;row-gap:3px!important}",
        ".home-hero .home-board-actions{column-gap:3px!important;row-gap:3px!important}",
        ".compact-member-nav .nav-user{column-gap:3px!important;row-gap:3px!important}",
        "body.home-signed-in .compact-member-nav .nav-user{column-gap:3px!important;row-gap:3px!important}",
    ]
    for rule in required:
        assert rule in section, rule


def test_all_mobile_interface_gap_stylesheets_are_cache_busted():
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
    test_all_mobile_interface_groups_use_three_pixel_gaps()
    test_all_mobile_interface_gap_stylesheets_are_cache_busted()
    test_invite_button_still_participates_in_play_grid()
    print("all mobile interface gaps 3px: PASS")
