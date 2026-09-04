from pathlib import Path
import re


def test_home_header_and_ranking_polish_contract():
    html = Path('index.html').read_text(encoding='utf-8')
    css = Path('home-theme.css').read_text(encoding='utf-8')

    # Desktop composition: ranking on the left, hero on the right.
    assert '.home-hero{grid-column:3;grid-row:2}' in css
    assert '#ranking{grid-column:2;grid-row:2}' in css

    # Header navigation items use one consistent icon-tile structure.
    for label in ['الرئيسية', 'لوحة التحكم', 'اللاعبون', 'البطولات', 'دليل الموقع']:
        pattern = rf'<a[^>]*class="[^"]*header-tile[^"]*"[^>]*>.*?<span class="header-tile-icon"[^>]*>.*?</span>.*?<span>{label}</span>.*?</a>'
        assert re.search(pattern, html, re.S), f'missing header tile for {label}'

    assert 'class="nav-logout header-action header-tile"' in html
    assert 'class="header-member-link header-tile"' in html

    # Ranking has exactly the four approved columns, with no rank/category clutter.
    ranking_block = html.split('<!-- RANKING -->', 1)[1].split('<!-- ACCOUNT -->', 1)[0]
    headers = re.findall(r'<th>(.*?)</th>', ranking_block, re.S)
    assert [re.sub(r'<.*?>', '', h).strip() for h in headers] == ['اللاعب', 'المنطقة', 'المدينة', 'النقاط']

    render = html.split('function renderPlayers(players){', 1)[1].split('async function claimOrCreateProfile', 1)[0]
    assert '<td>${index+1}</td>' not in render
    assert 'CATEGORY[player.category]' not in render
    assert render.count('<td') == 4

    # Do not draw pseudo-icons on top of player names.
    assert '#ranking td:nth-child(2)::before' not in css
