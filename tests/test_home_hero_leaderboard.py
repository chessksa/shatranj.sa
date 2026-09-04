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


def test_signed_in_member_summary_moves_into_header():
    html = Path('index.html').read_text(encoding='utf-8')

    header = re.search(r'<header class="home-header">.*?</header>', html, re.S)
    assert header, 'home header missing'
    header_html = header.group(0)

    assert 'id="headerMember"' in header_html
    assert 'id="headerMemberAvatar"' in header_html
    assert 'id="headerMemberFallback"' in header_html
    assert 'id="headerMemberName"' in header_html
    assert 'id="headerMemberRating"' in header_html
    assert 'id="siteNotificationHost"' in header_html

    assert "document.body.classList.toggle('home-signed-in',loggedIn)" in html
    assert "$('#headerMember').hidden=!loggedIn" in html
    assert "$('#headerMemberName').textContent=currentProfile.name" in html
    assert "$('#headerMemberRating').textContent=currentProfile.rating??1500" in html


def test_desktop_signed_in_home_fits_viewport_and_leaderboard_matches_cards():
    css = Path('home-theme.css').read_text(encoding='utf-8')

    assert '/* Desktop no-scroll signed-in composition */' in css
    assert re.search(r'@media\(min-width:901px\)\{.*body\.home-signed-in\{[^}]*height:100vh[^}]*overflow:hidden', css, re.S)
    assert '.home-signed-in #register{display:none!important}' in css

    assert 'border:8px solid #67431f' not in css
    assert 'border:8px solid #67431f!important' not in css
    assert re.search(r'#ranking \.head\{[^}]*border:1px solid var\(--hero-cyan-line\)', css, re.S)
    assert re.search(r'#ranking \.table-card\{[^}]*border:1px solid var\(--hero-cyan-line\)!important', css, re.S)
