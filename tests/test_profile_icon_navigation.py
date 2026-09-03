from pathlib import Path
import re

html = Path('profile.html').read_text(encoding='utf-8')
js = Path('profile.js').read_text(encoding='utf-8')

links = re.findall(r'<a\b[^>]*class="[^"]*profile-nav-item[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.S)
assert len(links) == 5, f'expected 5 profile navigation icons, found {len(links)}'

expected = {
    'profile-section.html?section=friends': 'friendsCount',
    'profile-section.html?section=friend-requests': 'incomingCount',
    'profile-section.html?section=sent-requests': 'outgoingCount',
    'profile-section.html?section=challenges': 'incomingChallengesCount',
    'profile-section.html?section=sent-challenges': 'outgoingChallengesCount',
}

for href, count_id in expected.items():
    matching = [body for link_href, body in links if link_href == href]
    assert matching, f'missing profile navigation destination {href}'
    assert f'id="{count_id}"' in matching[0], f'{count_id} must appear inside {href}'
    assert 'profile-nav-icon' in matching[0], f'{href} must contain an icon'

compact = re.sub(r'\s+', '', html)
assert '.profile-nav-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))' in compact, 'navigation grid must have five equal columns'
assert '.profile-nav-item{min-height:86px' in compact, 'desktop icon tiles must share equal minimum height'
assert 'data-collapse-target=' not in html, 'dashboard must not contain collapsible section controls'

assert 'id="recentGames"' in html and 'id="recentGames" hidden' not in html, 'recent games must remain visible'
assert 'id="achievementsList"' in html and 'id="achievementsList" hidden' not in html, 'achievements must remain visible'

assert 'async function loadProfileNavigationCounts()' in js, 'dashboard count loader missing'
assert 'loadProfileNavigationCounts()' in js, 'dashboard count loader must be called'
assert 'function setupProfileSectionToggles()' not in js, 'old collapse setup must be removed'

for rpc in ['get_my_friends', 'get_my_friend_requests', 'get_my_friend_challenges']:
    assert rpc in js, f'count loader must use {rpc}'

print('profile icon navigation: PASS')
