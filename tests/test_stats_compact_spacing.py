from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_stats_page_loads_compact_spacing_stylesheet():
    html = (ROOT / 'stats.html').read_text(encoding='utf-8')
    assert 'stats-compact-v1.css' in html


def test_stats_compact_spacing_reduces_vertical_whitespace():
    css_path = ROOT / 'stats-compact-v1.css'
    assert css_path.exists(), 'stats compact stylesheet is missing'
    css = css_path.read_text(encoding='utf-8')

    for token in (
        '.platform-shell{',
        'padding:12px 0 24px!important',
        '.platform-head{',
        'margin-bottom:8px!important',
        '.platform-grid{',
        'gap:8px!important',
        '.platform-card{',
        'padding:10px!important',
        '.history{',
        'height:120px!important',
        '.platform-row{',
        'padding:6px 0!important',
        '.achievement{',
        'padding:6px 0!important',
    ):
        assert token in css


def test_stats_mobile_is_more_compact():
    css = (ROOT / 'stats-compact-v1.css').read_text(encoding='utf-8')
    assert '@media(max-width:700px)' in css
    assert 'padding:8px 0 66px!important' in css
    assert 'gap:6px!important' in css
