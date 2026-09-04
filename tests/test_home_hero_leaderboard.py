from pathlib import Path


def test_home_hero_uses_top10_leaderboard_instead_of_board():
    html = Path('index.html').read_text(encoding='utf-8')
    css = Path('home-theme.css').read_text(encoding='utf-8')

    assert 'id="homeBoardPreview"' in html
    assert '#homeBoardPreview{display:none!important}' in css
    assert '#ranking{grid-column:3;grid-row:2' in css
    assert '#ranking tbody tr:nth-child(n+11){display:none!important}' in css


def test_leaderboard_columns_are_player_region_city_points():
    css = Path('home-theme.css').read_text(encoding='utf-8')

    assert '#ranking th:nth-child(1),#ranking td:nth-child(1)' in css
    assert '#ranking th:nth-child(5),#ranking td:nth-child(5)' in css
    assert '#ranking th:nth-child(2),#ranking td:nth-child(2){display:table-cell!important}' in css
    assert '#ranking th:nth-child(3),#ranking td:nth-child(3){display:table-cell!important}' in css
    assert '#ranking th:nth-child(4),#ranking td:nth-child(4){display:table-cell!important}' in css
    assert '#ranking th:nth-child(6),#ranking td:nth-child(6){display:table-cell!important}' in css
