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
    assert 'topPlayers.map((player,index)=>`' in html
    assert '<td class="rank-number">${index+1}</td>' in html


def test_tournaments_is_grouped_with_right_header_controls():
    html = Path('index.html').read_text(encoding='utf-8')
    nav_user = re.search(r'<div class="nav-user">(.*?)</div>\s*</div>\s*</header>', html, re.S)
    assert nav_user
    assert 'id="headerTournaments"' in nav_user.group(1)


def test_stat_labels_are_above_values():
    html = Path('index.html').read_text(encoding='utf-8')
    assert '<div><small>لاعب مسجل</small><strong id="headerPlayersCount">0</strong></div>' in html
    assert '<div><small>مباراة حالية</small><strong id="headerMatchesCount">0</strong></div>' in html
    assert '<div><small>يشاهد الآن</small><strong>شاهد</strong></div>' in html
