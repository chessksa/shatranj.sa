from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_admin_entry_is_attached_to_home_header_not_profile_dashboard():
    core = read("site-notifications-core.js")
    assert "home-admin-link" in core
    assert "home-admin-enabled" in core
    assert "mobileDashboardNav" in core
    assert "dashboardNav" in core
    assert "if (!document.getElementById('profileApp')) return;" not in core
    assert "document.querySelector('#profileApp .top-actions')" not in core


def test_mobile_admin_header_uses_four_balanced_actions():
    core = read("site-notifications-core.js")
    assert "grid-template-columns:repeat(4,minmax(0,1fr))" in core
    assert ".home-admin-link" in core
    assert "grid-column:2!important" in core
    assert "grid-column:3!important" in core
    assert "grid-column:4!important" in core
