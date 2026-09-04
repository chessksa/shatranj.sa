from pathlib import Path
import re


def test_home_theme_cache_buster_matches_latest_header_layout():
    html = Path('index.html').read_text(encoding='utf-8')
    css = Path('home-theme.css').read_text(encoding='utf-8')

    match = re.search(r'home-theme\.css\?v=(\d+)', html)
    assert match, 'home theme cache buster is missing'
    assert int(match.group(1)) >= 2026090421, 'bump cache buster after header/leaderboard CSS changes'
    assert '.header-member-avatar{' in css
    assert 'width:38px' in css and 'height:38px' in css
    assert 'border:1px solid var(--hero-cyan-line)' in css
