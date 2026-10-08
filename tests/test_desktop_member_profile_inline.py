from pathlib import Path
root=Path(__file__).resolve().parents[1]
read=lambda p:(root/p).read_text(encoding='utf-8')

def test_member_card_opens_profile_inside_current_workspace():
    js=read('v2/home/desktop-board-shell.mjs')
    css=read('v2/home/desktop-board-shell.css')
    assert 'class="desktop-member-profile" href="profile.html"' in js
    assert "event.target.closest('.desktop-member-profile')" in js
    assert "showDashboard('profile');" in js
    assert "embeddedPageView(body,'profile.html','الملف الشخصي')" in js
    assert "view.classList.toggle('profile-view',id==='profile')" in js
    assert "desktop-dashboard-view.profile-view .desktop-dashboard-view-body" in css
    assert "['home','ranking','tournaments','invite','computer','puzzles','learn','profile']" in js

def test_username_uses_authoritative_player_profile():
    js=read('v2/home/desktop-board-shell.mjs')
    css=read('v2/home/desktop-member-card-v2.css')
    assert 'id="desktopMemberUsername"' in js
    assert "get_my_player_profile" in js
    assert "get_public_player_profile" in js
    assert "el.textContent=username?'@'+username:'';" in js
    assert "el.hidden=!username" in js
    assert '.desktop-member-username[hidden]{display:none!important}' in css

def test_embedding_preserves_existing_profile_features():
    html=read('profile.html')
    assert "get('embed')==='panel'" in html
    assert "classList.add('embedded-profile')" in html
    assert 'class="topbar"' not in html
    assert 'id="profileHero"' not in html
    assert 'class="profile-stats-grid"' in html
    assert 'class="profile-links-grid"' in html
    assert 'class="profile-settings"' in html
    assert 'profile.js?v=' in html

if __name__=='__main__':
    test_member_card_opens_profile_inside_current_workspace()
    test_username_uses_authoritative_player_profile()
    test_embedding_preserves_existing_profile_features()
    print('Desktop member in-panel profile and username: PASS')
