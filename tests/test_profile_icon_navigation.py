from pathlib import Path
import re

html = Path('profile.html').read_text(encoding='utf-8')
js = Path('profile.js').read_text(encoding='utf-8')

links = re.findall(r'<a\b[^>]*class="[^"]*dashboard-icon-item[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.S)
assert len(links) == 5, f'expected 5 linked member navigation icons, found {len(links)}'

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
    assert 'dashboard-icon-glyph' in matching[0], f'{href} must contain a consistent icon glyph'

compact = re.sub(r'\s+', '', html)
assert '.dashboard-icon-row{display:grid;grid-template-columns:repeat(10,minmax(0,1fr))' in compact, 'member dashboard must use one ten-column icon row'
assert '.dashboard-icon-item{' in compact, 'unified member icon styling must exist'
assert 'data-collapse-target=' not in html, 'dashboard must not contain collapsible section controls'

assert 'id="recentGames"' in html and 'id="recentGames" hidden' not in html, 'recent games must remain visible'
assert 'id="achievementsList"' not in html, 'old achievements panel must remain removed'
assert 'id="playerRankBadge"' in html, 'rank badge must remain beside the player name'

assert 'async function loadProfileNavigationCounts()' in js, 'dashboard count loader missing'
assert 'loadProfileNavigationCounts()' in js, 'dashboard count loader must be called'
assert 'function setupProfileSectionToggles()' not in js, 'old collapse setup must be removed'

for rpc in ['get_my_friends', 'get_my_friend_requests', 'get_my_friend_challenges']:
    assert rpc in js, f'count loader must use {rpc}'

print('profile icon navigation: PASS')
