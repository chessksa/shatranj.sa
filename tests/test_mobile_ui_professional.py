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
