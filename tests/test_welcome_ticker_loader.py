from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')
index = Path('index.html').read_text(encoding='utf-8')
home_ticker = Path('home-welcome-ticker.js')

assert 'home-welcome-ticker.js?v=' in index, (
    'Home page must load its dedicated welcome ticker script.'
)
assert "window.__HOME_PLAYERS__=ALL_PLAYERS" in index, (
    'Home page must expose loaded public players to the ticker.'
)
assert "home-players-loaded" in index, (
    'Home page must notify the ticker when player data finishes loading.'
)
assert home_ticker.exists(), 'Dedicated home ticker script must exist.'
script = home_ticker.read_text(encoding='utf-8')
assert "document.getElementById('homeHero')" in script, (
    'Ticker script must refuse to run outside the home page.'
)
assert "id = 'welcomeTicker'" in script or "id='welcomeTicker'" in script, (
    'Ticker script must create the visible ticker element.'
)
assert "import('./welcome-ticker-core.mjs" not in wrapper, (
    'Site-wide notification wrapper must not load the welcome ticker.'
)

print('welcome ticker is dedicated to the home page and uses loaded player data')
