from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
read=lambda path:(ROOT/path).read_text(encoding='utf-8')

def test_single_approved_homepage_is_served_directly():
    html=read('index.html')
    shim=read('index-app.html')
    assert 'location.replace' in shim
    assert 'homeHero' not in shim
    assert 'desktop-board-workspace' not in shim
    assert not (ROOT/'index-backup-20260909.html').exists()
    assert 'id="approvedHomeGate"' in html
    assert 'id="approvedHomeReadyScript"' in html
    assert 'desktop-board-workspace' in html
    assert 'mobile-fixed-workspace-active' in html
    assert "fetch('./index-app.html" not in html
    assert 'document.write(html)' not in html
    assert "get_public_ranked_players',{p_gender:null}" in html
    assert 'list_public_current_games' in html

def test_assets_use_one_approved_version():
    html=read('index.html')
    for path in ['home-theme-base.css','home-theme.css','v2/home/dashboard.mjs',
                 'v2/site/shell.mjs','mobile-home-fixed-v1.js']:
        assert f'{path}?v=20261009-profile-dashboard-compact-v1' in html
    assert '@import url("./home-theme-base.css' not in read('home-theme.css')
    assert "self.addEventListener('fetch'" not in read('sw.js')
    assert 'navigator.serviceWorker.register' not in read('app.js')
