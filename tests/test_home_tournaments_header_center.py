from pathlib import Path
import re


def test_tournaments_moves_to_header_and_hero_is_centered():
    html = Path('index.html').read_text(encoding='utf-8')
    css = Path('home-theme.css').read_text(encoding='utf-8')

    header = re.search(r'<header class="home-header">.*?</header>', html, re.S)
    assert header, 'home header missing'
    header_html = header.group(0)

    assert 'id="headerTournaments"' in header_html
    assert '>البطولات<' in header_html
    assert 'id="features"' not in html
    assert '/* Centered hero + tournaments header 20260904 */' in css
    assert re.search(r'\.home-hero-copy\{[^}]*text-align:center!important', css, re.S)
    assert re.search(r'\.home-hero-copy>\.hero-kicker[^}]*margin-inline:auto', css, re.S)
    assert re.search(r'\.home-hero-copy \.hero-live-stats\{[^}]*margin-inline:auto', css, re.S)
    assert re.search(r'\.home-hero-copy \.home-board-actions\{[^}]*margin-inline:auto', css, re.S)
