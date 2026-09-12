from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_mobile_navigation_is_five_slots_with_more():
    shell = (ROOT / 'v2/site/shell.mjs').read_text(encoding='utf-8')
    assert "const coreIds = ['home','play','puzzles','profile'];" in shell
    assert "mobile.appendChild(moreButton)" in shell
    assert "mobile-ui-professional.css" in shell


def test_mobile_stylesheet_is_mobile_scoped_and_professional():
    css_path = ROOT / 'v2/site/mobile-ui-professional.css'
    assert css_path.exists()
    css = css_path.read_text(encoding='utf-8')
    assert '@media(max-width:900px)' in css
    assert 'grid-template-columns:repeat(5,1fr)' in css
    assert '.v2-mobile-more-grid' in css and 'grid-template-columns:repeat(2,minmax(0,1fr))' in css
    assert '#ranking tbody tr' in css
    assert 'grid-template-areas' in css
    assert '.auth-form' in css
    assert 'min-height:46px' in css
    assert '.mobile-play' in css and 'display:none!important' in css
    assert 'overflow-x:hidden' in css


def test_mobile_layer_does_not_override_desktop_breakpoint():
    css = (ROOT / 'v2/site/mobile-ui-professional.css').read_text(encoding='utf-8')
    assert '@media(min-width:901px)' not in css


def test_signed_in_mobile_home_is_one_screen_without_page_scroll():
    compact_path = ROOT / 'v2/site/mobile-home-no-scroll.css'
    assert compact_path.exists()
    css = compact_path.read_text(encoding='utf-8')
    shell = (ROOT / 'v2/site/shell.mjs').read_text(encoding='utf-8')

    assert '@media(max-width:900px)' in css
    assert 'body.v2-route-home.home-signed-in{' in css
    assert 'height:100dvh!important' in css
    assert 'overflow:hidden!important' in css
    assert 'body.v2-route-home.home-signed-in #ranking' in css and 'display:none!important' in css
    assert 'body.v2-route-home.home-signed-in .home-features' in css
    assert 'body.v2-route-home.home-signed-in #register' in css
    assert 'body.v2-route-home.home-signed-in footer' in css
    assert 'body.v2-route-home.home-signed-in #tournamentResultsTicker' in css
    assert 'body.v2-route-home.home-signed-in .home-board-preview' in css
    assert 'body.v2-route-home.home-signed-in .v5-home-quick' in css
    assert 'body.v2-route-home.home-signed-in .v5-home-cards' in css
    assert 'mobile-home-no-scroll.css' in shell
    assert "label:'Chess960'" in shell
    assert "label:'Puzzle Battle'" in shell
    assert "if(window.matchMedia('(max-width:900px)').matches)return;" in shell


def test_mobile_member_card_moves_to_top_and_exposes_three_compact_statuses():
    dashboard_css = (ROOT / 'v2/home/dashboard.css').read_text(encoding='utf-8')
    dashboard = (ROOT / 'v2/home/dashboard.mjs').read_text(encoding='utf-8')

    assert "if(window.matchMedia('(max-width:900px)').matches) copy.prepend(host);" in dashboard
    assert '.v5-home-mobile-strip{display:grid' in dashboard_css
    assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in dashboard_css
    assert "const mobileStrip=node('div','v5-home-mobile-strip');" in dashboard
    assert "label:'آخر مباراة'" in dashboard
    assert "label:'الأصدقاء'" in dashboard
    assert "label:'الإشعارات'" in dashboard
    assert 'متصل الآن' in dashboard
