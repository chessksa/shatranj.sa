from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_desktop_header_shows_member_identity_with_square_avatar():
    css = (ROOT / 'home-header-svg.css').read_text(encoding='utf-8')
    index = (ROOT / 'index-app.html').read_text(encoding='utf-8')

    assert 'Desktop member identity and ticker polish 20260914' in css
    block = css.split('Desktop member identity and ticker polish 20260914', 1)[1]
    assert '#headerMember' in block
    assert 'display:flex!important' in block
    assert '.header-member-avatar-wrap' in block
    assert 'width:42px!important' in block
    assert 'height:42px!important' in block
    assert 'border-radius:6px!important' in block

    for token in ['headerMemberAvatar', 'headerMemberName', 'headerMemberRating']:
        assert token in index


def test_ticker_titles_are_unified_and_animation_is_faster():
    css = (ROOT / 'home-header-svg.css').read_text(encoding='utf-8')
    block = css.split('Desktop member identity and ticker polish 20260914', 1)[1]

    assert '#welcomeTicker .welcome-ticker-label' in block
    assert '#tournamentResultsTicker .welcome-ticker-label' in block
    assert 'min-width:118px!important' in block
    assert 'font-size:13px!important' in block
    assert 'animation-duration:38s!important' in block
