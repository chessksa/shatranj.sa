from pathlib import Path
import re


def test_tournaments_stay_out_of_header_but_remain_in_hero():
    loader = Path('index.html').read_text(encoding='utf-8')
    app = Path('index-app.html').read_text(encoding='utf-8')

    assert 'home-header-controls.js' not in loader

    header = re.search(r'<header class="home-header">.*?</header>', app, re.S)
    assert header, 'home header missing'
    header_html = header.group(0)
    assert 'header-tournaments' not in header_html
    assert 'href="tournaments.html' not in header_html

    assert 'hero-tournaments-btn' in app
    assert 'href="tournaments.html' in app


if __name__ == '__main__':
    test_tournaments_stay_out_of_header_but_remain_in_hero()
    print('home tournaments header removal: PASS')
