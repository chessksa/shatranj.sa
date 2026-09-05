from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')
index = Path('index.html').read_text(encoding='utf-8')

assert '<header' in index, 'Home page must contain a header element.'
assert "document.querySelector('header.home-header')" not in wrapper, (
    'Welcome ticker loader must not require a home-header class that the real home header does not have.'
)
assert "import('./welcome-ticker-core.mjs" in wrapper, (
    'Welcome ticker module must be loaded by the site notification wrapper.'
)
assert 'initWelcomeTicker' in wrapper, 'Welcome ticker initializer must be invoked.'

print('welcome ticker loader matches the actual home header markup')
