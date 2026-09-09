from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WATCH = (ROOT / 'watch.html').read_text(encoding='utf-8')
HUMAN = ROOT / 'human-watch.html'

assert 'play.html?spectate=' not in WATCH, 'watch list must not send spectators into the playable game page'
assert 'human-watch.html?game=' in WATCH, 'human games must open the dedicated read-only spectator page'
assert HUMAN.exists(), 'dedicated human spectator page is required'

src = HUMAN.read_text(encoding='utf-8')
assert ".from('live_games')" in src, 'spectator must read the authoritative live_games row'
assert ".eq('id',gameId)" in src or ".eq('id', gameId)" in src, 'spectator must load the selected game id'
assert 'setInterval(fetchGame' in src, 'spectator must keep the board synchronized while watching'
assert '.insert(' not in src and '.update(' not in src and '.delete(' not in src and '.rpc(' not in src, 'spectator page must be read-only'
assert "new URLSearchParams(location.search).get('game')" in src, 'spectator route must accept the game query parameter'

print('human spectator route: PASS')
