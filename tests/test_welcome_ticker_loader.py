from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')
index = Path('index.html').read_text(encoding='utf-8')
theme = Path('home-theme.css').read_text(encoding='utf-8')

assert '<div id="welcomeTicker" class="welcome-ticker"' in index, (
    'Home page must contain the visible welcome ticker.'
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

header_start = index.index('<header class="home-header">')
header_end = index.index('</header>', header_start)
ticker_pos = index.index('<div id="welcomeTicker" class="welcome-ticker"')
assert ticker_pos > header_end, (
    'Welcome ticker must be a standalone element after the header, not inside the sticky header.'
)

assert '.welcome-ticker{grid-column:1/-1;grid-row:2' in theme, (
    'Desktop layout must reserve a dedicated full-width grid row for the ticker.'
)
assert '.home-hero{grid-column:3;grid-row:3}' in theme, (
    'Desktop hero must start below the ticker row.'
)
assert '#ranking{grid-column:2;grid-row:3/5}' in theme, (
    'Desktop ranking must start below the ticker row.'
)
assert '.welcome-ticker{order:2}' in theme, (
    'Mobile layout must place ticker immediately after the header.'
)
assert '.home-hero{order:3' in theme, (
    'Mobile hero must follow the independent ticker.'
)

assert "import('./welcome-ticker-core.mjs" not in wrapper, (
    'Site-wide notification wrapper must not load the welcome ticker.'
)

print('welcome ticker is standalone, non-overlapping, and home-page only')
