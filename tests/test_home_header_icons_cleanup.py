from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_home_header_removes_legacy_member_tile_and_normalizes_svg_icons():
    css = (ROOT / "home-header-svg.css").read_text(encoding="utf-8")

    assert "#headerMember{display:none!important}" in css
    assert "@media(min-width:901px)" in css
    assert ".compact-member-nav .home-admin-link .header-tile-icon" in css
    assert ".compact-member-nav .site-notification-bell .header-tile-icon" in css
    assert "width:22px!important" in css
    assert "height:22px!important" in css
    assert "color:var(--hero-gold)!important" in css
    assert ".compact-member-nav .header-tile-svg" in css
    assert "fill:none!important" in css
    assert "stroke:currentColor!important" in css
