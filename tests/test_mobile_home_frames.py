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
    loader = (ROOT / "index.html").read_text(encoding="utf-8")
    app = (ROOT / "index-app.html").read_text(encoding="utf-8")

    assert not (ROOT / "home-header-controls.js").exists(), "header tournaments injector must be removed"
    assert "home-header-controls.js" not in loader
    assert "hero-tournaments-btn" in app
    assert 'href="tournaments.html' in app


def test_mobile_header_controls_are_balanced_and_readable():
    base_css = (ROOT / "home-mobile-admin-colors.css").read_text(encoding="utf-8")
    svg_css_path = ROOT / "home-header-svg.css"
    assert svg_css_path.exists(), "dedicated SVG header stylesheet must exist"
    svg_css = svg_css_path.read_text(encoding="utf-8")
    css = base_css + "\n" + svg_css
    core = (ROOT / "site-notifications-core.js").read_text(encoding="utf-8")

    assert "Mobile signed-in header compact controls 20260911" in base_css
    assert "Unified SVG mobile header controls 20260911" in svg_css
    assert "grid-template-columns:repeat(3,minmax(0,1fr))!important" in base_css
    assert "body.home-signed-in .compact-member-nav .mobile-dashboard-link" in css
    assert "body.home-signed-in .compact-member-nav .header-notification-host" in css
    assert "body.home-signed-in .compact-member-nav .nav-logout" in css

    for token in [
        "height:48px!important",
        "min-height:48px!important",
        "font-size:15px!important",
        "box-sizing:border-box!important",
        ".header-tile-svg",
        "content:none!important",
    ]:
        assert token in svg_css

    assert "body.home-signed-in.home-admin-enabled .compact-member-nav .nav-user" in core
    assert "grid-template-columns:repeat(4,minmax(0,1fr))!important" in core
    assert "html body.home-signed-in.home-admin-enabled .compact-member-nav .home-admin-link" in svg_css

    # Runtime decoration replaces platform-dependent emoji with one SVG system.
    for token in [
        "HEADER_SVG_ICONS",
        "decorateHeaderIcons",
        "mobileDashboardNav",
        "siteAdminLink",
        "siteNotificationBell",
        'class="header-tile-svg"',
        '<span class="header-tile-label">الإشعارات</span>',
    ]:
        assert token in core
    assert '🛡' not in core
    assert '🔔' not in core


def test_mobile_header_nested_assets_use_the_runtime_cache_buster():
    loader = (ROOT / "index.html").read_text(encoding="utf-8")
    wrapper = (ROOT / "site-notifications.js").read_text(encoding="utf-8")
    core = (ROOT / "site-notifications-core.js").read_text(encoding="utf-8")

    # The page loader already gives site-notifications.js a fresh runtime version.
    assert "site-notifications.js?v='+runtimeVersion" in loader

    # That same version must propagate to the nested core script rather than a fixed old URL.
    assert "document.currentScript" in wrapper
    assert "RUNTIME_VERSION" in wrapper
    assert "site-notifications-core.js?v=${encodeURIComponent(RUNTIME_VERSION)}" in wrapper
    assert "site-notifications-core.js?v=20260910-admin-home1" not in wrapper

    # The core must propagate its version to the dedicated SVG stylesheet too.
    assert "document.currentScript" in core
    assert "HEADER_ASSET_VERSION" in core
    assert "home-header-svg.css?v=${encodeURIComponent(HEADER_ASSET_VERSION)}" in core
    assert "home-header-svg.css?v=20260911-1" not in core


if __name__ == "__main__":
    test_mobile_home_frames_share_one_visual_contract()
    test_tournaments_are_not_injected_into_the_mobile_header()
    test_mobile_header_controls_are_balanced_and_readable()
    test_mobile_header_nested_assets_use_the_runtime_cache_buster()
    print("Mobile home frame tests passed")
