from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_member_dashboard_is_not_rendered_on_home():
    source = (ROOT / 'v2/home/dashboard.mjs').read_text(encoding='utf-8')
    assert 'await renderDashboard();' not in source
    assert 'setTimeout(()=>void renderDashboard(),350);' not in source


def test_desktop_notification_tile_matches_header_controls():
    css = (ROOT / 'home-header-svg.css').read_text(encoding='utf-8')
    marker = 'Desktop notification tile alignment 20260914'
    assert marker in css
    block = css.split(marker, 1)[1]
    assert '.site-notification-bell' in block
    assert 'min-width:118px!important' in block
    assert 'height:52px!important' in block
    assert 'display:inline-flex!important' in block
    assert 'gap:7px!important' in block
    assert 'padding:0 12px!important' in block
    assert 'width:22px!important' in block
    assert 'height:22px!important' in block
