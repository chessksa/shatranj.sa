from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
read=lambda path:(root/path).read_text(encoding='utf-8')

def test_settings_removed_and_actions_at_top():
    html=read('profile.html')
    assert '<details class="profile-settings"' not in html
    assert '<nav class="profile-toolbar"' in html
    assert html.index('class="profile-toolbar"')<html.index('class="profile-dashboard-grid"')
    for token in ('id="avatarInput"','id="logoutBtn"'):
        assert html.count(token)==1
    assert html.count('class="profile-top-action')==2
    assert 'id="publicProfileLink"' not in html
    assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in html

def test_each_recent_game_in_one_horizontal_row_and_centered_icons():
    html=read('profile.html')
    js=read('profile.js')
    assert '<table class="profile-games-table"' in html
    assert '<h2 class="profile-games-title" id="recentGamesTitle">آخر المباريات</h2>' in html
    assert '<tbody id="recentGames"></tbody>' in html
    assert 'table-layout:fixed' in html
    assert 'white-space:nowrap' in html
    assert 'return \`<tr>' not in js
    assert 'return `<tr>' in js
    assert 'class="profile-game-name"' in js
    assert 'class="profile-game-date"' in js
    assert 'class="profile-game-kind"' in js
    assert 'class="profile-game-result' in js
    assert 'role="img" aria-label="${label}" title="${label}"' in js
    assert '<th scope="col">التاريخ</th>' in html
    assert 'الوقت والتاريخ' not in html
    assert 'time_control_minutes' not in js[js.index('async function loadRecentGames'):js.index('async function heartbeatAndRefreshFriends')]
    assert 'text-align:center' in html
    assert '.profile-game-result.win{background:#48c879}' in html
    assert '.profile-game-result.loss{background:#e46b69}' in html
    assert '.profile-game-result.draw{background:#e6c34b}' in html

def test_public_profile_compact_in_middle_column():
    profilejs=read('profile.js')
    public=read('player.html')
    publicjs=read('player.js')
    assert "publicProfileLink" not in profilejs
    assert "classList.add('embedded-public-profile')" in public
    assert 'html.embedded-public-profile .topbar,' in public
    assert 'html.embedded-public-profile .v2-mobile-nav,' in public
    assert 'html.embedded-public-profile .grid{display:grid;grid-template-columns:minmax(0,1fr)' in public
    assert '?embed=panel' in publicjs
    assert 'profile.js?v=20261009-compact-tiles-result-dots1' in read('profile.html')

if __name__=='__main__':
    test_settings_removed_and_actions_at_top()
    test_each_recent_game_in_one_horizontal_row_and_centered_icons()
    test_public_profile_compact_in_middle_column()
    print('Member toolbar and public panel layout: PASS')
