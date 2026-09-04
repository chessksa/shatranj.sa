from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
CSS = (ROOT / "home-theme.css").read_text(encoding="utf-8")
INVITE = (ROOT / "home-invite.js").read_text(encoding="utf-8")

# Fresh verification trigger after the approved production patch.


def test_signed_in_header_has_member_dashboard_notifications_logout_then_tournaments():
    header = re.search(r'<header class="home-header">(.*?)</header>', HTML, re.S)
    assert header, "home header should exist"
    block = header.group(1)
    assert '<nav class="main-nav"' not in block
    order = [
        block.index('id="headerMember"'),
        block.index('id="dashboardNav"'),
        block.index('id="siteNotificationHost"'),
        block.index('id="navLogout"'),
        block.index('id="headerTournaments"'),
    ]
    assert order == sorted(order)


def test_ranking_filters_are_visible_at_top_of_ranking_panel():
    ranking = re.search(r'<section id="ranking">(.*?)</section>', HTML, re.S)
    assert ranking, "ranking section should exist"
    block = ranking.group(1)
    assert block.index('id="regionFilter"') < block.index('class="table-card"')
    assert block.index('id="cityFilter"') < block.index('class="table-card"')
    assert '#ranking .filters{display:none!important}' not in CSS
    assert '.ranking-filters' in CSS


def test_play_and_invite_have_no_decorative_side_icons():
    hero = re.search(r'<section id="homeHero".*?</section>', HTML, re.S)
    assert hero
    assert 'hero-action-icon' not in hero.group(0)
    assert 'hero-action-icon' not in INVITE
    assert '.hero-action-icon' in CSS  # legacy CSS may remain harmlessly unused
