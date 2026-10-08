from pathlib import Path
import re
html=Path('profile.html').read_text(encoding='utf-8')
js=Path('profile.js').read_text(encoding='utf-8')
links=re.findall(r'<a class="profile-action" href="([^"]+)">([\s\S]*?)</a>',html)
assert len(links)==5
expected={
'profile-section.html?section=friends':'friendsCount',
'profile-section.html?section=friend-requests':'incomingCount',
'profile-section.html?section=sent-requests':'outgoingCount',
'profile-section.html?section=challenges':'incomingChallengesCount',
'profile-section.html?section=sent-challenges':'outgoingChallengesCount'}
for href,id in expected.items():
    assert any(href==link and f'id="{id}"' in content for link,content in links)
assert 'async function loadProfileNavigationCounts()' in js
for rpc in ['get_my_friends','get_my_friend_requests','get_my_friend_challenges']:
    assert rpc in js
print('compact member navigation: PASS')
