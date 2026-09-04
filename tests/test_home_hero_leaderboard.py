from pathlib import Path
import re


def test_home_hero_uses_top10_leaderboard_instead_of_board():
    html = Path('index.html').read_text(encoding='utf-8')
    css = Path('home-theme.css').read_text(encoding='utf-8')

    assert 'id="homeBoardPreview"' in html
    assert '#homeBoardPreview{display:none!important}' in css
    assert '#ranking{grid-column:3;grid-row:2' in css
    assert '#ranking tbody tr:nth-child(n+11){display:none!important}' in css


def test_leaderboard_columns_are_player_region_city_points():
    css = Path('home-theme.css').read_text(encoding='utf-8')

    assert re.search(r'#ranking th:nth-child\(1\),#ranking td:nth-child\(1\).*display:none!important', css)
    assert re.search(r'#ranking th:nth-child\(5\),#ranking td:nth-child\(5\).*display:none!important', css)

    for column in (2, 3, 4, 6):
        assert re.search(
            rf'#ranking th:nth-child\({column}\),#ranking td:nth-child\({column}\)\{{[^}}]*display:table-cell!important',
            css,
        )

    assert '#ranking th:nth-child(2)::before{content:"اللاعب"' in css
    assert '#ranking th:nth-child(3)::before{content:"المنطقة"' in css
    assert '#ranking th:nth-child(4)::before{content:"المدينة"' in css
    assert '#ranking th:nth-child(6)::before{content:"النقاط"' in css
