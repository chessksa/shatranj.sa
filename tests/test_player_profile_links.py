from pathlib import Path

index = Path('index.html').read_text(encoding='utf-8')
invite = Path('home-invite.js').read_text(encoding='utf-8')
play_html = Path('play.html').read_text(encoding='utf-8')
play_js = Path('play-live.js').read_text(encoding='utf-8')

assert 'href="player.html?id=${encodeURIComponent(player.id)}"' in index, 'ranking player names must link to player.html by id'
assert 'home-invite-name-link' in invite and 'player.html?id=${encodeURIComponent(player.id)}' in invite, 'invite search names must link to public player profiles'
assert 'class="name player-profile-link" id="topName"' in play_html, 'top player name must be an anchor'
assert 'class="name player-profile-link" id="bottomName"' in play_html, 'bottom player name must be an anchor'
assert 'white_player_id' in play_js and 'black_player_id' in play_js, 'live game rendering must use player ids'
assert 'setPlayerProfileLink(topNameEl, top)' in play_js, 'top live player link must be wired'
assert 'setPlayerProfileLink(bottomNameEl, bottom)' in play_js, 'bottom live player link must be wired'

print('player profile links: PASS')
