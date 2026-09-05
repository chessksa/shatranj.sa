from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')

expected = "if(headerPlayers) headerPlayers.textContent=500 + ALL_PLAYERS.length;"
old = "if(headerPlayers) headerPlayers.textContent=ALL_PLAYERS.filter(player=>!player.is_synthetic).length;"

assert expected in html, 'subscriber counter must start at 500 and include all accounts'
assert old not in html, 'subscriber counter must not exclude synthetic accounts'

print('subscriber counter baseline: PASS')
