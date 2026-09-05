from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')
index = Path('index.html').read_text(encoding='utf-8')

assert '<div id="welcomeTicker" class="welcome-ticker"' in index, (
    'Home page must contain a visible welcome ticker directly below the header.'
)
assert 'id="welcomeTickerTrack"' in index, 'Home ticker must contain its scrolling track.'
assert 'function renderWelcomeTicker' in index, (
    'Home page must render the ticker from the already-loaded public player data.'
)
assert 'renderWelcomeTicker(ALL_PLAYERS)' in index, (
    'Ticker must refresh whenever public players are loaded.'
)
assert "import('./welcome-ticker-core.mjs" not in wrapper, (
    'Site-wide notification wrapper must not load the welcome ticker; it belongs on the home page only.'
)

print('welcome ticker is inline, visible, and home-page only')
