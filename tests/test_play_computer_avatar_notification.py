from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_computer_mode_loads_signed_in_player_avatar():
    js = (ROOT / 'play-computer.js').read_text(encoding='utf-8')

    assert "const bottomAvatarImg = $('bottomAvatarImg');" in js
    assert "get_my_player_profile" in js
    assert "avatar_path" in js
    assert "storage.from('avatars').getPublicUrl" in js
    assert "loadComputerPlayerProfile" in js


def test_play_notification_icon_is_visible_and_compact():
    html = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
    css = (ROOT / 'play-desktop-fit-v20.css').read_text(encoding='utf-8')

    for source in (html, css):
        assert '#siteNotificationHost .header-tile-icon' in source
        assert 'color:var(--gold)!important' in source
        assert 'width:16px!important' in source
        assert 'height:16px!important' in source


def test_play_entry_cache_busts_computer_script():
    entry = (ROOT / 'play-entry-v16.html').read_text(encoding='utf-8')

    assert "play-computer\\.js\\?v=" in entry
    assert "'play-computer.js?v='+version" in entry
