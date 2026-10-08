from pathlib import Path


def test_home_theme_cache_buster_matches_latest_header_layout():
    html = Path('index.html').read_text(encoding='utf-8')
    theme_css = Path('home-theme.css').read_text(encoding='utf-8')
    base_css = Path('home-theme-base.css').read_text(encoding='utf-8')
    css = theme_css + '\n' + base_css

    assert 'id="approvedHomeGate"' in html
    assert 'id="approvedHomeReadyScript"' in html
    assert "fetch('./index-app.html" not in html
    assert 'home-theme-base.css?v=' in html
    assert 'home-theme.css?v=' in html
    assert 'site-notifications.js?v=' in html
    assert 'shatranj-asset-version' in html
    assert '.header-member-avatar{' in css
    assert 'width:38px' in css and 'height:38px' in css
    assert 'border:1px solid var(--hero-cyan-line)' in css


def test_desktop_sidebar_has_one_authoritative_active_style():
    sidebar_css = Path('v2/home/desktop-sidebar-cleanup.css').read_text(encoding='utf-8')
    tune_js = Path('v2/home/desktop-board-shell-tune.mjs').read_text(encoding='utf-8')
    dashboard_js = Path('v2/home/dashboard.mjs').read_text(encoding='utf-8')

    assert sidebar_css.count('body.desktop-board-workspace .desktop-home-nav-link.active{') == 1
    assert 'gap:2px!important' in sidebar_css
    assert 'border:1px solid rgba(239,202,114,.88)!important' in sidebar_css
    assert 'desktop-sidebar-cleanup.css?v=${tuneAssetVersion}' in tune_js
    assert 'desktop-board-shell-tune.mjs?v=${homeAssetVersion}' in dashboard_js
