from pathlib import Path


def test_mobile_play_header_separates_board_and_back_controls():
    css = Path('play-reference-overlay-v18.css').read_text(encoding='utf-8')
    shell = Path('play-reference-shell-v18.js').read_text(encoding='utf-8')

    assert 'content:"→"!important' in css
    assert '.reference-board-control-v19' in css
    assert "classList.add('reference-board-control-v19')" in shell
    assert "setAttribute('aria-label', 'رجوع')" in shell
