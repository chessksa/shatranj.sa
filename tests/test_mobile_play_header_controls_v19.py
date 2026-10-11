from pathlib import Path


def test_mobile_play_header_separates_board_and_back_controls():
    css = Path('play-reference-overlay-v18.css').read_text(encoding='utf-8')
    shell = Path('play-reference-shell-v18.js').read_text(encoding='utf-8')

    assert 'content:"→"!important' in css
    assert '.reference-board-control-v19' in css
    # Board customization is now available only in Settings, never the mobile play header.
    assert "if (boardControl?.isConnected) boardControl.remove();" in shell
    assert "classList.add('reference-board-control-v19')" not in shell
    settings = Path('settings-v2.html').read_text(encoding='utf-8')
    assert 'id="v2-settings-theme-picker"' in settings
    assert "setAttribute('aria-label', 'رجوع')" in shell
