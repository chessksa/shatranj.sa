from pathlib import Path
import re


def test_invite_panel_is_viewport_safe():
    js = Path('home-invite.js').read_text(encoding='utf-8')
    assert '.home-invite-panel{position:fixed;' in js
    assert 'max-height:min(70vh,520px)' in js
    assert 'overflow:auto' in js


def test_ranking_has_visible_numbers_one_to_ten():
    html = Path('index.html').read_text(encoding='utf-8')
    assert '<th class="rank-number-head">#</th>' in html
    assert 'for(let index=0;index<10;index++)' in html
    assert '<td class="rank-number">${index+1}</td>' in html
    assert 'const player=topPlayers[index];' in html
    assert 'ranking-placeholder' in html


def test_tournaments_is_leftmost_signed_in_header_control():
    html = Path('index.html').read_text(encoding='utf-8')
    nav_user = re.search(r'<div class="nav-user">(.*?)</div>\s*</div>\s*</header>', html, re.S)
    assert nav_user
    nav = nav_user.group(1)
    assert 'id="headerTournaments"' in nav
    assert nav.index('id="navLogout"') < nav.index('id="headerTournaments"')


def test_stat_labels_are_above_values_without_icons():
    html = Path('index.html').read_text(encoding='utf-8')
    hero = re.search(r'<section id="homeHero".*?</section>', html, re.S)
    assert hero
    hero_html = hero.group(0)
    assert '<div><small>لاعب مسجل</small><strong id="headerPlayersCount">0</strong></div>' in hero_html
    assert '<div><small>مباراة حالية</small><strong id="headerMatchesCount">0</strong></div>' in hero_html
    assert '<div><small>يشاهد الآن</small><strong>شاهد</strong></div>' in hero_html
    assert 'hero-stat-icon' not in hero_html


def test_play_and_invite_buttons_have_no_side_icons():
    html = Path('index.html').read_text(encoding='utf-8')
    js = Path('home-invite.js').read_text(encoding='utf-8')
    actions = re.search(r'<div id="homeBoardActions".*?</div>\s*</div>', html, re.S)
    assert actions
    assert 'hero-action-icon' not in actions.group(0)
    assert 'hero-action-icon' not in js
