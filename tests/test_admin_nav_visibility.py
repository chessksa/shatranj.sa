from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHELL = ROOT / 'v2/site/shell.mjs'
NAV = ROOT / 'v2/site/nav.mjs'


def test_admin_navigation_is_permission_gated_and_available_on_desktop_and_mobile():
    shell = SHELL.read_text(encoding='utf-8')
    nav = NAV.read_text(encoding='utf-8')

    # Admin must never be a static link shown to every visitor.
    assert "href:'admin.html'" not in nav
    assert 'admin_get_access' in shell
    assert "href = 'admin.html'" in shell or "href='admin.html'" in shell
    assert 'لوحة الإدارة' in shell
    assert 'v2-global-nav' in shell
    assert 'v2-mobile-more-grid' in shell
    assert 'data-v2-admin-link' in shell or 'v2AdminLink' in shell
