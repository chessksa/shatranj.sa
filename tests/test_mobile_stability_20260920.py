from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_mobile_viewport_supports_iphone_safe_area():
    for name in ["index.html", "index-app.html"]:
        text = (ROOT / name).read_text(encoding="utf-8")
        assert 'width=device-width,initial-scale=1,viewport-fit=cover' in text


def test_mobile_bottom_nav_has_five_real_slots_and_safe_padding():
    css = (ROOT / "v2/site/shell.css").read_text(encoding="utf-8")
    mobile = css.split("@media(max-width:900px)", 1)[1]
    assert "grid-template-columns:repeat(5,1fr)" in mobile
    assert "padding-bottom:calc(72px + env(safe-area-inset-bottom) + 8px)!important" in mobile


def test_mobile_css_layers_are_cache_busted():
    shell = (ROOT / "v2/site/shell.mjs").read_text(encoding="utf-8")
    assert "mobile-ui-professional.css" in shell
    assert shell.count("20260920-mobile-stability1") >= 4


def test_mobile_play_and_computer_use_current_entries():
    shell = (ROOT / "v2/site/shell.mjs").read_text(encoding="utf-8")
    assert "(?:play(?:-v10)?|play-entry-v16)" in shell
    assert "window.matchMedia('(max-width:900px)').matches" in shell
    assert "play-v2.html?auto=1" in shell
    assert "item.id==='computer'?'play-entry-v16.html?computer=1&v=20260918-sidewidth-freeze1':item.href" in shell


def test_guest_mobile_header_has_only_two_balanced_auth_actions():
    css = (ROOT / "v2/site/mobile-home-cleanup.css").read_text(encoding="utf-8")
    assert "body.v2-route-home:not(.home-signed-in) .compact-member-nav .header-notification-host" in css
    assert "grid-template-columns:repeat(2,minmax(0,1fr))!important" in css
    app = (ROOT / "index-app.html").read_text(encoding="utf-8")
    assert "<span>إنشاء حساب</span>" in app
    assert "$('#navAccount').textContent='تسجيل الدخول';" in app


if __name__ == "__main__":
    test_mobile_viewport_supports_iphone_safe_area()
    test_mobile_bottom_nav_has_five_real_slots_and_safe_padding()
    test_mobile_css_layers_are_cache_busted()
    test_mobile_play_and_computer_use_current_entries()
    test_guest_mobile_header_has_only_two_balanced_auth_actions()
    print("mobile stability 20260920: PASS")
