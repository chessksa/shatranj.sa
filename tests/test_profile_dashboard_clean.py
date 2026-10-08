from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
read=lambda p:(ROOT/p).read_text(encoding='utf-8')

def test_duplicate_header_and_identity_removed():
    html=read('profile.html')
    assert 'class="topbar"' not in html
    assert 'id="profileHero"' not in html
    assert 'id="playerName"' not in html
    assert 'id="avatarImage"' not in html
    assert 'id="heroRating"' not in html
    assert 'id="playerRankBadge"' not in html
    assert 'id="statRating"' not in html
    assert 'id="statGames"' in html
    assert 'id="statWins"' in html
    assert 'id="statDraws"' in html
    assert 'id="statLosses"' in html

def test_dashboard_is_compact_with_nonduplicated_sections():
    html=read('profile.html')
    assert 'class="profile-stats-grid"' in html
    assert 'class="profile-links-grid"' in html
    assert html.count('class="profile-action"')==5
    assert 'id="recentGames"' in html
    assert '<details class="profile-settings">' in html
    assert '<details class="profile-settings" open' not in html
    for id in ('friendsCount','incomingCount','outgoingCount','incomingChallengesCount','outgoingChallengesCount'):
        assert f'id="{id}"' in html
    assert 'overflow-x:hidden' in html

def test_functionality_preserved_after_cleanup():
    html=read('profile.html')
    js=read('profile.js')
    shell=read('v2/home/desktop-board-shell.mjs')
    css=read('v2/home/desktop-board-shell.css')
    for element_id in ('avatarInput','publicProfileLink','logoutBtn','challengeModal','recentGames'):
        assert f'id="{element_id}"' in html
    assert "'get_my_player_profile'" in js
    assert "'get_public_player_profile'" in js
    assert "'get_public_player_recent_games'" in js
    assert "'get_my_friend_challenges'" in js
    assert 'shatranj-profile-avatar-updated' in js
    assert 'shatranj-profile-avatar-updated' in shell
    assert 'profile-view .desktop-dashboard-view-head{display:none!important}' in css

if __name__=='__main__':
    test_duplicate_header_and_identity_removed()
    test_dashboard_is_compact_with_nonduplicated_sections()
    test_functionality_preserved_after_cleanup()
    print('Compact unique member dashboard: PASS')
