from pathlib import Path


def test_home_theme_cache_buster_matches_latest_header_layout():
    html = Path('index.html').read_text(encoding='utf-8')
    css = Path('home-theme.css').read_text(encoding='utf-8')

    assert "const runtimeVersion=stamp+'-'+Date.now();" in html, 'homepage assets need a fresh runtime version on every load'
    assert 'home-theme\\.css\\?v=' in html, 'home theme URL must be rewritten regardless of its previous version'
    assert "'home-theme.css?v='+runtimeVersion" in html, 'home theme must receive the fresh runtime version'
    assert '.header-member-avatar{' in css
    assert 'width:38px' in css and 'height:38px' in css
    assert 'border:1px solid var(--hero-cyan-line)' in css
