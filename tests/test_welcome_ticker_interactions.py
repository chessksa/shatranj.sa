from pathlib import Path

source = Path('site-notifications.js').read_text(encoding='utf-8')

assert '#welcomeTicker:hover .welcome-ticker-track' in source, (
    'Welcome ticker must pause while the pointer is over it.'
)
assert 'animation-play-state:paused!important' in source, (
    'Hover pause must stop the ticker animation.'
)
assert 'welcome-player-link' in source, (
    'Ticker player names must be rendered as links.'
)
assert 'player.html?id=${encodeURIComponent(player.id)}' in source, (
    'Ticker player links must open the existing public player page by player UUID.'
)
assert "window.addEventListener('home-players-loaded',decorateLinks)" in source, (
    'Player links must be applied after home player data is loaded.'
)
assert "const divider = ' / ';" in source, (
    'Ticker player-name parsing must use a slash separator.'
)
assert ".replace(' — ',' / ')" in source, (
    'Existing ticker items must replace the dash separator with a slash.'
)
assert "match(/\\/\\s*([^،]+)(?:،|$)/)" in source, (
    'Country flag parsing must understand the slash separator.'
)

print('welcome ticker pauses on hover, links player names, and uses slash separator')
