from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_computer_mode_loads_signed_in_player_avatar():
    fix_path = ROOT / 'play-computer-profile-v21.js'
    assert fix_path.exists(), 'computer profile companion is missing'
    js = fix_path.read_text(encoding='utf-8')
    entry = (ROOT / 'play-entry-v16.html').read_text(encoding='utf-8')

    assert "bottomAvatarImg" in js
    assert "get_my_player_profile" in js
    assert "avatar_path" in js
    assert "storage.from('avatars').getPublicUrl" in js
    assert "play-computer-profile-v21.js" in entry


def test_play_notification_icon_is_visible_and_compact():
    css_path = ROOT / 'play-notification-icon-v21.css'
    assert css_path.exists(), 'play notification icon stylesheet is missing'
    css = css_path.read_text(encoding='utf-8')
    entry = (ROOT / 'play-entry-v16.html').read_text(encoding='utf-8')

    assert '#siteNotificationHost .header-tile-icon' in css
    assert 'color:var(--gold)!important' in css
    assert 'width:16px!important' in css
    assert 'height:16px!important' in css
    assert 'play-notification-icon-v21.css' in entry


def test_play_entry_cache_busts_computer_script():
    entry = (ROOT / 'play-entry-v16.html').read_text(encoding='utf-8')

    assert "play-computer\\.js\\?v=" in entry
    assert "'play-computer.js?v='+version" in entry
