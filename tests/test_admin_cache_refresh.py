from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_admin_script_url_is_versioned_to_break_existing_browser_cache():
    html = read("admin.html")
    assert 'src="admin.js?v=' in html


def test_service_worker_fetches_admin_assets_from_network_first():
    sw = read("sw.js")
    assert 'ADMIN_PATHS' in sw
    assert '/admin.js' in sw
    assert 'isAdminAsset' in sw
    assert 'cache:"no-store"' in sw
