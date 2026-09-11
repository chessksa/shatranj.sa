from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_mobile_home_frames_share_one_visual_contract():
    css = (ROOT / "home-mobile-admin-colors.css").read_text(encoding="utf-8")

    assert "Mobile unified interface frames 20260911" in css
    assert "@media(max-width:900px)" in css
    assert "--mobile-frame-border:1px solid rgba(216,182,101,.42)" in css
    assert "--mobile-frame-bg:linear-gradient(145deg,rgba(8,62,64,.86),rgba(7,49,51,.82))" in css
    assert "--mobile-frame-radius:14px" in css
    assert "--mobile-frame-shadow:0 8px 20px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.025)" in css

    for selector in [
        ".compact-member-nav .header-tile",
        ".compact-member-nav .site-notification-bell",
        ".home-hero .hero-stat",
        ".home-feature-card",
        "#ranking .head",
        "#ranking .table-card",
    ]:
        assert selector in css

    assert "border:var(--mobile-frame-border)!important" in css
    assert "background:var(--mobile-frame-bg)!important" in css
    assert "box-shadow:var(--mobile-frame-shadow)!important" in css


def test_signed_in_mobile_header_has_four_equal_controls_under_member_name():
    css = (ROOT / "home-mobile-admin-colors.css").read_text(encoding="utf-8")
    html = (ROOT / "index-app.html").read_text(encoding="utf-8")

    assert "Mobile signed-in header four equal controls 20260911" in css
    assert "grid-template-columns:repeat(4,minmax(0,1fr))!important" in css

    for selector in [
        "body.home-signed-in .compact-member-nav .mobile-dashboard-link",
        "body.home-signed-in .compact-member-nav .header-notification-host",
        "body.home-signed-in .compact-member-nav .header-tournaments",
        "body.home-signed-in .compact-member-nav .nav-logout",
    ]:
        assert selector in css

    for token in [
        "height:44px!important",
        "min-height:44px!important",
        "width:100%!important",
        "border-radius:14px!important",
        "font-size:11px!important",
        "font-size:18px!important",
        "gap:6px!important",
    ]:
        assert token in css

    assert 'class="header-tournaments header-tile"' in html
    assert 'href="tournaments.html' in html


if __name__ == "__main__":
    test_mobile_home_frames_share_one_visual_contract()
    test_signed_in_mobile_header_has_four_equal_controls_under_member_name()
    print("Mobile home frame tests passed")
