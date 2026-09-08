from pathlib import Path

CSS = Path('exact-board-v13.css').read_text(encoding='utf-8')
PAGE = Path('play-v10.html').read_text(encoding='utf-8')


def test_desktop_play_header_and_primary_actions_are_larger():
    assert 'body.live-game .side-header{min-height:74px!important;height:74px!important' in CSS
    assert 'body.live-game #resignBtn .action-icon,body.live-game #drawOffer .action-icon{font-size:38px!important}' in CSS
    assert 'body.live-game #resignBtn .action-label,body.live-game #drawOffer .action-label{font-size:16px!important}' in CSS


def test_mobile_play_header_and_primary_actions_fill_available_space():
    assert 'body.live-game .side-header{min-height:52px!important;height:52px!important' in CSS
    assert 'body.live-game .board-panel>.actions-card{min-height:54px!important;height:54px!important;flex:0 0 54px!important}' in CSS
    assert 'body.live-game #resignBtn .action-icon,body.live-game #drawOffer .action-icon{font-size:28px!important}' in CSS
    assert 'body.live-game #resignBtn .action-label,body.live-game #drawOffer .action-label{font-size:11px!important}' in CSS


def test_play_page_loads_fresh_controls_stylesheet():
    assert 'exact-board-v13.css?v=20260908-playcontrols1' in PAGE


if __name__ == '__main__':
    test_desktop_play_header_and_primary_actions_are_larger()
    test_mobile_play_header_and_primary_actions_fill_available_space()
    test_play_page_loads_fresh_controls_stylesheet()
    print('play controls fill space: PASS')
