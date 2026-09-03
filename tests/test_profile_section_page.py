from pathlib import Path

html_path = Path('profile-section.html')
js_path = Path('profile-section.js')

assert html_path.exists(), 'profile-section.html must exist'
assert js_path.exists(), 'profile-section.js must exist'

html = html_path.read_text(encoding='utf-8')
js = js_path.read_text(encoding='utf-8')

for needle in [
    'id="sectionTitle"',
    'id="sectionList"',
    'href="profile.html"',
    'id="challengeModal"',
    'id="challengeMinutes"',
    'id="sendChallengeBtn"',
    'id="cancelChallengeModalBtn"',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'src="config.js"',
    'src="profile-section.js',
    'font-family:Arial,sans-serif',
    '#082d2f',
    'rgba(13,56,57,.88)',
    '#d4b467',
]:
    assert needle in html, f'missing section page requirement: {needle}'

assert 'const SECTION_CONFIG = {' in js, 'SECTION_CONFIG missing'
for key in ['friends', "'friend-requests'", "'sent-requests'", 'challenges', "'sent-challenges'"]:
    assert key in js, f'missing section config key {key}'

assert "new URLSearchParams(location.search).get('section')" in js, 'section query parameter must drive page'
for rpc in [
    'get_my_friends',
    'get_my_friend_requests',
    'get_my_friend_challenges',
    'respond_friend_request',
    'cancel_friend_request',
    'remove_friend',
    'send_friend_challenge',
    'respond_friend_challenge',
    'cancel_friend_challenge',
    'get_my_challenge_game_access',
]:
    assert rpc in js, f'missing existing RPC behavior {rpc}'

for action in [
    'challenge-friend',
    'accept-request',
    'reject-request',
    'cancel-request',
    'remove-friend',
    'accept-challenge',
    'reject-challenge',
    'cancel-challenge',
    'open-challenge',
]:
    assert action in js, f'missing section action {action}'

assert 'client.auth.getSession()' in js, 'section page must verify auth session'
assert "location.href = 'index.html#register'" in js, 'unauthenticated section page must return to sign in'
assert 'function storeChallengeAccess(' in js, 'accepted challenge game access behavior missing'
assert 'async function loadSection()' in js, 'selected section loader missing'

print('profile section page: PASS')
