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
    header_css_path = ROOT / "home-header-svg.css"
    assert header_css_path.exists(), "dedicated mobile header stylesheet must exist"
    header_css = header_css_path.read_text(encoding="utf-8")
    css = base_css + "\n" + header_css
    core = (ROOT / "site-notifications-core.js").read_text(encoding="utf-8")

    assert "Mobile signed-in header compact controls 20260911" in base_css
    assert "Text-only mobile header controls 20260911" in header_css
    assert "grid-template-columns:repeat(3,minmax(0,1fr))!important" in base_css
    assert "body.home-signed-in .compact-member-nav .mobile-dashboard-link" in css
    assert "body.home-signed-in .compact-member-nav .header-notification-host" in css
    assert "body.home-signed-in .compact-member-nav .nav-logout" in css

    for token in [
        "height:48px!important",
        "min-height:48px!important",
        "box-sizing:border-box!important",
        "font-size:14px!important",
        "column-gap:4px!important",
        "row-gap:4px!important",
        "padding-inline:4px!important",
        ".header-tile-icon{display:none!important}",
    ]:
        assert token in header_css, token

    assert "body.home-signed-in.home-admin-enabled .compact-member-nav .nav-user" in core
    assert "grid-template-columns:repeat(4,minmax(0,1fr))!important" in core
    assert "html body.home-signed-in.home-admin-enabled .compact-member-nav .home-admin-link" in header_css
    assert "home-header-svg.css?v=20260911-1" in core

    # Header controls are text-only: no decorative SVG/icon markup remains in runtime UI.
    for token in [
        "HEADER_SVG_ICONS",
        "headerIconMarkup",
        'class="header-tile-svg"',
        'class="header-tile-icon"',
    ]:
        assert token not in core, token
    for label in ["لوحة التحكم", "الإدارة", "الإشعارات"]:
        assert label in core


def test_notification_wrapper_propagates_runtime_version_to_nested_core():
    loader = (ROOT / "index.html").read_text(encoding="utf-8")
    wrapper = (ROOT / "site-notifications.js").read_text(encoding="utf-8")

    assert "site-notifications.js?v='+runtimeVersion" in loader
    assert "document.currentScript" in wrapper
    assert "RUNTIME_VERSION" in wrapper
    assert "site-notifications-core.js?v=${encodeURIComponent(RUNTIME_VERSION)}" in wrapper
    assert "site-notifications-core.js?v=20260910-admin-home1" not in wrapper


if __name__ == "__main__":
    test_mobile_home_frames_share_one_visual_contract()
    test_tournaments_are_not_injected_into_the_mobile_header()
    test_mobile_header_controls_are_balanced_and_readable()
    test_notification_wrapper_propagates_runtime_version_to_nested_core()
    print("Mobile home frame tests passed")
