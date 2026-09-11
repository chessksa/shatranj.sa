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


def test_tournaments_are_not_injected_into_the_mobile_header():
    css = (ROOT / "home-mobile-admin-colors.css").read_text(encoding="utf-8")
    loader = (ROOT / "index.html").read_text(encoding="utf-8")
    app = (ROOT / "index-app.html").read_text(encoding="utf-8")

    assert not (ROOT / "home-header-controls.js").exists(), "header tournaments injector must be removed"
    assert "home-header-controls.js" not in loader

    # Tournaments remain available from the main play actions; only the header entry is removed.
    assert "hero-tournaments-btn" in app
    assert 'href="tournaments.html' in app

    # The signed-in mobile header still uses the compact four-column layout for
    # dashboard, admin, notifications, and logout.
    assert "Mobile signed-in header four equal controls 20260911" in css
    assert "grid-template-columns:repeat(4,minmax(0,1fr))!important" in css
    assert "body.home-signed-in .compact-member-nav .mobile-dashboard-link" in css
    assert "body.home-signed-in .compact-member-nav .header-notification-host" in css
    assert "body.home-signed-in .compact-member-nav .nav-logout" in css


if __name__ == "__main__":
    test_mobile_home_frames_share_one_visual_contract()
    test_tournaments_are_not_injected_into_the_mobile_header()
    print("Mobile home frame tests passed")
