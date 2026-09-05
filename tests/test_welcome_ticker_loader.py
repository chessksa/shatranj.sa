from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')
index = Path('index.html').read_text(encoding='utf-8')

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

# The title stays fixed while only member name/country/city scroll in the remaining space.
assert '<span class="welcome-ticker-label">آخر المسجلين في شطرنج العرب</span>' in index, (
    'Ticker must show a fixed latest-members label.'
)
assert 'class="welcome-ticker-viewport"' in index, (
    'Ticker must separate the fixed label from the scrolling viewport.'
)
assert '.welcome-ticker-label{flex:0 0 auto' in index, (
    'Fixed label must not move with the ticker track.'
)
assert '.welcome-ticker-viewport{min-width:0;flex:1;overflow:hidden' in index, (
    'Only the member details area should scroll.'
)
assert '`نرحب بانضمام ${name}' not in index, (
    'Scrolling items must contain only name, country and city.'
)
assert '`${name} — ${country}، ${city}`' in index, (
    'Scrolling item must render name, country and city.'
)

header_start = index.index('<header class="home-header">')
header_end = index.index('</header>', header_start)
ticker_pos = index.index('<div id="welcomeTicker" class="welcome-ticker"')
assert ticker_pos > header_end, (
    'Welcome ticker must be a standalone element after the header, not inside the sticky header.'
)

assert '.welcome-ticker{grid-column:1/-1;grid-row:2' in index, (
    'Desktop layout must reserve a dedicated full-width grid row for the ticker.'
)
assert '.home-hero{grid-column:3!important;grid-row:3!important}' in index, (
    'Desktop hero must start below the ticker row.'
)
assert '#ranking{grid-column:2!important;grid-row:3/5!important}' in index, (
    'Desktop ranking must start below the ticker row.'
)
assert '.welcome-ticker{order:2}' in index, (
    'Mobile layout must place ticker immediately after the header.'
)
assert '.home-hero{order:3!important}' in index, (
    'Mobile hero must follow the independent ticker.'
)

# A signed-in desktop has its own compact grid in home-theme.css. It must also
# reserve the ticker row; otherwise the hero/features overlap or disappear.
assert 'body.home-signed-in{grid-template-rows:64px 34px minmax(0,1fr) 104px 38px!important}' in index, (
    'Signed-in desktop layout must reserve a dedicated 34px ticker row.'
)
assert 'body.home-signed-in .welcome-ticker{grid-row:2!important}' in index, (
    'Signed-in ticker must occupy its own row.'
)
assert 'body.home-signed-in .home-hero{grid-row:3!important}' in index, (
    'Signed-in hero must stay visible below the ticker.'
)
assert 'body.home-signed-in #ranking{grid-row:3/5!important}' in index, (
    'Signed-in ranking must align beside the restored right-side content.'
)
assert 'body.home-signed-in .home-features{grid-row:4!important}' in index, (
    'Signed-in feature cards must remain below the hero.'
)
assert 'body.home-signed-in footer{grid-row:5!important}' in index, (
    'Signed-in footer must remain below the content instead of overlapping it.'
)

assert "import('./welcome-ticker-core.mjs" not in wrapper, (
    'Site-wide notification wrapper must not load the welcome ticker.'
)

print('welcome ticker keeps a fixed label while member details scroll')
