from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')

assert "document.createElement('img')" in wrapper, (
    'Welcome ticker flags must use real image elements so they render on Windows/Edge.'
)
assert 'flagcdn.com' in wrapper, (
    'Welcome ticker flags must use image flag assets rather than platform-dependent emoji glyphs.'
)
assert 'String.fromCodePoint' not in wrapper, (
    'Welcome ticker must not rely on Unicode regional-indicator flag emoji.'
)
assert 'welcome-country-flag' in wrapper, (
    'Welcome ticker flag images must retain the dedicated flag class for sizing.'
)

print('welcome ticker uses real country flag images')
