from pathlib import Path

config = Path('config.js').read_text(encoding='utf-8')
play = Path('play.html').read_text(encoding='utf-8')

assert "document.querySelector('.panel-stack > .player-card')" in config, 'prematch must select the first player card even when side header is first'
assert ".panel-stack > .player-card:first-child" not in config, 'prematch must not depend on player card being the first child'
assert 'config.js?v=20260903-2' in play, 'play page must load a fresh config.js version'

print('play prematch with side header: PASS')
