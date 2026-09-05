from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')
index = Path('index.html').read_text(encoding='utf-8')

assert '<div id="welcomeTicker" class="welcome-ticker"' in index, (
    'Home page must contain the visible welcome ticker directly below the header.'
)
assert 'id="welcomeTickerTrack"' in index, (
    'Home ticker must contain its scrolling track.'
)
assert 'id="welcomeTickerInlineStyles"' in index, (
    'Home ticker styles must be embedded in the home page.'
)
assert 'function renderWelcomeTicker' in index, (
    'Home page must render the ticker from the public player data it already loads.'
)
assert 'renderWelcomeTicker(ALL_PLAYERS);' in index, (
    'Ticker must refresh after public player data is loaded.'
)
assert 'home-welcome-ticker.js' not in index, (
    'Home page must not depend on the old external ticker loader.'
)
assert "import('./welcome-ticker-core.mjs" not in wrapper, (
    'Site-wide notification wrapper must not load the welcome ticker.'
)

print('welcome ticker is inline, visible, and home-page only')
