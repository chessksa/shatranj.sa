from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
read=lambda path:(root/path).read_text(encoding='utf-8')

def test_settings_removed_and_actions_at_top():
    html=read('profile.html')
    assert '<details class="profile-settings"' not in html
    assert '<nav class="profile-toolbar"' in html
    assert html.index('class="profile-toolbar"')<html.index('class="profile-stats-grid"')
    for token in ('id="avatarInput"','id="publicProfileLink"','id="logoutBtn"'):
        assert html.count(token)==1
    assert html.count('class="profile-top-action')==3
    assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in html

def test_each_recent_game_in_one_horizontal_row_and_centered_icons():
    html=read('profile.html')
    js=read('profile.js')
    assert '.profile-game-main{min-width:0;display:flex;' in html
    assert 'flex-wrap:nowrap;white-space:nowrap' in html
    assert '<div class="profile-game-main">' in js
    assert 'class="row-meta"' in js
    assert 'text-align:center' in html
    assert 'flex-direction:column;align-items:center;justify-content:center' in html

def test_public_profile_compact_in_middle_column():
    profilejs=read('profile.js')
    public=read('player.html')
    publicjs=read('player.js')
    assert "'&embed=panel'" in profilejs
    assert "classList.add('embedded-public-profile')" in public
    assert 'html.embedded-public-profile .topbar,' in public
    assert 'html.embedded-public-profile .v2-mobile-nav,' in public
    assert 'html.embedded-public-profile .grid{display:grid;grid-template-columns:minmax(0,1fr)' in public
    assert '?embed=panel' in publicjs
    assert 'profile.js?v=20261009-profile-toolbar-v2' in read('profile.html')

if __name__=='__main__':
    test_settings_removed_and_actions_at_top()
    test_each_recent_game_in_one_horizontal_row_and_centered_icons()
    test_public_profile_compact_in_middle_column()
    print('Member toolbar and public panel layout: PASS')
