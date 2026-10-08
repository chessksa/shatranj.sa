from pathlib import Path


def test_home_theme_cache_buster_matches_latest_header_layout():
    html = Path('index.html').read_text(encoding='utf-8')
    theme_css = Path('home-theme.css').read_text(encoding='utf-8')
    base_css = Path('home-theme-base.css').read_text(encoding='utf-8')
    css = theme_css + '\n' + base_css

    assert "const runtimeVersion=stamp;" in html, 'page loads must reuse a stable asset version until the next release'
    assert "const runtimeVersion=stamp+'-'+Date.now();" not in html, 'do not disable browser asset caching on each navigation'
    assert "{cache:'no-cache'}" in html, 'index-app should revalidate instead of skipping its cache'
    assert "legacyCleanupKey" in html, 'legacy browser caches should only be cleaned once'
    assert 'home-theme\\.css\\?v=' in html, 'home theme URL must be rewritten regardless of its previous version'
    assert "'home-theme.css?v='+runtimeVersion" in html, 'home theme must receive the fresh runtime version'
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
    assert 'desktop-sidebar-cleanup.css?v=20261009-sidebar-canonical1' in tune_js
    assert './desktop-board-shell-tune.mjs?v=20261009-sidebar-canonical1' in dashboard_js
